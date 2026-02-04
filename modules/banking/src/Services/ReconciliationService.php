<?php

namespace Modules\Banking\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Banking\Models\BankStatementLine;
use Modules\Banking\Models\ReconcileModel;
use Modules\Banking\Models\PartialReconcile;
use Modules\Banking\Models\FullReconcile;
use Modules\Contacts\Models\Contact;
use Carbon\Carbon;

class ReconciliationService
{
    public function findMatchingInvoices(BankStatementLine $line, array $options = []): Collection
    {
        $amount = abs($line->amount);
        $isCredit = $line->amount > 0;
        $pastMonths = $options['past_months'] ?? 18;

        // Base query for invoices
        $query = DB::table('invoices')
            ->where('status', 'posted')
            ->where('payment_status', '!=', 'paid')
            ->where('due_date', '>=', now()->subMonths($pastMonths));

        // Credit = customer payment (incoming), match out_invoice
        // Debit = vendor payment (outgoing), match in_invoice
        if ($isCredit) {
            $query->where('type', 'out_invoice');
        } else {
            $query->where('type', 'in_invoice');
        }

        // Currency matching
        if ($options['match_same_currency'] ?? true) {
            $query->where('currency_code', $line->currency_code);
        }

        // Partner matching
        if ($line->partner_id) {
            $query->where('contact_id', $line->partner_id);
        }

        // Get potential matches
        $candidates = $query->get();

        // Score and rank matches
        $matches = $candidates->map(function ($invoice) use ($line, $amount, $options) {
            $score = $this->calculateMatchScore($line, $invoice, $options);
            return [
                'type' => 'invoice',
                'id' => $invoice->id,
                'reference' => $invoice->number ?? $invoice->id,
                'partner_name' => $invoice->partner_name ?? null,
                'amount' => $invoice->amount_residual ?? $invoice->total,
                'date' => $invoice->date,
                'due_date' => $invoice->due_date,
                'score' => $score,
                'match_type' => $this->getMatchType($score),
            ];
        })
        ->filter(fn($m) => $m['score'] > 0)
        ->sortByDesc('score')
        ->values();

        return $matches;
    }

    public function findMatchingPayments(BankStatementLine $line, array $options = []): Collection
    {
        $amount = abs($line->amount);
        $pastMonths = $options['past_months'] ?? 18;

        $query = DB::table('payments')
            ->where('state', 'posted')
            ->where('is_matched', false)
            ->where('date', '>=', now()->subMonths($pastMonths));

        if ($line->partner_id) {
            $query->where('partner_id', $line->partner_id);
        }

        $candidates = $query->get();

        $matches = $candidates->map(function ($payment) use ($line, $amount, $options) {
            $score = $this->calculatePaymentMatchScore($line, $payment, $options);
            return [
                'type' => 'payment',
                'id' => $payment->id,
                'reference' => $payment->reference ?? $payment->id,
                'partner_name' => $payment->partner_name ?? null,
                'amount' => $payment->amount,
                'date' => $payment->date,
                'score' => $score,
                'match_type' => $this->getMatchType($score),
            ];
        })
        ->filter(fn($m) => $m['score'] > 0)
        ->sortByDesc('score')
        ->values();

        return $matches;
    }

    protected function calculateMatchScore(BankStatementLine $line, object $invoice, array $options): float
    {
        $score = 0;
        $lineAmount = abs($line->amount);
        $invoiceAmount = $invoice->amount_residual ?? $invoice->total;

        // Amount matching (most important)
        $tolerance = $options['payment_tolerance_param'] ?? 0;
        $toleranceType = $options['payment_tolerance_type'] ?? 'percentage';

        $allowedDiff = $toleranceType === 'percentage'
            ? $invoiceAmount * ($tolerance / 100)
            : $tolerance;

        $amountDiff = abs($lineAmount - $invoiceAmount);

        if ($amountDiff < 0.01) {
            $score += 100; // Exact match
        } elseif ($amountDiff <= $allowedDiff) {
            $score += 80 - ($amountDiff / $invoiceAmount * 20); // Partial match with tolerance
        } else {
            return 0; // Amount doesn't match
        }

        // Reference matching
        if ($line->payment_ref && isset($invoice->number)) {
            if (str_contains(strtolower($line->payment_ref), strtolower($invoice->number))) {
                $score += 50;
            }
        }

        // Partner matching
        if ($line->partner_id && $line->partner_id === ($invoice->contact_id ?? null)) {
            $score += 30;
        } elseif ($line->partner_name && isset($invoice->partner_name)) {
            $similarity = similar_text(
                strtolower($line->partner_name),
                strtolower($invoice->partner_name),
                $percent
            );
            $score += $percent * 0.3;
        }

        // Date proximity
        if (isset($invoice->date)) {
            $daysDiff = abs($line->date->diffInDays(Carbon::parse($invoice->date)));
            if ($daysDiff <= 3) {
                $score += 20;
            } elseif ($daysDiff <= 7) {
                $score += 10;
            } elseif ($daysDiff <= 30) {
                $score += 5;
            }
        }

        return $score;
    }

