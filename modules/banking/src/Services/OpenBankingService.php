<?php

namespace Modules\Banking\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Modules\Banking\Adapters\OpenBankingAdapterInterface;
use Modules\Banking\Adapters\GoCardlessAdapter;
use Modules\Banking\Adapters\PlaidAdapter;
use Modules\Banking\Models\BankAccount;
use Modules\Banking\Models\BankConnection;
use Modules\Banking\Models\BankStatementLine;

class OpenBankingService
{
    protected array $adapters = [];

    public function __construct()
    {
        $this->registerAdapter(new GoCardlessAdapter());
        $this->registerAdapter(new PlaidAdapter());
    }

    public function registerAdapter(OpenBankingAdapterInterface $adapter): void
    {
        $this->adapters[$adapter->getProviderName()] = $adapter;
    }

    public function getAdapter(string $provider): ?OpenBankingAdapterInterface
    {
        return $this->adapters[$provider] ?? null;
    }

    public function getAvailableProviders(): Collection
    {
        return collect($this->adapters)->map(function ($adapter) {
            return [
                'id' => $adapter->getProviderName(),
                'name' => $adapter->getDisplayName(),
                'countries' => $adapter->getSupportedCountries(),
                'configured' => $adapter->isConfigured(),
            ];
        })->values();
    }

    public function getConfiguredProviders(): Collection
    {
        return $this->getAvailableProviders()->filter(fn($p) => $p['configured']);
    }

    public function getInstitutions(string $provider, ?string $country = null): Collection
    {
        $adapter = $this->getAdapter($provider);

        if (!$adapter || !$adapter->isConfigured()) {
            throw new \RuntimeException("Provider {$provider} is not configured");
        }

        return $adapter->getInstitutions($country);
    }

    public function initiateConnection(
        string $provider,
        string $institutionId,
        string $redirectUri,
        array $options = []
    ): array {
        $adapter = $this->getAdapter($provider);

        if (!$adapter || !$adapter->isConfigured()) {
            throw new \RuntimeException("Provider {$provider} is not configured");
        }

        $options['institution_id'] = $institutionId;

        $authUrl = $adapter->getAuthorizationUrl($redirectUri, $options);

        return [
            'provider' => $provider,
            'institution_id' => $institutionId,
            'authorization_url' => $authUrl,
            // For Plaid, this is actually the link_token
            'is_link_token' => $provider === 'plaid',
        ];
    }

