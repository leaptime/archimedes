<?php

namespace Modules\Banking\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Modules\Banking\Models\BankAccount;
use Modules\Banking\Models\BankStatement;
use Modules\Banking\Models\BankStatementLine;
use Modules\Banking\Models\BankImportHistory;
use Modules\Banking\Parsers\ParserInterface;
use Modules\Banking\Parsers\CsvParser;
use Modules\Banking\Parsers\OfxParser;
use Modules\Banking\Parsers\QifParser;
use Modules\Banking\Parsers\CamtParser;
use Carbon\Carbon;

class ImportService
{
    protected array $parsers = [];

    public function __construct()
    {
        $this->registerParser(new CsvParser());
        $this->registerParser(new OfxParser());
        $this->registerParser(new QifParser());
        $this->registerParser(new CamtParser());
    }

    public function registerParser(ParserInterface $parser): void
    {
        $this->parsers[$parser->getFormat()] = $parser;
    }

    public function import(
        BankAccount $account,
        UploadedFile|string $file,
        ?string $format = null,
        array $options = []
    ): BankImportHistory {
        $content = $file instanceof UploadedFile
            ? file_get_contents($file->getRealPath())
            : $file;

        $filename = $file instanceof UploadedFile
            ? $file->getClientOriginalName()
            : 'import_' . now()->format('Ymd_His');

        $format = $format ?? $this->detectFormat($content, $filename);
        $parser = $this->getParser($format);

        if (!$parser) {
            throw new \RuntimeException("No parser available for format: {$format}");
        }

        if (!$parser->validate($content)) {
            throw new \RuntimeException("Invalid file format for {$format} parser");
        }

        // Create import history record
        $history = BankImportHistory::create([
            'bank_account_id' => $account->id,
            'filename' => $filename,
            'format' => $format,
            'status' => 'processing',
            'user_id' => auth()->id(),
        ]);

        try {
            $transactions = $parser->parse($content);

            $history->transactions_count = count($transactions);
            $history->save();

            $result = $this->processTransactions(
                $account,
                $transactions,
                $parser,
                $options
            );

            $history->markCompleted(
                $result['imported'],
                $result['skipped'],
                $result['total_amount']
            );

            $history->details = $result;
            $history->save();

            // Update account balance
            $account->updateBalance();

        } catch (\Exception $e) {
            $history->markFailed($e->getMessage());
            throw $e;
        }

        return $history;
    }

    protected function detectFormat(string $content, string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        // Check by extension first
        foreach ($this->parsers as $format => $parser) {
            if (in_array($extension, $parser->getSupportedExtensions())) {
                if ($parser->validate($content)) {
                    return $format;
                }
            }
        }

        // Try each parser
        foreach ($this->parsers as $format => $parser) {
            if ($parser->validate($content)) {
                return $format;
            }
        }

        // Default to CSV
        return 'csv';
    }

    protected function getParser(string $format): ?ParserInterface
    {
        return $this->parsers[$format] ?? null;
    }