    protected function calculatePaymentMatchScore(BankStatementLine $line, object $payment, array $options): float
    {
        $score = 0;
        $lineAmount = abs($line->amount);
        $paymentAmount = abs($payment->amount);

        // Amount matching
        $amountDiff = abs($lineAmount - $paymentAmount);

        if ($amountDiff < 0.01) {
            $score += 100;
        } elseif ($amountDiff <= $paymentAmount * 0.05) {
            $score += 70;
        } else {
            return 0;
        }

        // Reference matching
        if ($line->payment_ref && isset($payment->reference)) {
            if (str_contains(strtolower($line->payment_ref), strtolower($payment->reference))) {
                $score += 50;
            }
        }

        // Partner matching
        if ($line->partner_id && $line->partner_id === ($payment->partner_id ?? null)) {
            $score += 30;
        }

        return $score;
    }

    protected function getMatchType(float $score): string
    {
        if ($score >= 150) return 'perfect';
        if ($score >= 100) return 'high';
        if ($score >= 50) return 'medium';
        return 'low';
    }

    public function getSuggestions(BankStatementLine $line): array
    {
        $suggestions = [];

        // Find matching invoices
        $invoices = $this->findMatchingInvoices($line);
        foreach ($invoices->take(5) as $invoice) {
            $suggestions[] = $invoice;
        }

        // Find matching payments
        $payments = $this->findMatchingPayments($line);
        foreach ($payments->take(5) as $payment) {
            $suggestions[] = $payment;
        }

        // Apply reconciliation models
        $modelSuggestions = $this->applyReconcileModels($line);
        foreach ($modelSuggestions as $suggestion) {
            $suggestions[] = $suggestion;
        }

        // Sort by score
        usort($suggestions, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));

