<?php

namespace Modules\Banking\Parsers;

use Carbon\Carbon;
use SimpleXMLElement;

class CamtParser extends BaseParser
{
    protected ?SimpleXMLElement $xml = null;
    protected array $namespaces = [];

    public function getFormat(): string
    {
        return 'camt';
    }

    public function getSupportedExtensions(): array
    {
        return ['xml', 'camt', 'camt053'];
    }

    public function validate(string $content): bool
    {
        return str_contains($content, 'camt.053') ||
               str_contains($content, 'BkToCstmrStmt') ||
               str_contains($content, 'urn:iso:std:iso:20022');
    }

    public function parse(string $content): array
    {
        $this->transactions = [];

        try {
            $this->xml = new SimpleXMLElement($content);
            $this->namespaces = $this->xml->getNamespaces(true);

            // Register default namespace
            $defaultNs = $this->getDefaultNamespace();
            if ($defaultNs) {
                $this->xml->registerXPathNamespace('ns', $defaultNs);
            }

            $this->parseStatements();
        } catch (\Exception $e) {
            throw new \RuntimeException("Failed to parse CAMT file: " . $e->getMessage());
        }

        return $this->transactions;
    }

    protected function getDefaultNamespace(): ?string
    {
        foreach ($this->namespaces as $prefix => $uri) {
            if (empty($prefix) || str_contains($uri, 'iso:20022')) {
                return $uri;
            }
        }
        return $this->namespaces[''] ?? null;
    }

    protected function parseStatements(): void
    {
        // Try different CAMT paths
        $statements = $this->xpath('//ns:BkToCstmrStmt/ns:Stmt');
        if (empty($statements)) {
            $statements = $this->xpath('//ns:Stmt');
        }
        if (empty($statements)) {
            // Try without namespace
            $statements = $this->xml->xpath('//Stmt');
        }

        foreach ($statements as $stmt) {
            $this->parseStatement($stmt);
        }
    }

    protected function parseStatement(SimpleXMLElement $stmt): void
    {
        // Extract account info
        $acct = $this->getChild($stmt, 'Acct');
        if ($acct) {
            $id = $this->getChild($acct, 'Id');
            if ($id) {
                $this->accountNumber = (string) ($this->getChild($id, 'IBAN') ?? $this->getChild($id, 'Othr/Id'));
            }
            $ccy = $this->getChild($acct, 'Ccy');
            if ($ccy) {
                $this->currency = (string) $ccy;
            }
        }

        // Extract balances
        $balances = $this->getChildren($stmt, 'Bal');
        foreach ($balances as $bal) {
            $type = (string) $this->getChild($bal, 'Tp/CdOrPrtry/Cd');
            $amt = $this->getChild($bal, 'Amt');
            $cdtDbt = (string) $this->getChild($bal, 'CdtDbtInd');

            if ($amt) {
                $amount = (float) (string) $amt;
                if ($cdtDbt === 'DBIT') {
                    $amount = -$amount;
                }

                if ($type === 'OPBD' || $type === 'PRCD') {
                    $this->openingBalance = $amount;
                } elseif ($type === 'CLBD' || $type === 'CLAV') {
                    $this->closingBalance = $amount;
                }
            }
        }

        // Extract entries
        $entries = $this->getChildren($stmt, 'Ntry');
        foreach ($entries as $entry) {
            $this->parseEntry($entry);
        }
    }

    protected function parseEntry(SimpleXMLElement $entry): void
    {
        // Basic entry info
        $amt = $this->getChild($entry, 'Amt');
        $cdtDbt = (string) $this->getChild($entry, 'CdtDbtInd');
        $bookgDt = $this->getChild($entry, 'BookgDt/Dt') ?? $this->getChild($entry, 'BookgDt/DtTm');
        $valDt = $this->getChild($entry, 'ValDt/Dt') ?? $this->getChild($entry, 'ValDt/DtTm');

        $amount = $amt ? (float) (string) $amt : 0;
        if ($cdtDbt === 'DBIT') {
            $amount = -$amount;
        }

        $currency = $amt ? (string) $amt['Ccy'] : $this->currency;
        $date = $bookgDt ? $this->parseCamtDate((string) $bookgDt) : null;

        // Entry details
        $ntryDtls = $this->getChild($entry, 'NtryDtls');
        if ($ntryDtls) {
            $txDtls = $this->getChildren($ntryDtls, 'TxDtls');
            if (!empty($txDtls)) {
                foreach ($txDtls as $tx) {
                    $this->parseTransactionDetails($tx, $amount, $currency, $date);
                }
                return;
            }
        }

        // If no detailed transactions, create one from entry
        $addtlNtryInf = (string) $this->getChild($entry, 'AddtlNtryInf');

        $this->transactions[] = $this->createTransaction([
            'date' => $date,
            'amount' => $amount,
            'currency_code' => $currency,
            'payment_ref' => $addtlNtryInf ?: 'Bank Entry',
            'raw' => $this->xmlToArray($entry),
        ]);
    }

