<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoicing\Controllers\InvoiceController;
use Modules\Invoicing\Controllers\PaymentTermController;
use Modules\Invoicing\Controllers\PaymentController;
use Modules\Invoicing\Controllers\ProductController;
use Modules\Invoicing\Controllers\TaxController;

Route::middleware(['web', 'auth:sanctum'])->prefix('api')->group(function () {
    // Invoice Stats (before resource to avoid conflict)
    Route::get('/invoices/stats', [InvoiceController::class, 'stats']);
    Route::get('/invoices/currencies', [InvoiceController::class, 'currencies']);
    Route::get('/invoices/taxes', [InvoiceController::class, 'taxes']);

    // Invoice Actions
    Route::post('/invoices/{invoice}/post', [InvoiceController::class, 'post']);
    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    Route::post('/invoices/{invoice}/reset-to-draft', [InvoiceController::class, 'resetToDraft']);
    Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
    Route::post('/invoices/{invoice}/duplicate', [InvoiceController::class, 'duplicate']);
    Route::post('/invoices/{invoice}/credit-note', [InvoiceController::class, 'createCreditNote']);
    Route::post('/invoices/{invoice}/register-payment', [InvoiceController::class, 'registerPayment']);
    
    // Legacy endpoint
    Route::post('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'registerPayment']);

    // Invoices CRUD
    Route::apiResource('invoices', InvoiceController::class);

    // Payment Terms
    Route::apiResource('payment-terms', PaymentTermController::class);

    // Products
    Route::apiResource('products', ProductController::class);

    // Taxes
    Route::apiResource('taxes', TaxController::class);

    // Payments (nested under invoices)
    Route::apiResource('invoices.payments', PaymentController::class)->shallow();
});
