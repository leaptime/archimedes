<?php

namespace Modules\Banking\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Banking\Models\BankAccount;
use Modules\Banking\Models\BankStatement;
use Modules\Banking\Models\BankStatementLine;
use Modules\Banking\Models\ReconcileModel;
use Modules\Banking\Models\BankImportHistory;
use Modules\Banking\Services\ImportService;
use Modules\Banking\Services\ReconciliationService;

class BankingController extends Controller
{
    public function __construct(
        protected ImportService $importService,
        protected ReconciliationService $reconciliationService
    ) {}

    // Bank Accounts
    public function accounts(Request $request): JsonResponse
    {
        $accounts = BankAccount::query()
            ->when($request->type, fn($q, $type) => $q->where('account_type', $type))
            ->when($request->active !== null, fn($q) => $q->where('active', $request->boolean('active')))
            ->withCount(['lines as unreconciled_count' => fn($q) => $q->where('is_reconciled', false)])
            ->withCount(['lines as to_check_count' => fn($q) => $q->where('checked', false)])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $accounts]);
    }

    public function showAccount(BankAccount $account): JsonResponse
    {
        $account->load(['partner', 'statements' => fn($q) => $q->latest('date')->limit(5)]);
        $account->loadCount([
            'lines as unreconciled_count' => fn($q) => $q->where('is_reconciled', false),
            'lines as to_check_count' => fn($q) => $q->where('checked', false),
        ]);

        return response()->json(['data' => $account]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'bank_bic' => 'nullable|string|max:11',
            'iban' => 'nullable|string|max:34',
            'account_type' => 'nullable|in:bank,cash,credit_card',
            'currency_code' => 'nullable|string|size:3',
            'partner_id' => 'nullable|exists:contacts,id',
            'settings' => 'nullable|array',
        ]);

        $account = BankAccount::create($validated);

        return response()->json(['data' => $account], 201);
    }

    public function updateAccount(Request $request, BankAccount $account): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'bank_bic' => 'nullable|string|max:11',
            'iban' => 'nullable|string|max:34',
            'account_type' => 'nullable|in:bank,cash,credit_card',
            'currency_code' => 'nullable|string|size:3',
            'partner_id' => 'nullable|exists:contacts,id',
            'active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);

        $account->update($validated);

        return response()->json(['data' => $account]);
    }

    public function deleteAccount(BankAccount $account): JsonResponse
    {
        $account->delete();
        return response()->json(['message' => 'Account deleted']);
    }

    // Statements
    public function statements(Request $request): JsonResponse
    {
        $query = BankStatement::query()
            ->with('bankAccount')
            ->withCount('lines');

        if ($request->account_id) {
            $query->where('bank_account_id', $request->account_id);
        }

        $statements = $query->orderBy('date', 'desc')->paginate($request->per_page ?? 20);

        return response()->json($statements);
    }

    public function showStatement(BankStatement $statement): JsonResponse
    {
        $statement->load(['bankAccount', 'lines' => fn($q) => $q->orderBy('internal_index')]);

        return response()->json(['data' => $statement]);
    }

    public function storeStatement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'name' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'date' => 'required|date',
            'balance_start' => 'required|numeric',
            'balance_end_real' => 'required|numeric',
        ]);

        $statement = BankStatement::create($validated);

        if (empty($validated['name'])) {
            $statement->name = $statement->generateName();
            $statement->save();
        }

        return response()->json(['data' => $statement], 201);
    }

    public function updateStatement(Request $request, BankStatement $statement): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'balance_start' => 'sometimes|numeric',
            'balance_end_real' => 'sometimes|numeric',
        ]);

        $statement->update($validated);

        return response()->json(['data' => $statement]);
    }

    // Transactions (Statement Lines)
    public function transactions(Request $request): JsonResponse
    {
        $query = BankStatementLine::query()
            ->with(['bankAccount', 'partner']);

        if ($request->account_id) {
            $query->where('bank_account_id', $request->account_id);
        }
        if ($request->statement_id) {
            $query->where('statement_id', $request->statement_id);
        }
        if ($request->has('is_reconciled')) {
            $query->where('is_reconciled', $request->boolean('is_reconciled'));
        }
        if ($request->has('checked')) {
            $query->where('checked', $request->boolean('checked'));
        }
        if ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('payment_ref', 'like', "%{$search}%")
                  ->orWhere('partner_name', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('internal_index', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($transactions);
    }

    public function showTransaction(BankStatementLine $transaction): JsonResponse
    {
        $transaction->load(['bankAccount', 'statement', 'partner', 'partialReconciles']);

        return response()->json(['data' => $transaction]);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'statement_id' => 'nullable|exists:bank_statements,id',
            'date' => 'required|date',
            'payment_ref' => 'nullable|string|max:255',
            'partner_name' => 'nullable|string|max:255',
            'partner_id' => 'nullable|exists:contacts,id',
            'amount' => 'required|numeric',
            'currency_code' => 'nullable|string|size:3',
            'account_number' => 'nullable|string|max:50',
            'transaction_type' => 'nullable|string|max:50',
        ]);

        $transaction = BankStatementLine::create($validated);
        $transaction->computeRunningBalance();
        $transaction->save();

        return response()->json(['data' => $transaction], 201);
    }

    public function updateTransaction(Request $request, BankStatementLine $transaction): JsonResponse
    {
        $validated = $request->validate([
            'statement_id' => 'nullable|exists:bank_statements,id',
            'date' => 'sometimes|date',
            'payment_ref' => 'nullable|string|max:255',
            'partner_name' => 'nullable|string|max:255',
            'partner_id' => 'nullable|exists:contacts,id',
            'amount' => 'sometimes|numeric',
            'checked' => 'nullable|boolean',
        ]);

        $transaction->update($validated);

        return response()->json(['data' => $transaction]);
    }

    public function deleteTransaction(BankStatementLine $transaction): JsonResponse
    {
        if ($transaction->is_reconciled) {
            return response()->json(['error' => 'Cannot delete reconciled transaction'], 422);
        }

        $transaction->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }

    // Import
    public function import(Request $request, BankAccount $account): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
            'format' => 'nullable|in:csv,ofx,qif,camt',
        ]);

        try {
            $history = $this->importService->import(
                $account,
                $request->file('file'),
                $request->format,
                $request->only(['allow_duplicates', 'column_mapping'])
            );

            return response()->json([
                'data' => $history,
                'message' => "Imported {$history->transactions_imported} transactions",
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
            'format' => 'nullable|in:csv,ofx,qif,camt',
        ]);

        try {
            $preview = $this->importService->preview(
                $request->file('file'),
                $request->format,
                20
            );

            return response()->json(['data' => $preview]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function importHistory(Request $request): JsonResponse
    {
        $query = BankImportHistory::query()
            ->with(['bankAccount', 'user']);

        if ($request->account_id) {
            $query->where('bank_account_id', $request->account_id);
        }

        $history = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($history);
    }

    // Reconciliation
    public function reconcileSuggestions(BankStatementLine $transaction): JsonResponse
    {
        $suggestions = $this->reconciliationService->getSuggestions($transaction);

        return response()->json(['data' => $suggestions]);
    }

    public function reconcile(Request $request, BankStatementLine $transaction): JsonResponse
    {
        $validated = $request->validate([
            'matches' => 'required|array|min:1',
            'matches.*.type' => 'required|in:invoice,payment,manual,model',
            'matches.*.id' => 'required_unless:matches.*.type,manual',
            'matches.*.amount' => 'required|numeric',
            'matches.*.date' => 'nullable|date',
        ]);

        try {
            $result = $this->reconciliationService->reconcile($transaction, $validated['matches']);

            return response()->json([
                'data' => $result,
                'message' => 'Transaction reconciled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function undoReconciliation(BankStatementLine $transaction): JsonResponse
    {
        if (!$transaction->is_reconciled) {
            return response()->json(['error' => 'Transaction is not reconciled'], 422);
        }

        try {
            $this->reconciliationService->undoReconciliation($transaction);

            return response()->json(['message' => 'Reconciliation undone']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function autoReconcile(Request $request, BankAccount $account): JsonResponse
    {
        $lines = $account->lines()
            ->where('is_reconciled', false)
            ->when($request->date_from, fn($q, $d) => $q->where('date', '>=', $d))
            ->when($request->date_to, fn($q, $d) => $q->where('date', '<=', $d))
            ->get();

        $results = $this->reconciliationService->batchAutoReconcile($lines);

        return response()->json([
            'data' => $results,
            'message' => "Auto-reconciled {$results['reconciled']} transactions",
        ]);
    }

    public function matchPartner(BankStatementLine $transaction): JsonResponse
    {
        $partner = $this->reconciliationService->matchPartner($transaction);

        if ($partner) {
            $transaction->partner_id = $partner->id;
            $transaction->save();
        }

        return response()->json([
            'data' => $partner,
            'message' => $partner ? 'Partner matched' : 'No matching partner found',
        ]);
    }

    // Reconcile Models
    public function reconcileModels(): JsonResponse
    {
        $models = ReconcileModel::with(['lines', 'partnerMappings'])
            ->orderBy('sequence')
            ->get();

        return response()->json(['data' => $models]);
    }

    public function storeReconcileModel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rule_type' => 'required|in:writeoff_button,writeoff_suggestion,invoice_matching',
            'auto_reconcile' => 'nullable|boolean',
            'sequence' => 'nullable|integer',
            'match_nature' => 'nullable|in:amount_received,amount_paid,both',
            'match_label' => 'nullable|in:contains,not_contains,match_regex',
            'match_label_param' => 'nullable|string',
            'match_amount' => 'nullable|in:lower,greater,between',
            'match_amount_min' => 'nullable|numeric',
            'match_amount_max' => 'nullable|numeric',
            'allow_payment_tolerance' => 'nullable|boolean',
            'payment_tolerance_param' => 'nullable|numeric',
            'payment_tolerance_type' => 'nullable|in:percentage,fixed_amount',
            'lines' => 'nullable|array',
            'partner_mappings' => 'nullable|array',
        ]);

        $model = ReconcileModel::create($validated);

        if (!empty($validated['lines'])) {
            foreach ($validated['lines'] as $line) {
                $model->lines()->create($line);
            }
        }

        if (!empty($validated['partner_mappings'])) {
            foreach ($validated['partner_mappings'] as $mapping) {
                $model->partnerMappings()->create($mapping);
            }
        }

        return response()->json(['data' => $model->load(['lines', 'partnerMappings'])], 201);
    }

    public function updateReconcileModel(Request $request, ReconcileModel $model): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'rule_type' => 'sometimes|in:writeoff_button,writeoff_suggestion,invoice_matching',
            'auto_reconcile' => 'nullable|boolean',
            'active' => 'nullable|boolean',
            'sequence' => 'nullable|integer',
            'match_nature' => 'nullable|in:amount_received,amount_paid,both',
            'match_label' => 'nullable|in:contains,not_contains,match_regex',
            'match_label_param' => 'nullable|string',
        ]);

        $model->update($validated);

        return response()->json(['data' => $model]);
    }

    public function deleteReconcileModel(ReconcileModel $model): JsonResponse
    {
        $model->delete();
        return response()->json(['message' => 'Reconciliation model deleted']);
    }

    // Dashboard
    public function dashboard(): JsonResponse
    {
        $accounts = BankAccount::where('active', true)
            ->withCount([
                'lines as unreconciled_count' => fn($q) => $q->where('is_reconciled', false),
                'lines as to_check_count' => fn($q) => $q->where('checked', false),
            ])
            ->get();

        $totalBalance = $accounts->sum('current_balance');
        $totalUnreconciled = $accounts->sum('unreconciled_count');
        $totalToCheck = $accounts->sum('to_check_count');

        $recentTransactions = BankStatementLine::with('bankAccount')
            ->where('is_reconciled', false)
            ->orderBy('date', 'desc')
            ->limit(10)
            ->get();

        $recentImports = BankImportHistory::with('bankAccount')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'accounts' => $accounts,
                'summary' => [
                    'total_balance' => $totalBalance,
                    'total_unreconciled' => $totalUnreconciled,
                    'total_to_check' => $totalToCheck,
                    'account_count' => $accounts->count(),
                ],
                'recent_transactions' => $recentTransactions,
                'recent_imports' => $recentImports,
            ],
        ]);
    }
}
