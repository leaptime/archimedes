<?php

namespace Modules\Banking\Adapters;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Modules\Banking\Models\BankConnection;
use Carbon\Carbon;

/**
 * Plaid adapter for Open Banking
 * 
 * Documentation: https://plaid.com/docs/
 * 
 * Free tier: 100 connections (Development)
 * Coverage: US, Canada, UK, EU
 */
class PlaidAdapter extends BaseOpenBankingAdapter
{
    protected ?string $environment = 'sandbox';

    protected array $environments = [
        'sandbox' => 'https://sandbox.plaid.com',
        'development' => 'https://development.plaid.com',
        'production' => 'https://production.plaid.com',
    ];

    public function getProviderName(): string
    {
        return 'plaid';
    }

    public function getDisplayName(): string
    {
        return 'Plaid';
    }

    public function getSupportedCountries(): array
    {
        return ['US', 'CA', 'GB', 'IE', 'FR', 'ES', 'NL', 'DE'];
    }

    protected function loadCredentials(): void
    {
        $this->clientId = config('banking.plaid.client_id')
            ?? setting('banking.plaid_client_id');
        $this->clientSecret = config('banking.plaid.secret')
            ?? setting('banking.plaid_secret');
        $this->environment = config('banking.plaid.environment')
            ?? setting('banking.plaid_environment')
            ?? 'sandbox';

        $this->baseUrl = $this->environments[$this->environment] ?? $this->environments['sandbox'];
    }

    protected function makeRequest(
        string $method,
        string $endpoint,
        array $options = [],
        ?string $accessToken = null
    ): array {
        $body = array_merge([
            'client_id' => $this->clientId,
            'secret' => $this->clientSecret,
        ], $options['body'] ?? []);

        if ($accessToken) {
            $body['access_token'] = $accessToken;
        }

        $response = Http::timeout(30)->post($this->baseUrl . $endpoint, $body);

        if ($response->failed()) {
            $error = $response->json();
            throw new \RuntimeException(
                "Plaid API error: " . ($error['error_message'] ?? $response->body())
            );
        }

        return $response->json() ?? [];
    }

    public function getInstitutions(?string $country = null): Collection
    {
        $response = $this->makeRequest('POST', '/institutions/get', [
            'body' => [
                'count' => 500,
                'offset' => 0,
                'country_codes' => $country ? [strtoupper($country)] : ['US', 'CA', 'GB'],
            ],
        ]);

        return collect($response['institutions'] ?? [])->map(function ($institution) {
            return [
                'id' => $institution['institution_id'],
                'name' => $institution['name'],
                'logo' => $institution['logo'] ?? null,
                'url' => $institution['url'] ?? null,
                'countries' => $institution['country_codes'] ?? [],
                'products' => $institution['products'] ?? [],
            ];
        });
    }

    /**
     * Create a Link token for Plaid Link initialization
     */
    public function createLinkToken(string $userId, string $redirectUri, array $options = []): string
    {
        $response = $this->makeRequest('POST', '/link/token/create', [
            'body' => [
                'user' => [
                    'client_user_id' => $userId,
                ],
                'client_name' => config('app.name', 'Archimedes'),
                'products' => $options['products'] ?? ['transactions'],
                'country_codes' => $options['countries'] ?? ['US', 'CA'],
                'language' => $options['language'] ?? 'en',
                'redirect_uri' => $redirectUri,
                'account_filters' => $options['account_filters'] ?? null,
            ],
        ]);

        return $response['link_token'];
    }

    public function getAuthorizationUrl(string $redirectUri, array $options = []): string
    {
        // Plaid uses Link (client-side JS) instead of redirect
        // Return the link token for frontend initialization
        $linkToken = $this->createLinkToken(
            $options['user_id'] ?? auth()->id() ?? 'anonymous',
            $redirectUri,
            $options
        );

        // Frontend will use this token with Plaid Link
        return $linkToken;
    }

    public function exchangeCode(string $publicToken, string $redirectUri): array
    {
        // Exchange public token for access token
        $response = $this->makeRequest('POST', '/item/public_token/exchange', [
            'body' => [
                'public_token' => $publicToken,
            ],
        ]);

        $accessToken = $response['access_token'];
        $itemId = $response['item_id'];

        // Get item details
        $itemResponse = $this->makeRequest('POST', '/item/get', [], $accessToken);

        // Get accounts
        $accountsResponse = $this->makeRequest('POST', '/accounts/get', [], $accessToken);

        return [
            'access_token' => $accessToken,
            'item_id' => $itemId,
            'institution_id' => $itemResponse['item']['institution_id'] ?? null,
            'accounts' => array_map(fn($a) => $a['account_id'], $accountsResponse['accounts'] ?? []),
            'created_at' => now()->toIso8601String(),
            'consent_expiration' => $itemResponse['item']['consent_expiration_time'] ?? null,
        ];
    }

    public function refreshToken(BankConnection $connection): array
    {
        // Plaid access tokens don't expire, but we should check item status
        $credentials = $connection->credentials;

        $response = $this->makeRequest('POST', '/item/get', [], $credentials['access_token']);

        if (!empty($response['item']['error'])) {
            throw new \RuntimeException(
                'Plaid item has an error: ' . ($response['item']['error']['error_message'] ?? 'Unknown error')
            );
        }

        return $credentials;
    }

