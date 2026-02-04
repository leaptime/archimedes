<?php

namespace Modules\CashBook\Services;

use Illuminate\Support\Facades\DB;
use Modules\CashBook\Models\CashBookEntry;
use Modules\CashBook\Models\CashBookAllocation;
use Modules\Invoicing\Models\Invoice;
use Modules\Banking\Models\BankStatementLine;

class CashBookService
{
    /**
     * Create a new cash book entry
     */
    public function createEntry(array $data): CashBookEntry
    {
        $data['number'] = $data['number'] ?? CashBookEntry::generateNumber($data['company_id'] ?? null);
        $data['state'] = $data['state'] ?? CashBookEntry::STATE_DRAFT;
        
        return CashBookEntry::create($data);
    }

    /**
     * Create entry from invoice (when registering payment directly on invoice)
     */
    public function createFromInvoice(Invoice $invoice, array $paymentData): CashBookEntry
    {
        $type = in_array($invoice->move_type, ['out_invoice', 'out_receipt']) 
            ? CashBookEntry::TYPE_INCOME 
            : CashBookEntry::TYPE_EXPENSE;

        $entry = $this->createEntry([
            'date' => $paymentData['date'] ?? now()->toDateString(),
            'type' => $type,
            'amount' => $paymentData['amount'],
            'currency_code' => $invoice->currency_code ?? 'EUR',
            'payment_method' => $paymentData['payment_method'] ?? CashBookEntry::METHOD_BANK_TRANSFER,
            'description' => $paymentData['description'] ?? "Payment for {$invoice->number}",
            'reference' => $paymentData['reference'] ?? null,
            'contact_id' => $invoice->contact_id,
            'bank_account_id' => $paymentData['bank_account_id'] ?? null,
            'company_id' => $invoice->company_id,
            'created_by' => $paymentData['created_by'] ?? null,
        ]);

        // Auto-confirm if requested
        if ($paymentData['auto_confirm'] ?? true) {
            $entry->confirm($paymentData['created_by'] ?? null);
        }

        // Allocate to invoice
        $this->allocateToInvoice($entry, $invoice, $paymentData['amount']);

        return $entry;
    }

    /**
     * Create entry from bank transaction (during reconciliation)
     */
    public function createFromBankTransaction(BankStatementLine $transaction, array $data = []): CashBookEntry
    {
        $type = $transaction->amount >= 0 ? CashBookEntry::TYPE_INCOME : CashBookEntry::TYPE_EXPENSE;
        
        $entry = $this->createEntry([
            'date' => $transaction->date,
            'type' => $type,
            'amount' => abs($transaction->amount),
            'currency_code' => $transaction->currency_code ?? 'EUR',
            'payment_method' => $data['payment_method'] ?? CashBookEntry::METHOD_BANK_TRANSFER,
            'description' => $data['description'] ?? $transaction->description,
            'reference' => $transaction->reference,
            'contact_id' => $data['contact_id'] ?? $transaction->partner_id,
            'bank_account_id' => $transaction->statement->bank_account_id ?? null,
            'bank_transaction_id' => $transaction->id,
            'company_id' => $data['company_id'] ?? null,
            'created_by' => $data['created_by'] ?? null,
        ]);

        return $entry;
    }

    /**
     * Allocate entry amount to an invoice
     */
    public function allocateToInvoice(CashBookEntry $entry, Invoice $invoice, float $amount): CashBookAllocation
    {
        // Validate entry can be allocated
        if (!$entry->canAllocate() && $entry->state !== CashBookEntry::STATE_DRAFT) {
            throw new \Exception("Entry cannot be allocated in current state: {$entry->state}");
        }

        // Validate amount doesn't exceed unallocated amount
        if ($amount > $entry->amount_unallocated) {
            throw new \Exception("Amount {$amount} exceeds unallocated amount {$entry->amount_unallocated}");
        }

        // Validate amount doesn't exceed invoice amount due
        $invoiceAmountDue = $invoice->amount_total - $invoice->amount_paid;
        if ($amount > $invoiceAmountDue) {
            throw new \Exception("Amount {$amount} exceeds invoice amount due {$invoiceAmountDue}");
        }

        // Validate type matches invoice
        $isCustomerInvoice = in_array($invoice->move_type, ['out_invoice', 'out_receipt']);
        $isIncome = $entry->type === CashBookEntry::TYPE_INCOME;
        
        if ($isCustomerInvoice && !$isIncome) {
            throw new \Exception("Cannot allocate expense to customer invoice");
        }
        if (!$isCustomerInvoice && $isIncome) {
            throw new \Exception("Cannot allocate income to vendor bill");
        }

        // Check if allocation already exists
        $existingAllocation = CashBookAllocation::where('cashbook_entry_id', $entry->id)
            ->where('invoice_id', $invoice->id)
            ->first();

        if ($existingAllocation) {
            // Update existing allocation
            $existingAllocation->update(['amount_applied' => $existingAllocation->amount_applied + $amount]);
            return $existingAllocation;
        }

        // Create new allocation
        return CashBookAllocation::create([
            'cashbook_entry_id' => $entry->id,
            'invoice_id' => $invoice->id,
            'amount_applied' => $amount,
        ]);
    }

