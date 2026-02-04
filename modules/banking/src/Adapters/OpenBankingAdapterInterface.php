<?php

namespace Modules\Banking\Adapters;

use Illuminate\Support\Collection;
use Modules\Banking\Models\BankConnection;

interface OpenBankingAdapterInterface
{
    /**
     * Get the provider name (e.g., 'gocardless', 'plaid')
     */
    public function getProviderName(): string;

    /**
     * Get the display name for UI
     */
    public function getDisplayName(): string;

    /**
     * Get supported countries (ISO 3166-1 alpha-2 codes)
     */
    public function getSupportedCountries(): array;

    /**
     * Check if the adapter is configured with valid credentials
     */
    public function isConfigured(): bool;

    /**
     * Get the authorization URL to start bank connection
     */
    public function getAuthorizationUrl(string $redirectUri, array $options = []): string;

    /**
     * Exchange authorization code for access tokens
     */
    public function exchangeCode(string $code, string $redirectUri): array;

    /**
     * Refresh access token if expired
     */
    public function refreshToken(BankConnection $connection): array;

    /**
     * Get list of available institutions/banks
     */
    public function getInstitutions(?string $country = null): Collection;

    /**
     * Get accounts linked to a connection
     */
    public function getAccounts(BankConnection $connection): Collection;

    /**
     * Get account balances
     */
    public function getBalances(BankConnection $connection, string $accountId): array;

    /**
     * Get transactions for an account
     */
    public function getTransactions(
        BankConnection $connection,
        string $accountId,
        ?string $fromDate = null,
        ?string $toDate = null
    ): Collection;

    /**
     * Delete/revoke a connection
     */
    public function revokeConnection(BankConnection $connection): bool;

    /**
     * Check if connection is still valid
     */
    public function validateConnection(BankConnection $connection): bool;

    /**
     * Verify webhook signature for security
     */
    public function verifyWebhookSignature(string $payload, string $signature, array $headers = []): bool;
}