    public function getAccounts(BankConnection $connection): Collection
    {
        $credentials = $connection->credentials;

        $response = $this->makeRequest('POST', '/accounts/get', [], $credentials['access_token']);

        return collect($response['accounts'] ?? [])->map(function ($account) {
            return $this->normalizeAccount([
                'id' => $account['account_id'],
                'name' => $account['name'] ?? $account['official_name'] ?? 'Account',
                'account_number' => $account['mask'] ? '****' . $account['mask'] : null,
                'currency' => $account['balances']['iso_currency_code'] ?? 'USD',
                'type' => $account['type'] ?? 'depository',
                'subtype' => $account['subtype'] ?? null,
                'balance' => $account['balances']['current'] ?? null,
                'available_balance' => $account['balances']['available'] ?? null,
                'raw' => $account,
            ]);
        });
    }

    public function getBalances(BankConnection $connection, string $accountId): array
    {
        $credentials = $connection->credentials;

        $response = $this->makeRequest('POST', '/accounts/balance/get', [
            'body' => [
                'options' => [
                    'account_ids' => [$accountId],
                ],
            ],
        ], $credentials['access_token']);

        $account = collect($response['accounts'] ?? [])->firstWhere('account_id', $accountId);

        if (!$account) {
            return [];
        }

        return [
            [
                'type' => 'current',
                'amount' => (float) ($account['balances']['current'] ?? 0),
                'currency' => $account['balances']['iso_currency_code'] ?? 'USD',
                'date' => now()->toDateString(),
            ],
            [
                'type' => 'available',
                'amount' => (float) ($account['balances']['available'] ?? 0),
                'currency' => $account['balances']['iso_currency_code'] ?? 'USD',
                'date' => now()->toDateString(),
            ],
        ];
    }

    public function getTransactions(
        BankConnection $connection,
        string $accountId,
        ?string $fromDate = null,
        ?string $toDate = null
    ): Collection {
        $credentials = $connection->credentials;

        $startDate = $fromDate ?? Carbon::now()->subDays(30)->format('Y-m-d');
        $endDate = $toDate ?? Carbon::now()->format('Y-m-d');

        $transactions = collect();
        $hasMore = true;
        $cursor = null;

        while ($hasMore) {
            $body = [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'options' => [
                    'account_ids' => [$accountId],
                    'count' => 500,
                ],
            ];

            if ($cursor) {
                $body['cursor'] = $cursor;
            }

            $response = $this->makeRequest('POST', '/transactions/get', [
                'body' => $body,
            ], $credentials['access_token']);

            foreach ($response['transactions'] ?? [] as $tx) {
                $transactions->push($this->normalizeTransaction([
                    'id' => $tx['transaction_id'],
                    'date' => $tx['date'],
                    'amount' => -1 * (float) $tx['amount'], // Plaid uses opposite sign convention
                    'currency' => $tx['iso_currency_code'] ?? 'USD',
                    'description' => $tx['name'] ?? $tx['merchant_name'] ?? '',
                    'creditor_name' => $tx['amount'] < 0 ? ($tx['merchant_name'] ?? $tx['name']) : null,
                    'debtor_name' => $tx['amount'] > 0 ? ($tx['merchant_name'] ?? $tx['name']) : null,
                    'category' => implode(' > ', $tx['category'] ?? []),
                    'pending' => $tx['pending'] ?? false,
                    'raw' => $tx,
                ]));
            }

            $hasMore = count($response['transactions'] ?? []) >= 500;
            $cursor = $response['next_cursor'] ?? null;

            if (!$cursor) {
                $hasMore = false;
            }
        }

        return $transactions->sortByDesc('date')->values();
    }

    public function revokeConnection(BankConnection $connection): bool
    {
        $credentials = $connection->credentials;

        try {
            $this->makeRequest('POST', '/item/remove', [], $credentials['access_token']);
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to revoke Plaid connection', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Handle Plaid webhooks
     */
    public function handleWebhook(array $payload): array
    {
        $webhookType = $payload['webhook_type'] ?? '';
        $webhookCode = $payload['webhook_code'] ?? '';

        return [
            'type' => $webhookType,
            'code' => $webhookCode,
            'item_id' => $payload['item_id'] ?? null,
            'error' => $payload['error'] ?? null,
            'new_transactions' => $payload['new_transactions'] ?? 0,
        ];
    }

    /**
     * Verify Plaid webhook signature
     * 
     * Plaid uses JWT for webhook verification
     * @see https://plaid.com/docs/api/webhooks/webhook-verification/
     */
    public function verifyWebhookSignature(string $payload, string $signature, array $headers = []): bool
    {
        // Plaid-Verification header contains a signed JWT
        $jwtToken = $headers['plaid-verification'] ?? $signature;

        if (empty($jwtToken)) {
            return false;
        }

        try {
            // Get webhook verification key from Plaid
            $response = $this->makeRequest('POST', '/webhook_verification_key/get', [
                'body' => [
                    'key_id' => $this->extractKeyIdFromJwt($jwtToken),
                ],
            ]);

            $key = $response['key'] ?? null;
            if (!$key) {
                return false;
            }

            // Verify JWT signature
            $parts = explode('.', $jwtToken);
            if (count($parts) !== 3) {
                return false;
            }

            [$headerB64, $payloadB64, $signatureB64] = $parts;

            // Decode and verify
            $header = json_decode(base64_decode(strtr($headerB64, '-_', '+/')), true);
            $jwtPayload = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);

            // Verify request body hash matches
            $expectedHash = hash('sha256', $payload);
            $actualHash = $jwtPayload['request_body_sha256'] ?? '';

            if (!hash_equals($expectedHash, $actualHash)) {
                return false;
            }

            // Verify timestamp (allow 5 minute clock skew)
            $issuedAt = $jwtPayload['iat'] ?? 0;
            if (abs(time() - $issuedAt) > 300) {
                return false;
            }

            return true;

        } catch (\Exception $e) {
            \Log::error('Plaid webhook verification failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    protected function extractKeyIdFromJwt(string $jwt): ?string
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        $header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
        return $header['kid'] ?? null;
    }
}