    protected function processTransactions(
        BankAccount $account,
        array $transactions,
        ParserInterface $parser,
        array $options
    ): array {
        $imported = 0;
        $skipped = 0;
        $totalAmount = 0;
        $duplicates = [];
        $errors = [];

        // Get existing transaction hashes for duplicate detection
        $existingHashes = $this->getExistingTransactionHashes($account);

        // Create statement if balances are provided
        $statement = null;
        $openingBalance = $parser->getOpeningBalance();
        $closingBalance = $parser->getClosingBalance();
        $statementDate = $parser->getStatementDate();

        if ($openingBalance !== null || $closingBalance !== null) {
            $statement = $this->findOrCreateStatement(
                $account,
                $statementDate ?? ($transactions[0]['date'] ?? now()),
                $openingBalance ?? 0,
                $closingBalance ?? 0
            );
        }

        DB::beginTransaction();
        try {
            $sequence = 1;

            foreach ($transactions as $index => $txData) {
                $hash = $this->generateTransactionHash($txData);

                // Check for duplicates
                if (in_array($hash, $existingHashes) && !($options['allow_duplicates'] ?? false)) {
                    $duplicates[] = $txData;
                    $skipped++;
                    continue;
                }

                try {
                    $line = $this->createStatementLine(
                        $account,
                        $statement,
                        $txData,
                        $sequence++
                    );

                    $imported++;
                    $totalAmount += $txData['amount'] ?? 0;
                    $existingHashes[] = $hash;

                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'data' => $txData,
                        'error' => $e->getMessage(),
                    ];
                    $skipped++;
                }
            }

            // Update statement balances
            if ($statement) {
                $statement->computeBalances();
                $statement->save();
            }

            // Compute running balances
            $this->computeRunningBalances($account);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total_amount' => $totalAmount,
            'duplicates' => count($duplicates),
            'errors' => $errors,
            'statement_id' => $statement?->id,
        ];
    }

    protected function getExistingTransactionHashes(BankAccount $account): array
    {
        return $account->lines()
            ->whereNotNull('transaction_details')
            ->get()
            ->map(fn($line) => $this->generateTransactionHash([
                'date' => $line->date,
                'amount' => $line->amount,
                'payment_ref' => $line->payment_ref,
            ]))
            ->toArray();
    }

    protected function generateTransactionHash(array $txData): string
    {
        $date = $txData['date'] instanceof Carbon
            ? $txData['date']->format('Y-m-d')
            : ($txData['date'] ?? '');

        return md5(implode('|', [
            $date,
            $txData['amount'] ?? 0,
            $txData['payment_ref'] ?? '',
            $txData['partner_name'] ?? '',
        ]));
    }

    protected function findOrCreateStatement(
        BankAccount $account,
        Carbon|string $date,
        float $openingBalance,
        float $closingBalance
    ): BankStatement {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        // Check if statement already exists for this date
        $existing = BankStatement::where('bank_account_id', $account->id)
            ->whereDate('date', $date)
            ->first();

        if ($existing) {
            return $existing;
        }

        return BankStatement::create([
            'bank_account_id' => $account->id,
            'name' => strtoupper(substr($account->name, 0, 3)) . " Statement {$date->format('Y-m-d')}",
            'date' => $date,
            'balance_start' => $openingBalance,
            'balance_end_real' => $closingBalance,
        ]);
    }

    protected function createStatementLine(
        BankAccount $account,
        ?BankStatement $statement,
        array $txData,
        int $sequence
    ): BankStatementLine {
        $date = $txData['date'] instanceof Carbon
            ? $txData['date']
            : Carbon::parse($txData['date']);

        return BankStatementLine::create([
            'statement_id' => $statement?->id,
            'bank_account_id' => $account->id,
            'date' => $date,
            'payment_ref' => $txData['payment_ref'] ?? null,
            'partner_name' => $txData['partner_name'] ?? null,
            'amount' => $txData['amount'] ?? 0,
            'currency_code' => $txData['currency_code'] ?? $account->currency_code,
            'account_number' => $txData['account_number'] ?? null,
            'transaction_type' => $txData['transaction_type'] ?? null,
            'sequence' => $sequence,
            'transaction_details' => $txData['transaction_details'] ?? $txData['raw'] ?? null,
        ]);
    }

    protected function computeRunningBalances(BankAccount $account): void
    {
        $lines = $account->lines()
            ->orderBy('internal_index')
            ->get();

        $balance = 0;

        // Find starting balance from statement
        $firstLine = $lines->first();
        if ($firstLine?->statement_id) {
            $balance = $firstLine->statement->balance_start;
        }

        foreach ($lines as $line) {
            $balance += $line->amount;
            $line->running_balance = $balance;
            $line->saveQuietly();
        }
    }

    public function preview(
        UploadedFile|string $file,
        ?string $format = null,
        int $limit = 10
    ): array {
        $content = $file instanceof UploadedFile
            ? file_get_contents($file->getRealPath())
            : $file;

        $filename = $file instanceof UploadedFile
            ? $file->getClientOriginalName()
            : 'preview';

        $format = $format ?? $this->detectFormat($content, $filename);
        $parser = $this->getParser($format);

        if (!$parser) {
            throw new \RuntimeException("No parser available for format: {$format}");
        }

        $transactions = $parser->parse($content);

        return [
            'format' => $format,
            'total_count' => count($transactions),
            'account_number' => $parser->getAccountNumber(),
            'opening_balance' => $parser->getOpeningBalance(),
            'closing_balance' => $parser->getClosingBalance(),
            'currency' => $parser->getCurrency(),
            'transactions' => array_slice($transactions, 0, $limit),
        ];
    }
}