        return array_slice($suggestions, 0, 10);
    }

    public function applyReconcileModels(BankStatementLine $line): array
    {
        $suggestions = [];

        $models = ReconcileModel::where('active', true)
            ->where('rule_type', '!=', 'writeoff_button')
            ->orderBy('sequence')
            ->get();

        foreach ($models as $model) {
            if (!$model->matchesLine($line)) {
                continue;
            }

            // Check for partner mapping
            $partnerId = $model->findPartner($line);

            $suggestion = [
                'type' => 'model',
                'id' => $model->id,
                'name' => $model->name,
                'rule_type' => $model->rule_type,
                'auto_reconcile' => $model->auto_reconcile,
                'partner_id' => $partnerId,
                'score' => 60,
                'lines' => [],
            ];

            // Calculate write-off lines
            foreach ($model->lines as $modelLine) {
                $amount = $modelLine->computeAmount($line);
                $suggestion['lines'][] = [
                    'account_code' => $modelLine->account_code,
                    'label' => $modelLine->label,
                    'amount' => $amount,
                ];
            }

            $suggestions[] = $suggestion;

            // If auto-reconcile, only use first matching model
            if ($model->auto_reconcile) {
                break;
            }
        }

        return $suggestions;
    }

    public function reconcile(BankStatementLine $line, array $matches): PartialReconcile|FullReconcile
    {
        DB::beginTransaction();

        try {
            $partials = [];
            $totalReconciled = 0;
            $lineAmount = abs($line->amount);

            foreach ($matches as $match) {
                $partial = PartialReconcile::create([
                    'bank_statement_line_id' => $line->id,
                    'reconcile_type' => $match['type'],
                    'reconcile_id' => $match['id'],
                    'reconcile_model' => $match['model'] ?? null,
                    'amount' => $match['amount'],
                    'currency_code' => $line->currency_code,
                    'max_date' => max($line->date, Carbon::parse($match['date'] ?? now())),
                ]);

                $partials[] = $partial;
                $totalReconciled += abs($match['amount']);

                // Update the matched record
                $this->updateMatchedRecord($match);
            }

            // Check if fully reconciled
            $isFullyReconciled = abs($totalReconciled - $lineAmount) < 0.01;

            if ($isFullyReconciled) {
                // Create full reconcile
                $fullReconcile = FullReconcile::create([
                    'name' => FullReconcile::generateName(),
                ]);

                // Link partials
                foreach ($partials as $partial) {
                    $partial->full_reconcile_id = $fullReconcile->id;
                    $partial->save();
                }

                // Mark line as reconciled
                $line->is_reconciled = true;
                $line->amount_residual = 0;
            } else {
                $line->amount_residual = $lineAmount - $totalReconciled;
            }

            $line->checked = true;
            $line->save();

            DB::commit();

            return $isFullyReconciled ? $fullReconcile : $partials[0];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function updateMatchedRecord(array $match): void
    {
        switch ($match['type']) {
            case 'invoice':
                DB::table('invoices')
                    ->where('id', $match['id'])
                    ->update([
                        'payment_status' => 'paid',
                        'updated_at' => now(),
                    ]);
                break;

            case 'payment':
                DB::table('payments')
                    ->where('id', $match['id'])
                    ->update([
                        'is_matched' => true,
                        'updated_at' => now(),
                    ]);
                break;
        }
    }

    public function undoReconciliation(BankStatementLine $line): void
    {
        DB::beginTransaction();

        try {
            // Get all partials
            $partials = $line->partialReconciles;

            foreach ($partials as $partial) {
                // Undo matched record
                $this->undoMatchedRecord($partial);
            }

            // Delete partials (will cascade full reconcile if needed)
            $line->partialReconciles()->delete();

            // Reset line
            $line->is_reconciled = false;
            $line->amount_residual = abs($line->amount);
            $line->save();

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function undoMatchedRecord(PartialReconcile $partial): void
    {
        switch ($partial->reconcile_type) {
            case 'invoice':
                DB::table('invoices')
                    ->where('id', $partial->reconcile_id)
                    ->update([
                        'payment_status' => 'not_paid',
                        'updated_at' => now(),
                    ]);
                break;

            case 'payment':
                DB::table('payments')
                    ->where('id', $partial->reconcile_id)
                    ->update([
                        'is_matched' => false,
                        'updated_at' => now(),
                    ]);
                break;
        }
    }

    public function autoReconcile(BankStatementLine $line): ?PartialReconcile
    {
        $suggestions = $this->getSuggestions($line);

        foreach ($suggestions as $suggestion) {
            // Only auto-reconcile perfect/high matches
            if (($suggestion['match_type'] ?? '') === 'perfect' ||
                (($suggestion['score'] ?? 0) >= 150)) {

                return $this->reconcile($line, [$suggestion]);
            }

            // Auto-reconcile from model rules
            if (($suggestion['type'] ?? '') === 'model' &&
                ($suggestion['auto_reconcile'] ?? false)) {

                return $this->reconcile($line, [$suggestion]);
            }
        }

        return null;
    }

    public function batchAutoReconcile(Collection $lines): array
    {
        $results = [
            'reconciled' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        foreach ($lines as $line) {
            if ($line->is_reconciled) {
                $results['skipped']++;
                continue;
            }

            try {
                $result = $this->autoReconcile($line);
                if ($result) {
                    $results['reconciled']++;
                } else {
                    $results['skipped']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'line_id' => $line->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    public function matchPartner(BankStatementLine $line): ?Contact
    {
        // Try to find partner by account number
        if ($line->account_number) {
            $partner = Contact::whereHas('bankAccounts', function ($q) use ($line) {
                $q->where('acc_number', $line->account_number)
                  ->orWhere('acc_number', 'LIKE', '%' . substr($line->account_number, -10));
            })->first();

            if ($partner) {
                return $partner;
            }
        }

        // Try to find by name similarity
        if ($line->partner_name) {
            $partner = Contact::where('name', 'LIKE', '%' . $line->partner_name . '%')
                ->orWhere('commercial_name', 'LIKE', '%' . $line->partner_name . '%')
                ->first();

            if ($partner) {
                return $partner;
            }
        }

        // Check reconciliation model mappings
        $models = ReconcileModel::where('active', true)->get();
        foreach ($models as $model) {
            $partnerId = $model->findPartner($line);
            if ($partnerId) {
                return Contact::find($partnerId);
            }
        }

        return null;
    }
}
