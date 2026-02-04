<?php

namespace Modules\Banking\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\Banking\Models\BankConnection;
use Modules\Banking\Services\OpenBankingService;

class SyncBankConnectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public BankConnection $connection
    ) {}

    public function handle(OpenBankingService $service): void
    {
        Log::info('Starting bank connection sync', [
            'connection_id' => $this->connection->id,
            'provider' => $this->connection->provider,
        ]);

        try {
            $imported = $service->syncConnection($this->connection);

            Log::info('Bank connection sync completed', [
                'connection_id' => $this->connection->id,
                'transactions_imported' => $imported,
            ]);

        } catch (\Exception $e) {
            Log::error('Bank connection sync failed', [
                'connection_id' => $this->connection->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Bank connection sync job failed permanently', [
            'connection_id' => $this->connection->id,
            'error' => $exception->getMessage(),
        ]);

        $this->connection->markError('Sync failed after multiple attempts: ' . $exception->getMessage());
    }
}
