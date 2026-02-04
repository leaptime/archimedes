<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Controllers\ContactController;

Route::middleware(['web', 'auth:sanctum'])->prefix('api')->group(function () {
    // Contact metadata (no model access check - reference data)
    Route::get('/contacts/fields', [ContactController::class, 'fields']);
    Route::get('/contacts/options', [ContactController::class, 'options']);
    Route::get('/contacts/stats', [ContactController::class, 'stats']);
    
    // Contact CRUD with model access middleware
    Route::middleware(['model.access:contacts.contact'])->group(function () {
        Route::post('/contacts/{id}/restore', [ContactController::class, 'restore']);
        Route::apiResource('contacts', ContactController::class);
        
        // Contact addresses
        Route::post('/contacts/{contact}/addresses', [ContactController::class, 'addAddress']);
        Route::put('/contacts/{contact}/addresses/{address}', [ContactController::class, 'updateAddress']);
        Route::delete('/contacts/{contact}/addresses/{address}', [ContactController::class, 'deleteAddress']);
        
        // Contact bank accounts
        Route::post('/contacts/{contact}/bank-accounts', [ContactController::class, 'addBankAccount']);
        Route::delete('/contacts/{contact}/bank-accounts/{bankAccount}', [ContactController::class, 'deleteBankAccount']);
    });
    
    // Categories (separate permission)
    Route::get('/contact-categories', [ContactController::class, 'categories']);
    Route::post('/contact-categories', [ContactController::class, 'createCategory']);
    
    // Country states (reference data - no permission check)
    Route::get('/countries/{country}/states', [ContactController::class, 'states']);
});
