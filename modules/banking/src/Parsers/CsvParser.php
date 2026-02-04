<?php

namespace Modules\Banking\Parsers;

use Carbon\Carbon;

class CsvParser extends BaseParser
{
    protected string $delimiter = ',';
    protected bool $hasHeader = true;
    protected array $columnMapping = [];

    public function getFormat(): string
    {
        return 'csv';
    }

    public function getSupportedExtensions(): array
    {
        return ['csv', 'txt'];
    }

    public function setDelimiter(string $delimiter): self
    {
        $this->delimiter = $delimiter;
        return $this;
    }

    public function setHasHeader(bool $hasHeader): self
    {
        $this->hasHeader = $hasHeader;
        return $this;
    }

    public function setColumnMapping(array $mapping): self
    {
        $this->columnMapping = $mapping;
        return $this;
    }

    public function validate(string $content): bool
    {
        if (empty($content)) {
            return false;
        }

        $lines = explode("\n", trim($content));
        return count($lines) >= 1;
    }

    public function parse(string $content): array
    {
        $this->transactions = [];

        $this->detectDelimiter($content);
        $lines = str_getcsv($content, "\n");
        $headers = [];

        foreach ($lines as $index => $line) {
            if (empty(trim($line))) {
                continue;
            }

            $row = str_getcsv($line, $this->delimiter);

            if ($index === 0 && $this->hasHeader) {
                $headers = array_map('trim', $row);
                $this->detectColumnMapping($headers);
                continue;
            }

            $transaction = $this->parseRow($row, $headers);
            if ($transaction && $transaction['date'] && $transaction['amount'] !== 0) {
                $this->transactions[] = $transaction;
            }
        }

        return $this->transactions;
    }

    protected function detectDelimiter(string $content): void
    {
        $firstLine = strtok($content, "\n");
        $delimiters = [',', ';', "\t", '|'];
        $maxCount = 0;

        foreach ($delimiters as $delimiter) {
            $count = substr_count($firstLine, $delimiter);
            if ($count > $maxCount) {
                $maxCount = $count;
                $this->delimiter = $delimiter;
            }
        }
    }

    protected function detectColumnMapping(array $headers): void
    {
        if (!empty($this->columnMapping)) {
            return;
        }

        $normalizedHeaders = array_map(fn($h) => strtolower(trim($h)), $headers);
        $mapping = [];

        // Date patterns
        $datePatterns = ['date', 'datum', 'transaction date', 'booking date', 'value date', 'data'];
        foreach ($datePatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['date'] = $index;
                break;
            }
        }

        // Amount patterns
        $amountPatterns = ['amount', 'betrag', 'sum', 'value', 'importo', 'montant'];
        foreach ($amountPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['amount'] = $index;
                break;
            }
        }

        // Check for separate debit/credit columns
        $debitPatterns = ['debit', 'withdrawal', 'ausgabe', 'uscita'];
        $creditPatterns = ['credit', 'deposit', 'einnahme', 'entrata'];
        foreach ($debitPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['debit'] = $index;
                break;
            }
        }
        foreach ($creditPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['credit'] = $index;
                break;
            }
        }

        // Description patterns
        $descPatterns = ['description', 'memo', 'reference', 'payment reference', 'beschreibung', 'descrizione', 'libelle'];
        foreach ($descPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['payment_ref'] = $index;
                break;
            }
        }

        // Partner/Payee patterns
        $partnerPatterns = ['payee', 'partner', 'name', 'beneficiary', 'counterparty', 'recipient'];
        foreach ($partnerPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['partner_name'] = $index;
                break;
            }
        }

        // Account number
        $accountPatterns = ['account', 'iban', 'account number', 'counter account'];
        foreach ($accountPatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['account_number'] = $index;
                break;
            }
        }

        // Balance
        $balancePatterns = ['balance', 'saldo', 'running balance'];
        foreach ($balancePatterns as $pattern) {
            $index = array_search($pattern, $normalizedHeaders);
            if ($index !== false) {
                $mapping['balance'] = $index;
                break;
            }
        }

        $this->columnMapping = $mapping;
    }

    protected function parseRow(array $row, array $headers): ?array
    {
        $data = [];
        $mapping = $this->columnMapping;

        // Parse date
        $dateIndex = $mapping['date'] ?? 0;
        $dateStr = $row[$dateIndex] ?? null;
        $data['date'] = $dateStr ? $this->normalizeDate($dateStr) : null;

        // Parse amount
        if (isset($mapping['amount'])) {
            $data['amount'] = $this->normalizeAmount($row[$mapping['amount']] ?? '0');
        } elseif (isset($mapping['debit']) && isset($mapping['credit'])) {
            $debit = $this->normalizeAmount($row[$mapping['debit']] ?? '0');
            $credit = $this->normalizeAmount($row[$mapping['credit']] ?? '0');
            $data['amount'] = $credit - $debit;
        } else {
            // Try to find amount in any numeric column
            foreach ($row as $value) {
                $cleaned = preg_replace('/[^\d.,\-+]/', '', $value);
                if (!empty($cleaned) && is_numeric(str_replace(',', '.', $cleaned))) {
                    $data['amount'] = $this->normalizeAmount($value);
                    break;
                }
            }
        }

        // Parse other fields
        if (isset($mapping['payment_ref'])) {
            $data['payment_ref'] = trim($row[$mapping['payment_ref']] ?? '');
        }
        if (isset($mapping['partner_name'])) {
            $data['partner_name'] = trim($row[$mapping['partner_name']] ?? '');
        }
        if (isset($mapping['account_number'])) {
            $data['account_number'] = trim($row[$mapping['account_number']] ?? '');
        }
        if (isset($mapping['balance'])) {
            $data['running_balance'] = $this->normalizeAmount($row[$mapping['balance']] ?? '0');
        }

        $data['raw'] = array_combine(
            $headers ?: array_keys($row),
            array_pad($row, count($headers ?: $row), '')
        );

        return $this->createTransaction($data);
    }
}
