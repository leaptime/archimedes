<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Modules\Core\Http\Middleware\CheckModelAccess;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            AddLinkHeadersForPreloadedAssets::class,
            // Note: SetTenantContext is NOT here - it must run AFTER authentication
        ]);

        $middleware->api(append: [
            // Note: SetTenantContext is NOT here - it must run AFTER authentication
        ]);

        // Register custom middleware aliases
        $middleware->alias([
            'model.access' => CheckModelAccess::class,
            'tenant' => SetTenantContext::class,
            'auth.session' => \App\Http\Middleware\EnsureAuthenticated::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
