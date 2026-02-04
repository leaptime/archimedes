<?php

namespace Modules\CashBook;

use Illuminate\Support\ServiceProvider;
use Modules\CashBook\Services\CashBookService;

class CashBookServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CashBookService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }
}
