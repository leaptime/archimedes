<?php

use Illuminate\Support\Facades\Route;
use Modules\Core\Controllers\ModuleController;
use Modules\Core\Controllers\PermissionController;
use Modules\Core\Plugins\PluginController;

Route::middleware(['web', 'auth.session'])->prefix('api')->group(function () {
    // Module routes
    Route::get('/modules', [ModuleController::class, 'index']);
    Route::get('/modules/stats', [ModuleController::class, 'stats']);
    Route::get('/modules/compliance', [ModuleController::class, 'compliance']);
    Route::get('/modules/{module}', [ModuleController::class, 'show']);
    Route::post('/modules/{module}/clear-cache', [ModuleController::class, 'clearCache']);
    Route::get('/modules/{module}/compliance', [ModuleController::class, 'moduleCompliance']);
    Route::get('/modules/{module}/plugins', [PluginController::class, 'forModule']);

    // Plugin routes
    Route::prefix('plugins')->group(function () {
        Route::get('/', [PluginController::class, 'index']);
        Route::get('/stats', [PluginController::class, 'stats']);
        Route::get('/validate', [PluginController::class, 'validate']);
        Route::get('/slots', [PluginController::class, 'slots']);
        Route::get('/slots/{slot}', [PluginController::class, 'pluginsForSlot'])
            ->where('slot', '.*');
        Route::get('/fields', [PluginController::class, 'fields']);
        Route::get('/fields/{model}', [PluginController::class, 'fieldsForModel']);
        Route::post('/clear-cache', [PluginController::class, 'clearCache']);
        Route::get('/{pluginId}', [PluginController::class, 'show']);
    });

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
