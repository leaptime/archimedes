<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Modules\Banking\Jobs\SyncAllBankConnectionsJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bank connections sync - runs every hour
Schedule::job(new SyncAllBankConnectionsJob)->hourly();

// Manual sync command
Artisan::command('banking:sync', function () {
    $this->info('Dispatching bank connections sync job...');
    SyncAllBankConnectionsJob::dispatch();
    $this->info('Job dispatched successfully.');
})->purpose('Manually trigger bank connections sync');
