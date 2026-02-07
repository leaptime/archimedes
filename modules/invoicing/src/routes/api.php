<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoicing\Controllers\InvoiceController;
use Modules\Invoicing\Controllers\PaymentTermController;
use Modules\Invoicing\Controllers\PaymentController;
use Modules\Invoicing\Controllers\ProductController;
use Modules\Invoicing\Controllers\TaxController;

Route::middleware(['web', 'auth.session'])->prefix('api')->group(function () {
    // Reference data (no permission check needed)
    Route::get('/invoices/stats', [InvoiceController::class, 'stats']);
    Route::get('/invoices/currencies', [InvoiceController::class, 'currencies']);
    Route::get('/invoices/taxes', [InvoiceController::class, 'taxes']);

    // Invoice CRUD and actions with model access middleware
    Route::middleware(['model.access:invoicing.invoice'])->group(function () {
        // Invoice Actions
        Route::post('/invoices/{invoice}/post', [InvoiceController::class, 'post']);
        Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
        Route::post('/invoices/{invoice}/reset-to-draft', [InvoiceController::class, 'resetToDraft']);
        Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
        Route::post('/invoices/{invoice}/duplicate', [InvoiceController::class, 'duplicate']);
        Route::post('/invoices/{invoice}/credit-note', [InvoiceController::class, 'createCreditNote']);
        Route::post('/invoices/{invoice}/register-payment', [InvoiceController::class, 'registerPayment']);
        
        // PDF endpoints
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
        Route::get('/invoices/{invoice}/pdf/view', [InvoiceController::class, 'viewPdf']);
        Route::get('/invoices/{invoice}/pdf/preview', [InvoiceController::class, 'previewPdf']);
        
        // Email endpoints
        Route::post('/invoices/{invoice}/email', [InvoiceController::class, 'sendEmail']);
        Route::get('/invoices/{invoice}/email/preview', [InvoiceController::class, 'emailPreview']);
        Route::post('/invoices/{invoice}/reminder', [InvoiceController::class, 'sendReminder']);
        
        // Legacy endpoint
        Route::post('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'registerPayment']);

        // Invoices CRUD
        Route::apiResource('invoices', InvoiceController::class);

        // Payments (nested under invoices)
        Route::apiResource('invoices.payments', PaymentController::class)->shallow();
    });

    // Products with model access
    Route::middleware(['model.access:invoicing.product'])->group(function () {
        Route::apiResource('products', ProductController::class);
    });

    // Payment Terms (manager only)
    Route::apiResource('payment-terms', PaymentTermController::class);

    // Taxes (manager only)
    Route::apiResource('taxes', TaxController::class);
});