    public function completeConnection(
        string $provider,
        string $code,
        BankAccount $bankAccount,
        array $options = []
    ): BankConnection {
        $adapter = $this->getAdapter($provider);

        if (!$adapter) {
            throw new \RuntimeException("Unknown provider: {$provider}");
        }

        $credentials = $adapter->exchangeCode($code, $options['redirect_uri'] ?? '');

        // Get institution details if available
        $institutionId = $credentials['institution_id'] ?? $options['institution_id'] ?? null;
        $institutionName = $options['institution_name'] ?? null;
        $institutionLogo = null;

        if ($institutionId) {
            try {
                $institutions = $adapter->getInstitutions();
                $institution = $institutions->firstWhere('id', $institutionId);
                if ($institution) {
                    $institutionName = $institution['name'];
                    $institutionLogo = $institution['logo'] ?? null;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch institution details', ['error' => $e->getMessage()]);
            }
        }

        // Create connection
        $connection = BankConnection::create([
            'bank_account_id' => $bankAccount->id,
            'provider' => $provider,
            'institution_id' => $institutionId,
            'institution_name' => $institutionName,
            'institution_logo' => $institutionLogo,
            'external_account_id' => $credentials['accounts'][0] ?? null,
            'credentials' => $credentials,
            'status' => BankConnection::STATUS_ACTIVE,
            'expires_at' => !empty($credentials['expires_at'])
                ? \Carbon\Carbon::parse($credentials['expires_at'])
                : null,
            'settings' => [
                'sync_interval_hours' => 6,
                'auto_sync' => true,
            ],
        ]);

        // Perform initial sync
        try {
            $this->syncConnection($connection);
        } catch (\Exception $e) {
            Log::error('Initial sync failed', ['error' => $e->getMessage()]);
            $connection->markError('Initial sync failed: ' . $e->getMessage());
        }

        return $connection;
    }

    public function syncConnection(BankConnection $connection): int
    {
        $adapter = $this->getAdapter($connection->provider);

        if (!$adapter) {
            throw new \RuntimeException("Unknown provider: {$connection->provider}");
        }

        // Check if connection is expired
        if ($connection->isExpired()) {
            $connection->markExpired();
            throw new \RuntimeException('Connection has expired. Please reconnect.');
        }

        $totalImported = 0;

        try {
            // Get accounts from provider
            $accounts = $adapter->getAccounts($connection);

            if ($accounts->isEmpty()) {
                throw new \RuntimeException('No accounts available');
            }

            $bankAccount = $connection->bankAccount;

            // Get last sync date or default to 30 days ago
            $fromDate = $connection->last_sync_at
                ? $connection->last_sync_at->subDay()->format('Y-m-d')
                : now()->subDays(30)->format('Y-m-d');

            foreach ($accounts as $account) {
                // Get transactions
                $transactions = $adapter->getTransactions(
                    $connection,
                    $account['id'],
                    $fromDate
                );

                // Import transactions
                $imported = $this->importTransactions($bankAccount, $transactions, $connection);
                $totalImported += $imported;

                // Update balance
                $balances = $adapter->getBalances($connection, $account['id']);
                $currentBalance = collect($balances)->firstWhere('type', 'current');
                if ($currentBalance) {
                    $bankAccount->current_balance = $currentBalance['amount'];
                    $bankAccount->save();
                }
            }

            $connection->markSynced($totalImported);

        } catch (\Exception $e) {
            $connection->markError($e->getMessage());
            throw $e;
        }

        return $totalImported;
    }

    protected function importTransactions(
        BankAccount $bankAccount,
        Collection $transactions,
        BankConnection $connection
    ): int {
        $imported = 0;

        foreach ($transactions as $tx) {
            // Skip pending transactions if configured
            if (($tx['raw']['pending'] ?? false) && !($connection->settings['include_pending'] ?? false)) {
                continue;
            }

            // Check for duplicates
            $exists = BankStatementLine::where('bank_account_id', $bankAccount->id)
                ->where(function ($query) use ($tx) {
                    $query->where('transaction_details->id', $tx['id'])
                        ->orWhere(function ($q) use ($tx) {
                            $q->whereDate('date', $tx['date'])
                                ->where('amount', $tx['amount'])
                                ->where('payment_ref', $tx['description']);
                        });
                })
                ->exists();

            if ($exists) {
                continue;
            }

            // Create transaction
            BankStatementLine::create([
                'bank_account_id' => $bankAccount->id,
                'date' => $tx['date'],
                'amount' => $tx['amount'],
                'currency_code' => $tx['currency'],
                'payment_ref' => $tx['description'],
                'partner_name' => $tx['partner_name'],
                'account_number' => $tx['partner_account'],
                'transaction_type' => $tx['category'] ?? null,
                'transaction_details' => [
                    'id' => $tx['id'],
                    'provider' => $connection->provider,
                    'reference' => $tx['reference'],
                    'raw' => $tx['raw'],
                ],
            ]);

            $imported++;
        }

        return $imported;
    }

    public function disconnectConnection(BankConnection $connection): bool
    {
        $adapter = $this->getAdapter($connection->provider);

        if ($adapter) {
            try {
                $adapter->revokeConnection($connection);
            } catch (\Exception $e) {
                Log::warning('Failed to revoke connection at provider', ['error' => $e->getMessage()]);
            }
        }

        $connection->status = BankConnection::STATUS_REVOKED;
        $connection->sync_enabled = false;
        $connection->save();
        $connection->delete();

        return true;
    }

    public function refreshConnection(BankConnection $connection): BankConnection
    {
        $adapter = $this->getAdapter($connection->provider);

        if (!$adapter) {
            throw new \RuntimeException("Unknown provider: {$connection->provider}");
        }

        try {
            $newCredentials = $adapter->refreshToken($connection);
            $connection->credentials = $newCredentials;
            $connection->status = BankConnection::STATUS_ACTIVE;
            $connection->error_message = null;
            $connection->save();
        } catch (\Exception $e) {
            $connection->markError($e->getMessage());
            throw $e;
        }

        return $connection;
    }

    public function getConnectionStatus(BankConnection $connection): array
    {
        return [
            'id' => $connection->id,
            'provider' => $connection->provider,
            'institution_name' => $connection->institution_name,
            'institution_logo' => $connection->institution_logo,
            'status' => $connection->status,
            'display_status' => $connection->display_status,
            'is_active' => $connection->isActive(),
            'is_expired' => $connection->isExpired(),
            'last_sync_at' => $connection->last_sync_at?->toIso8601String(),
            'next_sync_at' => $connection->next_sync_at?->toIso8601String(),
            'expires_at' => $connection->expires_at?->toIso8601String(),
            'error_message' => $connection->error_message,
            'sync_enabled' => $connection->sync_enabled,
        ];
    }
}
