<?php

use Illuminate\Support\Facades\Route;
use Modules\Core\Controllers\ModuleController;
use Modules\Core\Controllers\PermissionController;

Route::middleware(['web', 'auth:sanctum'])->prefix('api')->group(function () {
    // Module routes
    Route::get('/modules', [ModuleController::class, 'index']);
    Route::get('/modules/stats', [ModuleController::class, 'stats']);
    Route::get('/modules/compliance', [ModuleController::class, 'compliance']);
    Route::get('/modules/{module}', [ModuleController::class, 'show']);
    Route::get('/modules/{module}/compliance', [ModuleController::class, 'moduleCompliance']);

    // Permission routes
    Route::prefix('permissions')->group(function () {
        Route::get('/me', [PermissionController::class, 'myPermissions']);
        Route::get('/groups', [PermissionController::class, 'groups']);
        Route::get('/access', [PermissionController::class, 'accessRules']);
        Route::get('/rules', [PermissionController::class, 'recordRules']);
        Route::post('/check', [PermissionController::class, 'check']);
        Route::post('/has-group', [PermissionController::class, 'hasGroup']);
        Route::get('/model/{model}', [PermissionController::class, 'modelMatrix']);
        
        // Admin routes
        Route::post('/reload', [PermissionController::class, 'reload']);
        Route::post('/assign-groups', [PermissionController::class, 'assignGroups']);
    });

    // Users route (admin only)
    Route::get('/users', [PermissionController::class, 'users']);
});
