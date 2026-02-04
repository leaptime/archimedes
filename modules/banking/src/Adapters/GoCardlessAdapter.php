<?php

namespace Modules\Banking\Adapters;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Modules\Banking\Models\BankConnection;
use Carbon\Carbon;

/**
 * GoCardless Bank Account Data (formerly Nordigen) adapter
 * 
 * Documentation: https://bankaccountdata.gocardless.com/docs/
 * 
 * Free tier: 50 connections
 * Coverage: EU (PSD2), UK
 */
class GoCardlessAdapter extends BaseOpenBankingAdapter
{
    protected ?string $baseUrl = 'https://bankaccountdata.gocardless.com/api/v2';

    public function getProviderName(): string
    {
        return 'gocardless';
    }

    public function getDisplayName(): string
    {
        return 'GoCardless Bank Account Data';
    }

    public function getSupportedCountries(): array
    {
        return [
            'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
            'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
            'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
            'GB', 'CH'
        ];
    }

    protected function loadCredentials(): void
    {
        $this->clientId = config('banking.gocardless.secret_id') 
            ?? setting('banking.gocardless_secret_id');
        $this->clientSecret = config('banking.gocardless.secret_key')
            ?? setting('banking.gocardless_secret_key');
    }

    /**
     * Get access token for API calls
     */
    protected function getAccessToken(): string
    {
        $cacheKey = 'gocardless_access_token_' . md5($this->clientId);

        return Cache::remember($cacheKey, 86000, function () {
            $response = Http::post($this->baseUrl . '/token/new/', [
                'secret_id' => $this->clientId,
                'secret_key' => $this->clientSecret,
            ]);

            if ($response->failed()) {
                throw new \RuntimeException('Failed to obtain GoCardless access token: ' . $response->body());
            }

            return $response->json('access');
        });
    }

    public function getInstitutions(?string $country = null): Collection
    {
        $cacheKey = 'gocardless_institutions_' . ($country ?? 'all');

        return Cache::remember($cacheKey, 86400, function () use ($country) {
            $token = $this->getAccessToken();

            $query = [];
            if ($country) {
                $query['country'] = strtoupper($country);
            }

            $response = $this->makeRequest('GET', '/institutions/', ['query' => $query], $token);

            return collect($response)->map(function ($institution) {
                return [
                    'id' => $institution['id'],
                    'name' => $institution['name'],
                    'bic' => $institution['bic'] ?? null,
                    'logo' => $institution['logo'] ?? null,
                    'countries' => $institution['countries'] ?? [],
                    'transaction_total_days' => $institution['transaction_total_days'] ?? 90,
                ];
            });
        });
    }

    public function getAuthorizationUrl(string $redirectUri, array $options = []): string
    {
        $token = $this->getAccessToken();

        // Step 1: Create an end-user agreement
        $agreementResponse = Http::withToken($token)->post($this->baseUrl . '/agreements/enduser/', [
            'institution_id' => $options['institution_id'],
            'max_historical_days' => $options['max_historical_days'] ?? 90,
            'access_valid_for_days' => $options['access_valid_for_days'] ?? 90,
            'access_scope' => ['balances', 'details', 'transactions'],
        ]);

        if ($agreementResponse->failed()) {
            throw new \RuntimeException('Failed to create end-user agreement: ' . $agreementResponse->body());
        }

        $agreementId = $agreementResponse->json('id');

        // Step 2: Create a requisition (link)
        $requisitionResponse = Http::withToken($token)->post($this->baseUrl . '/requisitions/', [
            'redirect' => $redirectUri,
            'institution_id' => $options['institution_id'],
            'agreement' => $agreementId,
            'reference' => $options['reference'] ?? uniqid('req_'),
            'user_language' => $options['language'] ?? 'EN',
        ]);

        if ($requisitionResponse->failed()) {
            throw new \RuntimeException('Failed to create requisition: ' . $requisitionResponse->body());
        }

        // Store requisition ID for later use
        Cache::put(
            'gocardless_requisition_' . $requisitionResponse->json('id'),
            [
                'agreement_id' => $agreementId,
                'institution_id' => $options['institution_id'],
            ],
            3600
        );

        return $requisitionResponse->json('link');
    }

    public function exchangeCode(string $requisitionId, string $redirectUri): array
    {
        $token = $this->getAccessToken();

        // Get requisition details
        $response = $this->makeRequest('GET', "/requisitions/{$requisitionId}/", [], $token);

        if (empty($response['accounts'])) {
            throw new \RuntimeException('No accounts linked to this requisition');
        }

        $cached = Cache::get('gocardless_requisition_' . $requisitionId, []);

        return [
            'requisition_id' => $requisitionId,
            'agreement_id' => $response['agreement'] ?? $cached['agreement_id'] ?? null,
            'institution_id' => $response['institution_id'] ?? $cached['institution_id'] ?? null,
            'accounts' => $response['accounts'],
            'status' => $response['status'],
            'created_at' => $response['created'] ?? now()->toIso8601String(),
            'expires_at' => Carbon::now()->addDays(90)->toIso8601String(),
        ];
    }

