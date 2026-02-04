<?php

namespace Modules\Banking\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\Banking\Models\BankConnection;

class SyncAllBankConnectionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('Starting scheduled bank connections sync');

        $connections = BankConnection::where('sync_enabled', true)
            ->where('status', BankConnection::STATUS_ACTIVE)
            ->where(function ($query) {
                $query->whereNull('next_sync_at')
                    ->orWhere('next_sync_at', '<=', now());
            })
            ->get();

        Log::info('Found connections to sync', ['count' => $connections->count()]);

        foreach ($connections as $connection) {
            SyncBankConnectionJob::dispatch($connection)
                ->delay(now()->addSeconds(rand(1, 30))); // Stagger to avoid rate limits
        }
    }
}
