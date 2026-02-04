<?php

namespace Modules\L10nItEdi;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class L10nItEdiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/l10n_it_edi.php', 'l10n_it_edi');
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/routes/api.php');

        $this->publishes([
            __DIR__ . '/../config/l10n_it_edi.php' => config_path('l10n_it_edi.php'),
        ], 'l10n-it-edi-config');
    }
}
