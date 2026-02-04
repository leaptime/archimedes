<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes use Sanctum's SPA authentication which requires
| session/cookie middleware for CSRF and session handling.
|
*/

// All API routes need web middleware for Sanctum SPA authentication
Route::middleware(['web'])->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
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
    });
});

// Health check (no session needed)
Route::get('/health', fn () => response()->json(['status' => 'ok']));