    /**
     * Allocate entry to multiple invoices
     */
    public function allocateToMultipleInvoices(CashBookEntry $entry, array $allocations): array
    {
        $results = [];

        DB::transaction(function () use ($entry, $allocations, &$results) {
            foreach ($allocations as $allocation) {
                $invoice = Invoice::findOrFail($allocation['invoice_id']);
                $results[] = $this->allocateToInvoice($entry, $invoice, $allocation['amount']);
            }
        });

        return $results;
    }

    /**
     * Remove allocation
     */
    public function removeAllocation(CashBookAllocation $allocation): bool
    {
        return $allocation->delete();
    }

    /**
     * Update allocation amount
     */
    public function updateAllocation(CashBookAllocation $allocation, float $newAmount): CashBookAllocation
    {
        $entry = $allocation->entry;
        $invoice = $allocation->invoice;

        // Calculate available amounts
        $entryAvailable = $entry->amount_unallocated + $allocation->amount_applied;
        $invoiceAvailable = ($invoice->amount_total - $invoice->amount_paid) + $allocation->amount_applied;

        if ($newAmount > $entryAvailable) {
            throw new \Exception("Amount exceeds available entry amount");
        }
        if ($newAmount > $invoiceAvailable) {
            throw new \Exception("Amount exceeds invoice amount due");
        }

        $allocation->update(['amount_applied' => $newAmount]);
        
        return $allocation->fresh();
    }

    /**
     * Auto-allocate entry to open invoices (FIFO by due date)
     */
    public function autoAllocate(CashBookEntry $entry): array
    {
        if (!$entry->contact_id || $entry->amount_unallocated <= 0) {
            return [];
        }

        // Determine invoice types to match
        $invoiceTypes = $entry->type === CashBookEntry::TYPE_INCOME 
            ? ['out_invoice', 'out_receipt']
            : ['in_invoice', 'in_receipt'];

        // Get open invoices for this contact, ordered by due date (FIFO)
        $openInvoices = Invoice::where('contact_id', $entry->contact_id)
            ->whereIn('move_type', $invoiceTypes)
            ->where('state', 'posted')
            ->where('payment_state', '!=', 'paid')
            ->orderBy('invoice_date_due')
            ->orderBy('id')
            ->get();

        $allocations = [];
        $remaining = $entry->amount_unallocated;

        foreach ($openInvoices as $invoice) {
            if ($remaining <= 0) {
                break;
            }

            $invoiceAmountDue = $invoice->amount_total - $invoice->amount_paid;
            $amountToAllocate = min($remaining, $invoiceAmountDue);

            if ($amountToAllocate > 0) {
                $allocations[] = $this->allocateToInvoice($entry, $invoice, $amountToAllocate);
                $remaining -= $amountToAllocate;
                
                // Refresh entry to get updated amount_unallocated
                $entry->refresh();
            }
        }

        return $allocations;
    }

    /**
     * Match bank transaction to existing cash book entry
     */
    public function matchBankTransaction(CashBookEntry $entry, BankStatementLine $transaction): CashBookEntry
    {
        if ($entry->bank_transaction_id) {
            throw new \Exception("Entry is already matched to a bank transaction");
        }

        $entry->update([
            'bank_transaction_id' => $transaction->id,
            'state' => CashBookEntry::STATE_RECONCILED,
        ]);

        return $entry->fresh();
    }

