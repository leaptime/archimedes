<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PlatformPartnerController;
use App\Http\Controllers\Api\DebugController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes use Sanctum's SPA authentication. The 'web' middleware group
| is required for session-based authentication and CSRF protection.
|
*/

Route::middleware(['web'])->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected routes (using 'auth' for session-based auth via web middleware)
    Route::middleware('auth.session')->group(function () {
    // User
    Route::get('/user', [UserController::class, 'show']);
    Route::patch('/user/profile', [UserController::class, 'updateProfile']);
    Route::patch('/user/password', [UserController::class, 'updatePassword']);
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerification']);
    
    // Two-factor authentication
    Route::post('/two-factor-challenge', [AuthController::class, 'twoFactorChallenge']);
    Route::get('/two-factor-qr-code', [AuthController::class, 'twoFactorQrCode']);
    Route::get('/two-factor-recovery-codes', [AuthController::class, 'twoFactorRecoveryCodes']);
    Route::post('/two-factor-recovery-codes', [AuthController::class, 'regenerateRecoveryCodes']);
    Route::post('/user/confirm-password', [AuthController::class, 'confirmPassword']);
    Route::post('/user/two-factor-authentication', [AuthController::class, 'enableTwoFactor']);
    Route::delete('/user/two-factor-authentication', [AuthController::class, 'disableTwoFactor']);

    /*
    |--------------------------------------------------------------------------
    | Partner Portal Routes (for partner users)
    |--------------------------------------------------------------------------
    */
    Route::prefix('partner')->group(function () {
        Route::get('/dashboard', [PartnerController::class, 'dashboard']);
        Route::get('/profile', [PartnerController::class, 'profile']);
        Route::patch('/profile', [PartnerController::class, 'updateProfile']);
        Route::get('/organizations', [PartnerController::class, 'organizations']);
        Route::post('/organizations', [PartnerController::class, 'createOrganization']);
        Route::get('/organizations/{organization}', [PartnerController::class, 'showOrganization']);
        Route::patch('/organizations/{organization}', [PartnerController::class, 'updateOrganization']);
        Route::post('/organizations/{organization}/modules', [PartnerController::class, 'enableModule']);
        Route::delete('/organizations/{organization}/modules/{moduleId}', [PartnerController::class, 'disableModule']);
        Route::get('/payouts', [PartnerController::class, 'payouts']);
        Route::get('/revenue', [PartnerController::class, 'revenue']);
    });

    /*
    |--------------------------------------------------------------------------
    | Platform Admin Routes (for managing partners and organizations)
    |--------------------------------------------------------------------------
    */
    Route::prefix('platform')->group(function () {
        // Organization management
        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::get('/organizations/stats', [OrganizationController::class, 'stats']);
        Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
        Route::patch('/organizations/{organization}', [OrganizationController::class, 'update']);
        Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);

        // Partner management
        Route::get('/partners', [PlatformPartnerController::class, 'index']);
        Route::post('/partners', [PlatformPartnerController::class, 'store']);
        Route::get('/partners/stats', [PlatformPartnerController::class, 'stats']);
        Route::get('/partners/{partner}', [PlatformPartnerController::class, 'show']);
        Route::patch('/partners/{partner}', [PlatformPartnerController::class, 'update']);
        Route::delete('/partners/{partner}', [PlatformPartnerController::class, 'destroy']);
        Route::get('/partners/{partner}/payouts', [PlatformPartnerController::class, 'payouts']);
        Route::post('/partners/{partner}/payouts', [PlatformPartnerController::class, 'createPayout']);
        Route::post('/partners/{partner}/payouts/{payout}/complete', [PlatformPartnerController::class, 'completePayout']);
    });
    });
});

// Health check (no session needed)
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Debug RLS context (authenticated)
Route::middleware(['web', 'auth.session'])->get('/debug/rls', [DebugController::class, 'rlsContext']);
