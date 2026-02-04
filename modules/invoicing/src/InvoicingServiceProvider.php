<?php

namespace Modules\Invoicing;

use Illuminate\Support\ServiceProvider;

class InvoicingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/invoicing.php', 'invoicing');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/routes/api.php');
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'invoicing');
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $this->publishes([
            __DIR__ . '/../config/invoicing.php' => config_path('invoicing.php'),
        ], 'invoicing-config');
    }
}
