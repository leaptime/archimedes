<?php

use Illuminate\Support\Facades\Route;
use Modules\CashBook\Http\Controllers\CashBookController;

Route::prefix('api/cashbook')->middleware(['api', 'auth:sanctum'])->group(function () {
    // Stats and summary
    Route::get('/stats', [CashBookController::class, 'stats']);
    Route::get('/summary', [CashBookController::class, 'summary']);
    
    // Open invoices for allocation
    Route::get('/open-invoices', [CashBookController::class, 'getOpenInvoices']);
    
    // Transfers
    Route::post('/transfer', [CashBookController::class, 'transfer']);
    
    // Bulk actions
    Route::post('/bulk-confirm', [CashBookController::class, 'bulkConfirm']);
    
    // Entry CRUD
    Route::get('/', [CashBookController::class, 'index']);
    Route::post('/', [CashBookController::class, 'store']);
    Route::get('/{id}', [CashBookController::class, 'show']);
    Route::put('/{id}', [CashBookController::class, 'update']);
    Route::delete('/{id}', [CashBookController::class, 'destroy']);
    
    // Entry actions
    Route::post('/{id}/confirm', [CashBookController::class, 'confirm']);
    Route::post('/{id}/cancel', [CashBookController::class, 'cancel']);
    
    // Allocations
    Route::post('/{id}/allocate', [CashBookController::class, 'allocate']);
    Route::post('/{id}/auto-allocate', [CashBookController::class, 'autoAllocate']);
    Route::delete('/{entryId}/allocations/{allocationId}', [CashBookController::class, 'removeAllocation']);
    Route::put('/{entryId}/allocations/{allocationId}', [CashBookController::class, 'updateAllocation']);
});
