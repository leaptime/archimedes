<?php

use Illuminate\Support\Facades\Route;
use Modules\Crm\Http\Controllers\CrmController;

Route::prefix('api/crm')->middleware(['api', 'auth:sanctum'])->group(function () {
    // Pipeline & Stats
    Route::get('/pipeline', [CrmController::class, 'pipeline']);
    Route::get('/stats', [CrmController::class, 'stats']);
    Route::get('/forecast', [CrmController::class, 'forecast']);
    
    // Reference data
    Route::get('/stages', [CrmController::class, 'stages']);
    Route::get('/teams', [CrmController::class, 'teams']);
    Route::get('/tags', [CrmController::class, 'tags']);
    Route::post('/tags', [CrmController::class, 'storeTag']);
    Route::get('/lost-reasons', [CrmController::class, 'lostReasons']);
    
    // Analytics
    Route::get('/analytics/lost-reasons', [CrmController::class, 'lostReasonsAnalysis']);
    
    // Leads CRUD
    Route::get('/leads', [CrmController::class, 'index']);
    Route::post('/leads', [CrmController::class, 'store']);
    Route::get('/leads/{id}', [CrmController::class, 'show']);
    Route::put('/leads/{id}', [CrmController::class, 'update']);
    Route::delete('/leads/{id}', [CrmController::class, 'destroy']);
    
    // Lead actions
    Route::post('/leads/{id}/move', [CrmController::class, 'moveStage']);
    Route::post('/leads/{id}/assign', [CrmController::class, 'assign']);
    Route::post('/leads/{id}/convert', [CrmController::class, 'convert']);
    Route::post('/leads/{id}/won', [CrmController::class, 'markWon']);
    Route::post('/leads/{id}/lost', [CrmController::class, 'markLost']);
    Route::post('/leads/{id}/reopen', [CrmController::class, 'reopen']);
    Route::post('/leads/{id}/create-contact', [CrmController::class, 'createContact']);
    
    // Activities
    Route::post('/leads/{leadId}/activities', [CrmController::class, 'storeActivity']);
    Route::put('/leads/{leadId}/activities/{activityId}', [CrmController::class, 'updateActivity']);
    Route::delete('/leads/{leadId}/activities/{activityId}', [CrmController::class, 'destroyActivity']);
    Route::post('/leads/{leadId}/activities/{activityId}/done', [CrmController::class, 'markActivityDone']);
});
