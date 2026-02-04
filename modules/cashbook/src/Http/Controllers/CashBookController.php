<?php

namespace Modules\CashBook\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\CashBook\Models\CashBookEntry;
use Modules\CashBook\Models\CashBookAllocation;
use Modules\CashBook\Services\CashBookService;
use Modules\Invoicing\Models\Invoice;

class CashBookController extends Controller
{
    public function __construct(
        private CashBookService $cashBookService
    ) {}

    /**
     * List all entries with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashBookEntry::with(['contact', 'bankAccount', 'allocations.invoice']);

        // Filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('state')) {
            $query->where('state', $request->state);
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }
        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }
        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }
        if ($request->filled('unallocated') && $request->unallocated) {
            $query->unallocated();
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $request->input('sort', 'date');
        $sortDir = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDir);

        // Pagination
        $perPage = min($request->input('per_page', 25), 100);
        $entries = $query->paginate($perPage);

        return response()->json($entries);
    }

    /**
     * Get single entry
     */
    public function show(int $id): JsonResponse
    {
        $entry = CashBookEntry::with([
            'contact',
            'bankAccount',
            'bankTransaction',
            'transferToAccount',
            'linkedEntry',
            'allocations.invoice',
            'confirmedBy',
            'createdBy',
        ])->findOrFail($id);

        return response()->json(['data' => $entry]);
    }

    /**
     * Create new entry
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'type' => 'required|in:income,expense,transfer',
            'amount' => 'required|numeric|min:0.01',
            'currency_code' => 'nullable|string|size:3',
            'payment_method' => 'required|in:cash,bank_transfer,check,credit_card,direct_debit,other',
            'description' => 'required|string|max:255',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'contact_id' => 'nullable|exists:contacts,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
        ]);

        $validated['created_by'] = auth()->id();

        $entry = $this->cashBookService->createEntry($validated);

        return response()->json(['data' => $entry], 201);
    }

    /**
     * Update entry
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        if ($entry->state !== CashBookEntry::STATE_DRAFT) {
            return response()->json([
                'message' => 'Only draft entries can be updated'
            ], 422);
        }

        $validated = $request->validate([
            'date' => 'sometimes|date',
            'type' => 'sometimes|in:income,expense,transfer',
            'amount' => 'sometimes|numeric|min:0.01',
            'currency_code' => 'nullable|string|size:3',
            'payment_method' => 'sometimes|in:cash,bank_transfer,check,credit_card,direct_debit,other',
            'description' => 'sometimes|string|max:255',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'contact_id' => 'nullable|exists:contacts,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
        ]);

        $entry->update($validated);

        return response()->json(['data' => $entry->fresh()]);
    }

    /**
     * Delete entry
     */
    public function destroy(int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        if (!in_array($entry->state, [CashBookEntry::STATE_DRAFT, CashBookEntry::STATE_CANCELLED])) {
            return response()->json([
                'message' => 'Only draft or cancelled entries can be deleted'
            ], 422);
        }

        $entry->delete();

        return response()->json(null, 204);
    }

    /**
     * Confirm entry
     */
    public function confirm(int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        if (!$entry->confirm(auth()->id())) {
            return response()->json([
                'message' => 'Entry cannot be confirmed in current state'
            ], 422);
        }

        return response()->json(['data' => $entry->fresh()]);
    }

    /**
     * Cancel entry
     */
    public function cancel(int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        if (!$entry->cancel()) {
            return response()->json([
                'message' => 'Entry cannot be cancelled in current state'
            ], 422);
        }

        return response()->json(['data' => $entry->fresh()]);
    }

