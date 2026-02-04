<?php

use Illuminate\Support\Facades\Route;
use Modules\L10nItEdi\Controllers\L10nItEdiController;

Route::middleware(['web', 'auth:sanctum'])->prefix('api/l10n-it-edi')->group(function () {
    // Invoice EDI actions
    Route::post('/invoices/{invoice}/send', [L10nItEdiController::class, 'send']);
    Route::get('/invoices/{invoice}/status', [L10nItEdiController::class, 'status']);
    Route::get('/invoices/{invoice}/preview', [L10nItEdiController::class, 'preview']);
    Route::get('/invoices/{invoice}/validate', [L10nItEdiController::class, 'validate']);
    Route::post('/invoices/{invoice}/refresh', [L10nItEdiController::class, 'refresh']);
    
    // Attachments
    Route::get('/invoices/{invoice}/attachments', [L10nItEdiController::class, 'attachments']);
    Route::get('/attachments/{attachment}/download', [L10nItEdiController::class, 'downloadAttachment']);
    
    // Logs
    Route::get('/invoices/{invoice}/logs', [L10nItEdiController::class, 'logs']);
    
    // Reference data
    Route::get('/natura-options', [L10nItEdiController::class, 'naturaOptions']);
    Route::get('/regime-fiscale-options', [L10nItEdiController::class, 'regimeFiscaleOptions']);
    Route::get('/document-type-options', [L10nItEdiController::class, 'documentTypeOptions']);
});