    /**
     * Find matching cash book entries for a bank transaction
     */
    public function findMatchingEntries(BankStatementLine $transaction, int $limit = 10): array
    {
        $amount = abs($transaction->amount);
        $type = $transaction->amount >= 0 ? CashBookEntry::TYPE_INCOME : CashBookEntry::TYPE_EXPENSE;
        
        $query = CashBookEntry::where('type', $type)
            ->whereNull('bank_transaction_id')
            ->where('state', CashBookEntry::STATE_CONFIRMED);

        // Exact amount match
        $exactMatches = (clone $query)
            ->where('amount', $amount)
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($e) => ['entry' => $e, 'score' => 100, 'match_type' => 'exact_amount']);

        // Partner match with similar amount (within 1%)
        $partnerMatches = collect();
        if ($transaction->partner_id) {
            $partnerMatches = (clone $query)
                ->where('contact_id', $transaction->partner_id)
                ->whereBetween('amount', [$amount * 0.99, $amount * 1.01])
                ->orderBy('date', 'desc')
                ->limit($limit)
                ->get()
                ->map(fn($e) => ['entry' => $e, 'score' => 90, 'match_type' => 'partner_amount']);
        }

        // Date and amount proximity
        $dateMatches = (clone $query)
            ->whereBetween('amount', [$amount * 0.95, $amount * 1.05])
            ->whereBetween('date', [
                $transaction->date->copy()->subDays(7),
                $transaction->date->copy()->addDays(7)
            ])
            ->orderByRaw('ABS(DATEDIFF(date, ?))', [$transaction->date])
            ->limit($limit)
            ->get()
            ->map(fn($e) => ['entry' => $e, 'score' => 70, 'match_type' => 'date_proximity']);

        // Combine and deduplicate
        return $exactMatches
            ->concat($partnerMatches)
            ->concat($dateMatches)
            ->unique(fn($m) => $m['entry']->id)
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->toArray();
    }

    /**
     * Get cash flow summary for a period
     */
    public function getCashFlowSummary(string $startDate, string $endDate, ?int $companyId = null): array
    {
        $query = CashBookEntry::whereBetween('date', [$startDate, $endDate])
            ->whereIn('state', [CashBookEntry::STATE_CONFIRMED, CashBookEntry::STATE_RECONCILED]);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $income = (clone $query)->where('type', CashBookEntry::TYPE_INCOME)->sum('amount');
        $expense = (clone $query)->where('type', CashBookEntry::TYPE_EXPENSE)->sum('amount');
        
        $byMethod = (clone $query)
            ->selectRaw('payment_method, type, SUM(amount) as total')
            ->groupBy('payment_method', 'type')
            ->get()
            ->groupBy('payment_method')
            ->map(fn($group) => [
                'income' => $group->where('type', 'income')->sum('total'),
                'expense' => $group->where('type', 'expense')->sum('total'),
            ]);

        $byMonth = (clone $query)
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as month, type, SUM(amount) as total')
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(fn($group) => [
                'income' => $group->where('type', 'income')->sum('total'),
                'expense' => $group->where('type', 'expense')->sum('total'),
            ]);

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'totals' => [
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ],
            'by_payment_method' => $byMethod,
            'by_month' => $byMonth,
        ];
    }

    /**
     * Create a transfer between accounts
     */
    public function createTransfer(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // Create outgoing entry
            $outgoing = $this->createEntry([
                'date' => $data['date'],
                'type' => CashBookEntry::TYPE_TRANSFER,
                'amount' => $data['amount'],
                'currency_code' => $data['currency_code'] ?? 'EUR',
                'payment_method' => CashBookEntry::METHOD_BANK_TRANSFER,
                'description' => $data['description'] ?? 'Transfer between accounts',
                'bank_account_id' => $data['from_account_id'],
                'transfer_to_account_id' => $data['to_account_id'],
                'company_id' => $data['company_id'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            // Create incoming entry
            $incoming = $this->createEntry([
                'date' => $data['date'],
                'type' => CashBookEntry::TYPE_TRANSFER,
                'amount' => $data['amount'],
                'currency_code' => $data['currency_code'] ?? 'EUR',
                'payment_method' => CashBookEntry::METHOD_BANK_TRANSFER,
                'description' => $data['description'] ?? 'Transfer between accounts',
                'bank_account_id' => $data['to_account_id'],
                'transfer_to_account_id' => $data['from_account_id'],
                'linked_entry_id' => $outgoing->id,
                'company_id' => $data['company_id'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            // Link them together
            $outgoing->update(['linked_entry_id' => $incoming->id]);

            return ['outgoing' => $outgoing, 'incoming' => $incoming];
        });
    }
}
