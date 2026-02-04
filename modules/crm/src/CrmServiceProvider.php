<?php

namespace Modules\Crm;

use Illuminate\Support\ServiceProvider;
use Modules\Crm\Services\CrmService;

class CrmServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CrmService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }
}