    protected function parseTransactionDetails(SimpleXMLElement $tx, float $entryAmount, string $currency, ?Carbon $date): void
    {
        // Amount override
        $amt = $this->getChild($tx, 'Amt');
        $amount = $amt ? (float) (string) $amt : $entryAmount;
        $cdtDbt = (string) $this->getChild($tx, 'CdtDbtInd');
        if ($cdtDbt === 'DBIT' && $amount > 0) {
            $amount = -$amount;
        } elseif ($cdtDbt === 'CRDT' && $amount < 0) {
            $amount = -$amount;
        }

        // References
        $refs = $this->getChild($tx, 'Refs');
        $endToEndId = $refs ? (string) $this->getChild($refs, 'EndToEndId') : null;
        $msgId = $refs ? (string) $this->getChild($refs, 'MsgId') : null;

        // Related parties
        $rltdPties = $this->getChild($tx, 'RltdPties');
        $partnerName = null;
        $accountNumber = null;

        if ($rltdPties) {
            // Creditor (for debits) or Debtor (for credits)
            $party = $amount < 0
                ? $this->getChild($rltdPties, 'Cdtr')
                : $this->getChild($rltdPties, 'Dbtr');

            if ($party) {
                $partnerName = (string) $this->getChild($party, 'Nm');
            }

            // Account
            $partyAcct = $amount < 0
                ? $this->getChild($rltdPties, 'CdtrAcct')
                : $this->getChild($rltdPties, 'DbtrAcct');

            if ($partyAcct) {
                $id = $this->getChild($partyAcct, 'Id');
                if ($id) {
                    $accountNumber = (string) ($this->getChild($id, 'IBAN') ?? $this->getChild($id, 'Othr/Id'));
                }
            }
        }

        // Remittance info
        $rmtInf = $this->getChild($tx, 'RmtInf');
        $paymentRef = null;
        if ($rmtInf) {
            $ustrd = $this->getChildren($rmtInf, 'Ustrd');
            if (!empty($ustrd)) {
                $paymentRef = implode(' ', array_map(fn($u) => (string) $u, $ustrd));
            }
        }

        // Additional info
        $addtlTxInf = (string) $this->getChild($tx, 'AddtlTxInf');
        if (!$paymentRef && $addtlTxInf) {
            $paymentRef = $addtlTxInf;
        }

        // Transaction type
        $bankTxCd = $this->getChild($tx, 'BkTxCd');
        $txType = null;
        if ($bankTxCd) {
            $domn = $this->getChild($bankTxCd, 'Domn');
            if ($domn) {
                $txType = (string) $this->getChild($domn, 'Cd');
            }
        }

        $this->transactions[] = $this->createTransaction([
            'date' => $date,
            'amount' => $amount,
            'currency_code' => $currency,
            'payment_ref' => $paymentRef ?: $endToEndId ?: 'Transaction',
            'partner_name' => $partnerName,
            'account_number' => $accountNumber,
            'transaction_type' => $txType,
            'raw' => $this->xmlToArray($tx),
        ]);
    }

    protected function parseCamtDate(string $dateStr): ?Carbon
    {
        if (str_contains($dateStr, 'T')) {
            return Carbon::parse($dateStr);
        }
        return Carbon::createFromFormat('Y-m-d', $dateStr);
    }

    protected function xpath(string $path): array
    {
        $result = $this->xml->xpath($path);
        return $result ?: [];
    }

    protected function getChild(SimpleXMLElement $element, string $path): ?SimpleXMLElement
    {
        $parts = explode('/', $path);
        $current = $element;

        foreach ($parts as $part) {
            $children = $current->children();
            $found = false;

            foreach ($children as $name => $child) {
                if ($name === $part) {
                    $current = $child;
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                // Try with namespace
                foreach ($this->namespaces as $ns) {
                    $nsChildren = $current->children($ns);
                    foreach ($nsChildren as $name => $child) {
                        if ($name === $part) {
                            $current = $child;
                            $found = true;
                            break 2;
                        }
                    }
                }
            }

            if (!$found) {
                return null;
            }
        }

        return $current;
    }

    protected function getChildren(SimpleXMLElement $element, string $name): array
    {
        $result = [];
        $children = $element->children();

        foreach ($children as $childName => $child) {
            if ($childName === $name) {
                $result[] = $child;
            }
        }

        // Try with namespace
        if (empty($result)) {
            foreach ($this->namespaces as $ns) {
                $nsChildren = $element->children($ns);
                foreach ($nsChildren as $childName => $child) {
                    if ($childName === $name) {
                        $result[] = $child;
                    }
                }
            }
        }

        return $result;
    }

    protected function xmlToArray(SimpleXMLElement $xml): array
    {
        return json_decode(json_encode($xml), true) ?: [];
    }
}
