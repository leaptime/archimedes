<?php

namespace Modules\Banking\Parsers;

use Carbon\Carbon;

abstract class BaseParser implements ParserInterface
{
    protected array $transactions = [];
    protected ?string $accountNumber = null;
    protected ?float $openingBalance = null;
    protected ?float $closingBalance = null;
    protected ?Carbon $statementDate = null;
    protected ?string $currency = 'EUR';

    abstract public function parse(string $content): array;
    abstract public function getFormat(): string;
    abstract public function getSupportedExtensions(): array;

    public function validate(string $content): bool
    {
        return !empty($content);
    }

    public function getAccountNumber(): ?string
    {
        return $this->accountNumber;
    }

    public function getOpeningBalance(): ?float
    {
        return $this->openingBalance;
    }

    public function getClosingBalance(): ?float
    {
        return $this->closingBalance;
    }

    public function getStatementDate(): ?Carbon
    {
        return $this->statementDate;
    }

    public function getCurrency(): string
    {
        return $this->currency ?? 'EUR';
    }

    protected function normalizeDate(string $dateStr): ?Carbon
    {
        $formats = [
            'Y-m-d',
            'd/m/Y',
            'm/d/Y',
            'Ymd',
            'd-m-Y',
            'Y/m/d',
            'd.m.Y',
        ];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, trim($dateStr));
            } catch (\Exception $e) {
                continue;
            }
        }

        try {
            return Carbon::parse($dateStr);
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function normalizeAmount(string $amountStr, string $decimalSeparator = '.'): float
    {
        $amountStr = trim($amountStr);
        $amountStr = preg_replace('/[^\d.,\-+]/', '', $amountStr);

        if ($decimalSeparator === ',') {
            $amountStr = str_replace('.', '', $amountStr);
            $amountStr = str_replace(',', '.', $amountStr);
        } else {
            $amountStr = str_replace(',', '', $amountStr);
        }

        return (float) $amountStr;
    }

    protected function createTransaction(array $data): array
    {
        return [
            'date' => $data['date'] ?? null,
            'amount' => $data['amount'] ?? 0,
            'payment_ref' => $data['payment_ref'] ?? $data['description'] ?? null,
            'partner_name' => $data['partner_name'] ?? null,
            'account_number' => $data['account_number'] ?? null,
            'transaction_type' => $data['transaction_type'] ?? null,
            'currency_code' => $data['currency_code'] ?? $this->currency,
            'transaction_details' => $data['raw'] ?? $data,
        ];
    }
}
