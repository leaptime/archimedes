<?php

namespace Modules\Banking\Parsers;

use Carbon\Carbon;

class OfxParser extends BaseParser
{
    public function getFormat(): string
    {
        return 'ofx';
    }

    public function getSupportedExtensions(): array
    {
        return ['ofx', 'qfx'];
    }

    public function validate(string $content): bool
    {
        return str_contains($content, '<OFX>') || str_contains($content, 'OFXHEADER');
    }

    public function parse(string $content): array
    {
        $this->transactions = [];

        // Convert SGML to XML if needed
        $content = $this->normalizeOfx($content);

        // Extract account info
        $this->extractAccountInfo($content);

        // Extract transactions
        $this->extractTransactions($content);

        return $this->transactions;
    }

    protected function normalizeOfx(string $content): string
    {
        // Remove OFX headers (before <OFX>)
        $ofxStart = stripos($content, '<OFX>');
        if ($ofxStart !== false) {
            $content = substr($content, $ofxStart);
        }

        // Close self-closing tags for SGML format
        $content = preg_replace('/<(\w+)>([^<]+)(?=<(?!\/))/s', '<$1>$2</$1>', $content);

        // Handle unclosed tags at end of lines
        $lines = explode("\n", $content);
        $result = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (preg_match('/^<(\w+)>(.+)$/', $line, $matches)) {
                if (!preg_match('/<\/\w+>$/', $line)) {
                    $line = "<{$matches[1]}>{$matches[2]}</{$matches[1]}>";
                }
            }
            $result[] = $line;
        }

        return implode("\n", $result);
    }

    protected function extractAccountInfo(string $content): void
    {
        // Account number
        if (preg_match('/<ACCTID>([^<]+)/i', $content, $matches)) {
            $this->accountNumber = trim($matches[1]);
        }

        // Currency
        if (preg_match('/<CURDEF>([^<]+)/i', $content, $matches)) {
            $this->currency = trim($matches[1]);
        }

        // Opening balance
        if (preg_match('/<BALAMT>([^<]+)/i', $content, $matches)) {
            $this->openingBalance = (float) trim($matches[1]);
        }

        // Closing balance
        if (preg_match('/<LEDGERBAL>.*?<BALAMT>([^<]+)/is', $content, $matches)) {
            $this->closingBalance = (float) trim($matches[1]);
        }
    }

    protected function extractTransactions(string $content): void
    {
        // Find all STMTTRN blocks
        preg_match_all('/<STMTTRN>(.*?)<\/STMTTRN>/is', $content, $matches);

        foreach ($matches[1] as $transBlock) {
            $transaction = $this->parseTransaction($transBlock);
            if ($transaction && $transaction['date']) {
                $this->transactions[] = $transaction;
            }
        }
    }

    protected function parseTransaction(string $block): array
    {
        $data = [];

        // Transaction type
        if (preg_match('/<TRNTYPE>([^<]+)/i', $block, $matches)) {
            $data['transaction_type'] = trim($matches[1]);
        }

        // Date
        if (preg_match('/<DTPOSTED>([^<]+)/i', $block, $matches)) {
            $dateStr = trim($matches[1]);
            // OFX dates are typically YYYYMMDDHHMMSS or YYYYMMDD
            $data['date'] = $this->parseOfxDate($dateStr);
        }

        // Amount
        if (preg_match('/<TRNAMT>([^<]+)/i', $block, $matches)) {
            $data['amount'] = (float) trim($matches[1]);
        }

        // Reference/ID
        if (preg_match('/<FITID>([^<]+)/i', $block, $matches)) {
            $data['fitid'] = trim($matches[1]);
        }

        // Name/Payee
        if (preg_match('/<NAME>([^<]+)/i', $block, $matches)) {
            $data['partner_name'] = trim($matches[1]);
        }

        // Memo
        if (preg_match('/<MEMO>([^<]+)/i', $block, $matches)) {
            $memo = trim($matches[1]);
            $data['payment_ref'] = $memo;
        }

        // Check number
        if (preg_match('/<CHECKNUM>([^<]+)/i', $block, $matches)) {
            $data['check_number'] = trim($matches[1]);
        }

        // If no payment_ref, use name or transaction type
        if (empty($data['payment_ref'])) {
            $data['payment_ref'] = $data['partner_name'] ?? $data['transaction_type'] ?? 'Transaction';
        }

        $data['raw'] = $block;

        return $this->createTransaction($data);
    }

    protected function parseOfxDate(string $dateStr): ?Carbon
    {
        $dateStr = preg_replace('/\[.*\]/', '', $dateStr); // Remove timezone info

        if (strlen($dateStr) >= 14) {
            // YYYYMMDDHHMMSS
            return Carbon::createFromFormat('YmdHis', substr($dateStr, 0, 14));
        } elseif (strlen($dateStr) >= 8) {
            // YYYYMMDD
            return Carbon::createFromFormat('Ymd', substr($dateStr, 0, 8));
        }

        return $this->normalizeDate($dateStr);
    }
}
