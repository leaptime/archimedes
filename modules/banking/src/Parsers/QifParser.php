<?php

namespace Modules\Banking\Parsers;

use Carbon\Carbon;

class QifParser extends BaseParser
{
    protected string $accountType = 'Bank';

    public function getFormat(): string
    {
        return 'qif';
    }

    public function getSupportedExtensions(): array
    {
        return ['qif'];
    }

    public function validate(string $content): bool
    {
        return str_starts_with(trim($content), '!');
    }

    public function parse(string $content): array
    {
        $this->transactions = [];
        $lines = explode("\n", $content);
        $currentTransaction = [];
        $inTransaction = false;

        foreach ($lines as $line) {
            $line = trim($line);

            if (empty($line)) {
                continue;
            }

            // Account type header
            if (str_starts_with($line, '!Type:')) {
                $this->accountType = substr($line, 6);
                continue;
            }

            if (str_starts_with($line, '!')) {
                continue;
            }

            // End of transaction marker
            if ($line === '^') {
                if (!empty($currentTransaction)) {
                    $transaction = $this->parseTransaction($currentTransaction);
                    if ($transaction && $transaction['date']) {
                        $this->transactions[] = $transaction;
                    }
                }
                $currentTransaction = [];
                $inTransaction = false;
                continue;
            }

            // Parse field
            $code = $line[0];
            $value = substr($line, 1);

            switch ($code) {
                case 'D': // Date
                    $currentTransaction['date'] = $value;
                    $inTransaction = true;
                    break;
                case 'T': // Amount
                case 'U': // Amount (alternative)
                    $currentTransaction['amount'] = $value;
                    break;
                case 'P': // Payee
                    $currentTransaction['payee'] = $value;
                    break;
                case 'M': // Memo
                    $currentTransaction['memo'] = $value;
                    break;
                case 'N': // Check number or reference
                    $currentTransaction['reference'] = $value;
                    break;
                case 'L': // Category
                    $currentTransaction['category'] = $value;
                    break;
                case 'C': // Cleared status
                    $currentTransaction['cleared'] = $value;
                    break;
                case 'A': // Address line
                    $currentTransaction['address'][] = $value;
                    break;
            }
        }

        // Handle last transaction if no ending marker
        if (!empty($currentTransaction)) {
            $transaction = $this->parseTransaction($currentTransaction);
            if ($transaction && $transaction['date']) {
                $this->transactions[] = $transaction;
            }
        }

        return $this->transactions;
    }

    protected function parseTransaction(array $data): array
    {
        $result = [];

        // Parse date (QIF uses various formats like M/D/Y or D/M/Y)
        if (isset($data['date'])) {
            $result['date'] = $this->parseQifDate($data['date']);
        }

        // Parse amount
        if (isset($data['amount'])) {
            $result['amount'] = $this->normalizeAmount($data['amount']);
        }

        // Partner name
        if (isset($data['payee'])) {
            $result['partner_name'] = $data['payee'];
        }

        // Payment reference - combine memo and reference
        $refs = [];
        if (!empty($data['reference'])) {
            $refs[] = $data['reference'];
        }
        if (!empty($data['memo'])) {
            $refs[] = $data['memo'];
        }
        $result['payment_ref'] = implode(' - ', $refs) ?: ($data['payee'] ?? 'Transaction');

        // Transaction type from category
        if (isset($data['category'])) {
            $result['transaction_type'] = $data['category'];
        }

        $result['raw'] = $data;

        return $this->createTransaction($result);
    }

    protected function parseQifDate(string $dateStr): ?Carbon
    {
        // QIF dates can be:
        // M/D/Y (US format)
        // D/M/Y (European format)
        // M/D'Y (with apostrophe for short year)
        // M-D-Y

        $dateStr = str_replace("'", '/', $dateStr);
        $dateStr = str_replace('-', '/', $dateStr);

        // Try US format first (most common in QIF)
        $parts = explode('/', $dateStr);
        if (count($parts) === 3) {
            $month = (int) $parts[0];
            $day = (int) $parts[1];
            $year = (int) $parts[2];

            // Handle 2-digit years
            if ($year < 100) {
                $year += $year > 50 ? 1900 : 2000;
            }

            // Validate and try US format
            if ($month >= 1 && $month <= 12 && $day >= 1 && $day <= 31) {
                try {
                    return Carbon::create($year, $month, $day);
                } catch (\Exception $e) {
                    // Try European format if US fails
                }
            }

            // Try European format
            $day = (int) $parts[0];
            $month = (int) $parts[1];
            if ($month >= 1 && $month <= 12 && $day >= 1 && $day <= 31) {
                try {
                    return Carbon::create($year, $month, $day);
                } catch (\Exception $e) {
                    // Fall through to generic parsing
                }
            }
        }

        return $this->normalizeDate($dateStr);
    }
}
