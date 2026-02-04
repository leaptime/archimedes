<?php

namespace Modules\Banking\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Banking\Models\BankAccount;
use Modules\Banking\Models\BankConnection;
use Modules\Banking\Services\OpenBankingService;
use Modules\Banking\Jobs\SyncBankConnectionJob;

class OpenBankingController extends Controller
{
    public function __construct(
        protected OpenBankingService $openBankingService
    ) {}

    /**
     * Get available Open Banking providers
     */
    public function providers(): JsonResponse
    {
        $providers = $this->openBankingService->getAvailableProviders();

        return response()->json(['data' => $providers]);
    }

    /**
     * Get available institutions for a provider
     */
    public function institutions(Request $request, string $provider): JsonResponse
    {
        $request->validate([
            'country' => 'nullable|string|size:2',
        ]);

        try {
            $institutions = $this->openBankingService->getInstitutions(
                $provider,
                $request->country
            );

            return response()->json(['data' => $institutions]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Initiate a bank connection
     */
    public function initiateConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:gocardless,plaid',
            'institution_id' => 'required|string',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'redirect_uri' => 'required|url',
        ]);

        try {
            $result = $this->openBankingService->initiateConnection(
                $validated['provider'],
                $validated['institution_id'],
                $validated['redirect_uri'],
                [
                    'bank_account_id' => $validated['bank_account_id'],
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json(['data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Complete a bank connection (callback handler)
     */
    public function completeConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:gocardless,plaid',
            'code' => 'required|string', // requisition_id for GoCardless, public_token for Plaid
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'institution_id' => 'nullable|string',
            'institution_name' => 'nullable|string',
        ]);

        try {
            $bankAccount = BankAccount::findOrFail($validated['bank_account_id']);

            $connection = $this->openBankingService->completeConnection(
                $validated['provider'],
                $validated['code'],
                $bankAccount,
                [
                    'institution_id' => $validated['institution_id'],
                    'institution_name' => $validated['institution_name'],
                ]
            );

            // Update bank account source
            $bankAccount->bank_feeds_source = $validated['provider'];
            $bankAccount->save();

            return response()->json([
                'data' => $this->openBankingService->getConnectionStatus($connection),
                'message' => 'Bank account connected successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Get connections for a bank account
     */
    public function connections(Request $request): JsonResponse
    {
        $query = BankConnection::with('bankAccount')
            ->whereNull('deleted_at');

        if ($request->bank_account_id) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        $connections = $query->get()->map(function ($connection) {
            return $this->openBankingService->getConnectionStatus($connection);
        });

        return response()->json(['data' => $connections]);
    }

    /**
     * Get connection details
     */
    public function showConnection(BankConnection $connection): JsonResponse
    {
        $status = $this->openBankingService->getConnectionStatus($connection);
        $status['sync_logs'] = $connection->syncLogs()->limit(10)->get();

        return response()->json(['data' => $status]);
    }

    /**
     * Sync a connection manually
     */
    public function syncConnection(BankConnection $connection): JsonResponse
    {
        if (!$connection->isActive()) {
            return response()->json([
                'error' => 'Connection is not active. Status: ' . $connection->display_status
            ], 422);
        }

        try {
            $imported = $this->openBankingService->syncConnection($connection);

            return response()->json([
                'data' => $this->openBankingService->getConnectionStatus($connection),
                'message' => "Synced successfully. Imported {$imported} transactions.",
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Queue a sync job
     */
    public function queueSync(BankConnection $connection): JsonResponse
    {
        if (!$connection->isActive()) {
            return response()->json([
                'error' => 'Connection is not active'
            ], 422);
        }

        SyncBankConnectionJob::dispatch($connection);

        return response()->json([
            'message' => 'Sync job queued successfully',
        ]);
    }

    /**
     * Update connection settings
     */
    public function updateConnection(Request $request, BankConnection $connection): JsonResponse
    {
        $validated = $request->validate([
            'sync_enabled' => 'nullable|boolean',
            'settings.sync_interval_hours' => 'nullable|integer|min:1|max:24',
            'settings.include_pending' => 'nullable|boolean',
        ]);

        if (isset($validated['sync_enabled'])) {
            $connection->sync_enabled = $validated['sync_enabled'];
        }

        if (isset($validated['settings'])) {
            $connection->settings = array_merge(
                $connection->settings ?? [],
                $validated['settings']
            );
        }

        $connection->save();

        return response()->json([
            'data' => $this->openBankingService->getConnectionStatus($connection),
        ]);
    }

    /**
     * Disconnect a bank connection
     */
    public function disconnectConnection(BankConnection $connection): JsonResponse
    {
        $bankAccount = $connection->bankAccount;

        $this->openBankingService->disconnectConnection($connection);

        // Reset bank account source if no other connections
        $remainingConnections = BankConnection::where('bank_account_id', $bankAccount->id)
            ->where('id', '!=', $connection->id)
            ->whereNull('deleted_at')
            ->exists();

        if (!$remainingConnections) {
            $bankAccount->bank_feeds_source = null;
            $bankAccount->save();
        }

        return response()->json([
            'message' => 'Connection disconnected successfully',
        ]);
    }

    /**
     * Refresh an expired connection
     */
    public function refreshConnection(BankConnection $connection): JsonResponse
    {
        try {
            $connection = $this->openBankingService->refreshConnection($connection);

            return response()->json([
                'data' => $this->openBankingService->getConnectionStatus($connection),
                'message' => 'Connection refreshed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Handle Plaid Link callback (webhook for receiving public_token)
     */
    public function plaidLinkCallback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'public_token' => 'required|string',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'institution' => 'nullable|array',
            'institution.institution_id' => 'nullable|string',
            'institution.name' => 'nullable|string',
        ]);

        return $this->completeConnection($request->merge([
            'provider' => 'plaid',
            'code' => $validated['public_token'],
            'institution_id' => $validated['institution']['institution_id'] ?? null,
            'institution_name' => $validated['institution']['name'] ?? null,
        ]));
    }

    /**
     * Handle provider webhooks
     */
    public function webhook(Request $request, string $provider): JsonResponse
    {
        $adapter = $this->openBankingService->getAdapter($provider);

        if (!$adapter) {
            return response()->json(['error' => 'Unknown provider'], 404);
        }

        // Verify webhook signature
        $payload = $request->getContent();
        $signature = $request->header('Plaid-Verification') 
            ?? $request->header('X-Signature') 
            ?? '';

        $headers = [
            'plaid-verification' => $request->header('Plaid-Verification'),
            'x-signature' => $request->header('X-Signature'),
        ];

        if (!$adapter->verifyWebhookSignature($payload, $signature, $headers)) {
            \Log::warning("Open Banking webhook signature verification failed", [
                'provider' => $provider,
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Log webhook for debugging
        \Log::info("Open Banking webhook received", [
            'provider' => $provider,
            'payload' => $request->all(),
        ]);

        // Handle provider-specific webhook events
        $this->processWebhookEvent($provider, $request->all());

        return response()->json(['status' => 'ok']);
    }

    /**
     * Process webhook events and trigger appropriate actions
     */
    protected function processWebhookEvent(string $provider, array $payload): void
    {
        switch ($provider) {
            case 'plaid':
                $this->handlePlaidWebhook($payload);
                break;
            case 'gocardless':
                $this->handleGoCardlessWebhook($payload);
                break;
        }
    }

    protected function handlePlaidWebhook(array $payload): void
    {
        $webhookType = $payload['webhook_type'] ?? '';
        $webhookCode = $payload['webhook_code'] ?? '';
        $itemId = $payload['item_id'] ?? null;

        if (!$itemId) {
            return;
        }

        // Find connection by item_id in credentials
        $connection = BankConnection::where('provider', 'plaid')
            ->whereJsonContains('credentials->item_id', $itemId)
            ->first();

        if (!$connection) {
            \Log::warning('Plaid webhook: Connection not found', ['item_id' => $itemId]);
            return;
        }

        switch ($webhookType) {
            case 'TRANSACTIONS':
                if (in_array($webhookCode, ['INITIAL_UPDATE', 'HISTORICAL_UPDATE', 'DEFAULT_UPDATE'])) {
                    // Queue a sync job
                    \Modules\Banking\Jobs\SyncBankConnectionJob::dispatch($connection);
                }
                break;

            case 'ITEM':
                if ($webhookCode === 'ERROR') {
                    $connection->markError($payload['error']['error_message'] ?? 'Item error');
                } elseif ($webhookCode === 'PENDING_EXPIRATION') {
                    $connection->update(['error_message' => 'Connection will expire soon. Please reconnect.']);
                }
                break;
        }
    }

    protected function handleGoCardlessWebhook(array $payload): void
    {
        // GoCardless Bank Account Data doesn't use webhooks in the same way
        // Their API is polling-based, but they may send notifications
        $event = $payload['event'] ?? $payload['type'] ?? null;
        
        \Log::info('GoCardless webhook event', ['event' => $event, 'payload' => $payload]);
    }
}
