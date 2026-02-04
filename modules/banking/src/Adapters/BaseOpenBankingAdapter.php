<?php

namespace Modules\Banking\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Modules\Banking\Models\BankConnection;

abstract class BaseOpenBankingAdapter implements OpenBankingAdapterInterface
{
    protected ?string $clientId = null;
    protected ?string $clientSecret = null;
    protected ?string $baseUrl = null;

    public function __construct()
    {
        $this->loadCredentials();
    }

    abstract protected function loadCredentials(): void;

    public function isConfigured(): bool
    {
        return !empty($this->clientId) && !empty($this->clientSecret);
    }

    protected function makeRequest(
        string $method,
        string $endpoint,
        array $options = [],
        ?string $accessToken = null
    ): array {
        $url = $this->baseUrl . $endpoint;

        $request = Http::timeout(30);

        if ($accessToken) {
            $request = $request->withToken($accessToken);
        }

        if (!empty($options['headers'])) {
            $request = $request->withHeaders($options['headers']);
        }

        try {
            $response = match (strtoupper($method)) {
                'GET' => $request->get($url, $options['query'] ?? []),
                'POST' => $request->post($url, $options['body'] ?? []),
                'PUT' => $request->put($url, $options['body'] ?? []),
                'DELETE' => $request->delete($url),
                default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
            };

            if ($response->failed()) {
                Log::error("Open Banking API error", [
                    'provider' => $this->getProviderName(),
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new \RuntimeException(
                    "API request failed: " . ($response->json('error_description') ?? $response->body())
                );
            }

            return $response->json() ?? [];

        } catch (\Exception $e) {
            Log::error("Open Banking request exception", [
                'provider' => $this->getProviderName(),
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function normalizeTransaction(array $rawTransaction): array
    {
        return [
            'id' => $rawTransaction['id'] ?? null,
            'date' => $rawTransaction['date'] ?? $rawTransaction['booking_date'] ?? null,
            'amount' => $rawTransaction['amount'] ?? 0,
            'currency' => $rawTransaction['currency'] ?? 'EUR',
            'description' => $rawTransaction['description'] ?? $rawTransaction['remittance_information'] ?? '',
            'partner_name' => $rawTransaction['creditor_name'] ?? $rawTransaction['debtor_name'] ?? null,
            'partner_account' => $rawTransaction['creditor_account'] ?? $rawTransaction['debtor_account'] ?? null,
            'reference' => $rawTransaction['reference'] ?? $rawTransaction['end_to_end_id'] ?? null,
            'category' => $rawTransaction['category'] ?? null,
            'raw' => $rawTransaction,
        ];
    }

    protected function normalizeAccount(array $rawAccount): array
    {
        return [
            'id' => $rawAccount['id'] ?? null,
            'name' => $rawAccount['name'] ?? $rawAccount['product'] ?? 'Account',
            'iban' => $rawAccount['iban'] ?? null,
            'account_number' => $rawAccount['account_number'] ?? $rawAccount['iban'] ?? null,
            'currency' => $rawAccount['currency'] ?? 'EUR',
            'type' => $rawAccount['type'] ?? $rawAccount['cash_account_type'] ?? 'checking',
            'balance' => $rawAccount['balance'] ?? $rawAccount['balances'][0]['amount'] ?? null,
            'raw' => $rawAccount,
        ];
    }

    public function validateConnection(BankConnection $connection): bool
    {
        try {
            $accounts = $this->getAccounts($connection);
            return $accounts->isNotEmpty();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature, array $headers = []): bool
    {
        // Default implementation - should be overridden by providers that support webhooks
        return true;
    }
}
