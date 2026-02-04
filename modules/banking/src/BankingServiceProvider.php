<?php

namespace Modules\Banking;

use Illuminate\Support\ServiceProvider;
use Modules\Banking\Services\ImportService;
use Modules\Banking\Services\ReconciliationService;

class BankingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ImportService::class);
        $this->app->singleton(ReconciliationService::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/routes.php');
    }
}
