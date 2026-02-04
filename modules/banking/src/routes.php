<?php

use Illuminate\Support\Facades\Route;
use Modules\Banking\Controllers\BankingController;
use Modules\Banking\Controllers\OpenBankingController;

Route::prefix('api/banking')->middleware(['api', 'auth:sanctum'])->group(function () {
    // Dashboard
    Route::get('dashboard', [BankingController::class, 'dashboard']);

    // Bank Accounts
    Route::get('accounts', [BankingController::class, 'accounts']);
    Route::post('accounts', [BankingController::class, 'storeAccount']);
    Route::get('accounts/{account}', [BankingController::class, 'showAccount']);
    Route::put('accounts/{account}', [BankingController::class, 'updateAccount']);
    Route::delete('accounts/{account}', [BankingController::class, 'deleteAccount']);

    // Statements
    Route::get('statements', [BankingController::class, 'statements']);
    Route::post('statements', [BankingController::class, 'storeStatement']);
    Route::get('statements/{statement}', [BankingController::class, 'showStatement']);
    Route::put('statements/{statement}', [BankingController::class, 'updateStatement']);

    // Transactions
    Route::get('transactions', [BankingController::class, 'transactions']);
    Route::post('transactions', [BankingController::class, 'storeTransaction']);
    Route::get('transactions/{transaction}', [BankingController::class, 'showTransaction']);
    Route::put('transactions/{transaction}', [BankingController::class, 'updateTransaction']);
    Route::delete('transactions/{transaction}', [BankingController::class, 'deleteTransaction']);

    // Import
    Route::post('import/preview', [BankingController::class, 'importPreview']);
    Route::post('accounts/{account}/import', [BankingController::class, 'import']);
    Route::get('import/history', [BankingController::class, 'importHistory']);

    // Reconciliation
    Route::get('transactions/{transaction}/suggestions', [BankingController::class, 'reconcileSuggestions']);
    Route::post('transactions/{transaction}/reconcile', [BankingController::class, 'reconcile']);
    Route::post('transactions/{transaction}/undo-reconciliation', [BankingController::class, 'undoReconciliation']);
    Route::post('transactions/{transaction}/match-partner', [BankingController::class, 'matchPartner']);
    Route::post('accounts/{account}/auto-reconcile', [BankingController::class, 'autoReconcile']);

    // Reconcile Models
    Route::get('reconcile-models', [BankingController::class, 'reconcileModels']);
    Route::post('reconcile-models', [BankingController::class, 'storeReconcileModel']);
    Route::put('reconcile-models/{model}', [BankingController::class, 'updateReconcileModel']);
    Route::delete('reconcile-models/{model}', [BankingController::class, 'deleteReconcileModel']);

    // Open Banking
    Route::get('open-banking/providers', [OpenBankingController::class, 'providers']);
    Route::get('open-banking/institutions/{provider}', [OpenBankingController::class, 'institutions']);
    Route::post('open-banking/initiate', [OpenBankingController::class, 'initiateConnection']);
    Route::post('open-banking/complete', [OpenBankingController::class, 'completeConnection']);
    Route::get('open-banking/connections', [OpenBankingController::class, 'connections']);
    Route::get('open-banking/connections/{connection}', [OpenBankingController::class, 'showConnection']);
    Route::post('open-banking/connections/{connection}/sync', [OpenBankingController::class, 'syncConnection']);
    Route::post('open-banking/connections/{connection}/queue-sync', [OpenBankingController::class, 'queueSync']);
    Route::put('open-banking/connections/{connection}', [OpenBankingController::class, 'updateConnection']);
    Route::delete('open-banking/connections/{connection}', [OpenBankingController::class, 'disconnectConnection']);
    Route::post('open-banking/connections/{connection}/refresh', [OpenBankingController::class, 'refreshConnection']);
    Route::post('open-banking/plaid/callback', [OpenBankingController::class, 'plaidLinkCallback']);
});

// Public webhook endpoint (no auth)
Route::post('api/banking/webhooks/{provider}', [OpenBankingController::class, 'webhook']);