    /**
     * Allocate entry to invoice(s)
     */
    public function allocate(Request $request, int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        $validated = $request->validate([
            'allocations' => 'required|array|min:1',
            'allocations.*.invoice_id' => 'required|exists:invoices,id',
            'allocations.*.amount' => 'required|numeric|min:0.01',
        ]);

        try {
            $allocations = $this->cashBookService->allocateToMultipleInvoices(
                $entry,
                $validated['allocations']
            );

            return response()->json([
                'data' => $entry->fresh()->load('allocations.invoice'),
                'allocations_created' => count($allocations),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Auto-allocate entry to open invoices
     */
    public function autoAllocate(int $id): JsonResponse
    {
        $entry = CashBookEntry::findOrFail($id);

        try {
            $allocations = $this->cashBookService->autoAllocate($entry);

            return response()->json([
                'data' => $entry->fresh()->load('allocations.invoice'),
                'allocations_created' => count($allocations),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Remove allocation
     */
    public function removeAllocation(int $entryId, int $allocationId): JsonResponse
    {
        $allocation = CashBookAllocation::where('cashbook_entry_id', $entryId)
            ->where('id', $allocationId)
            ->firstOrFail();

        $this->cashBookService->removeAllocation($allocation);

        $entry = CashBookEntry::with('allocations.invoice')->findOrFail($entryId);

        return response()->json(['data' => $entry]);
    }

    /**
     * Update allocation amount
     */
    public function updateAllocation(Request $request, int $entryId, int $allocationId): JsonResponse
    {
        $allocation = CashBookAllocation::where('cashbook_entry_id', $entryId)
            ->where('id', $allocationId)
            ->firstOrFail();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        try {
            $allocation = $this->cashBookService->updateAllocation($allocation, $validated['amount']);

            $entry = CashBookEntry::with('allocations.invoice')->findOrFail($entryId);

            return response()->json(['data' => $entry]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get open invoices for allocation
     */
    public function getOpenInvoices(Request $request): JsonResponse
    {
        $query = Invoice::where('state', 'posted')
            ->where('payment_state', '!=', 'paid')
            ->with('contact');

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        if ($request->filled('type')) {
            if ($request->type === 'income') {
                $query->whereIn('move_type', ['out_invoice', 'out_receipt']);
            } else {
                $query->whereIn('move_type', ['in_invoice', 'in_receipt']);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('ref', 'like', "%{$search}%");
            });
        }

        $invoices = $query->orderBy('invoice_date_due')
            ->limit(50)
            ->get()
            ->map(fn($inv) => [
                'id' => $inv->id,
                'number' => $inv->number,
                'move_type' => $inv->move_type,
                'contact' => $inv->contact?->name,
                'invoice_date' => $inv->invoice_date,
                'invoice_date_due' => $inv->invoice_date_due,
                'amount_total' => $inv->amount_total,
                'amount_paid' => $inv->amount_paid,
                'amount_due' => $inv->amount_total - $inv->amount_paid,
                'currency_code' => $inv->currency_code,
            ]);

        return response()->json(['data' => $invoices]);
    }

    /**
     * Get cash flow summary
     */
    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        $summary = $this->cashBookService->getCashFlowSummary(
            $validated['start_date'],
            $validated['end_date'],
            $validated['company_id'] ?? null
        );

        return response()->json(['data' => $summary]);
    }

    /**
     * Create transfer between accounts
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'from_account_id' => 'required|exists:bank_accounts,id',
            'to_account_id' => 'required|exists:bank_accounts,id|different:from_account_id',
            'description' => 'nullable|string|max:255',
            'currency_code' => 'nullable|string|size:3',
        ]);

        $validated['created_by'] = auth()->id();

        $result = $this->cashBookService->createTransfer($validated);

        return response()->json(['data' => $result], 201);
    }

    /**
     * Get stats for dashboard
     */
    public function stats(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();
        $startOfYear = now()->startOfYear()->toDateString();

        $baseQuery = CashBookEntry::whereIn('state', [
            CashBookEntry::STATE_CONFIRMED,
            CashBookEntry::STATE_RECONCILED
        ]);

        // This month
        $monthIncome = (clone $baseQuery)
            ->where('type', 'income')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthExpense = (clone $baseQuery)
            ->where('type', 'expense')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // This year
        $yearIncome = (clone $baseQuery)
            ->where('type', 'income')
            ->whereBetween('date', [$startOfYear, $today])
            ->sum('amount');

        $yearExpense = (clone $baseQuery)
            ->where('type', 'expense')
            ->whereBetween('date', [$startOfYear, $today])
            ->sum('amount');

        // Pending entries
        $pendingCount = CashBookEntry::where('state', CashBookEntry::STATE_DRAFT)->count();
        $unallocatedCount = CashBookEntry::where('state', CashBookEntry::STATE_CONFIRMED)
            ->whereRaw('amount > amount_allocated')
            ->count();

        return response()->json([
            'data' => [
                'month' => [
                    'income' => $monthIncome,
                    'expense' => $monthExpense,
                    'net' => $monthIncome - $monthExpense,
                ],
                'year' => [
                    'income' => $yearIncome,
                    'expense' => $yearExpense,
                    'net' => $yearIncome - $yearExpense,
                ],
                'pending_count' => $pendingCount,
                'unallocated_count' => $unallocatedCount,
            ]
        ]);
    }

    /**
     * Bulk confirm entries
     */
    public function bulkConfirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:cashbook_entries,id',
        ]);

        $confirmed = 0;
        $errors = [];

        foreach ($validated['ids'] as $id) {
            $entry = CashBookEntry::find($id);
            if ($entry && $entry->confirm(auth()->id())) {
                $confirmed++;
            } else {
                $errors[] = $id;
            }
        }

        return response()->json([
            'confirmed' => $confirmed,
            'failed' => $errors,
        ]);
    }
}