    public function refreshToken(BankConnection $connection): array
    {
        // GoCardless doesn't use traditional refresh tokens
        // Access is managed through requisitions with validity periods
        // If expired, user needs to re-authorize
        
        $credentials = $connection->credentials;
        $token = $this->getAccessToken();

        $response = $this->makeRequest(
            'GET',
            "/requisitions/{$credentials['requisition_id']}/",
            [],
            $token
        );

        if ($response['status'] !== 'LN') { // LN = Linked
            throw new \RuntimeException('Connection is no longer valid. Please reconnect.');
        }

        return $credentials;
    }

    public function getAccounts(BankConnection $connection): Collection
    {
        $token = $this->getAccessToken();
        $credentials = $connection->credentials;
        $accounts = collect();

        foreach ($credentials['accounts'] ?? [] as $accountId) {
            try {
                $details = $this->makeRequest('GET', "/accounts/{$accountId}/details/", [], $token);
                $accountData = $details['account'] ?? $details;

                $accounts->push($this->normalizeAccount([
                    'id' => $accountId,
                    'iban' => $accountData['iban'] ?? null,
                    'name' => $accountData['name'] ?? $accountData['product'] ?? 'Account',
                    'currency' => $accountData['currency'] ?? 'EUR',
                    'type' => $accountData['cashAccountType'] ?? 'checking',
                    'owner_name' => $accountData['ownerName'] ?? null,
                    'raw' => $accountData,
                ]));
            } catch (\Exception $e) {
                // Log but continue with other accounts
                \Log::warning("Failed to fetch GoCardless account details", [
                    'account_id' => $accountId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $accounts;
    }

    public function getBalances(BankConnection $connection, string $accountId): array
    {
        $token = $this->getAccessToken();

        $response = $this->makeRequest('GET', "/accounts/{$accountId}/balances/", [], $token);

        $balances = [];
        foreach ($response['balances'] ?? [] as $balance) {
            $balances[] = [
                'type' => $balance['balanceType'] ?? 'available',
                'amount' => (float) ($balance['balanceAmount']['amount'] ?? 0),
                'currency' => $balance['balanceAmount']['currency'] ?? 'EUR',
                'date' => $balance['referenceDate'] ?? now()->toDateString(),
            ];
        }

        return $balances;
    }

    public function getTransactions(
        BankConnection $connection,
        string $accountId,
        ?string $fromDate = null,
        ?string $toDate = null
    ): Collection {
        $token = $this->getAccessToken();

        $query = [];
        if ($fromDate) {
            $query['date_from'] = $fromDate;
        }
        if ($toDate) {
            $query['date_to'] = $toDate;
        }

        $response = $this->makeRequest(
            'GET',
            "/accounts/{$accountId}/transactions/",
            ['query' => $query],
            $token
        );

        $transactions = collect();

        // GoCardless returns booked and pending transactions
        foreach (['booked', 'pending'] as $type) {
            foreach ($response['transactions'][$type] ?? [] as $tx) {
                $transactions->push($this->normalizeTransaction([
                    'id' => $tx['transactionId'] ?? $tx['internalTransactionId'] ?? uniqid(),
                    'date' => $tx['bookingDate'] ?? $tx['valueDate'] ?? null,
                    'amount' => (float) ($tx['transactionAmount']['amount'] ?? 0),
                    'currency' => $tx['transactionAmount']['currency'] ?? 'EUR',
                    'description' => $tx['remittanceInformationUnstructured'] 
                        ?? $tx['remittanceInformationUnstructuredArray'][0] 
                        ?? $tx['additionalInformation']
                        ?? '',
                    'creditor_name' => $tx['creditorName'] ?? null,
                    'creditor_account' => $tx['creditorAccount']['iban'] ?? null,
                    'debtor_name' => $tx['debtorName'] ?? null,
                    'debtor_account' => $tx['debtorAccount']['iban'] ?? null,
                    'reference' => $tx['endToEndId'] ?? null,
                    'status' => $type,
                    'raw' => $tx,
                ]));
            }
        }

        return $transactions->sortByDesc('date')->values();
    }

    public function revokeConnection(BankConnection $connection): bool
    {
        $token = $this->getAccessToken();
        $credentials = $connection->credentials;

        try {
            $this->makeRequest(
                'DELETE',
                "/requisitions/{$credentials['requisition_id']}/",
                [],
                $token
            );
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to revoke GoCardless connection', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
