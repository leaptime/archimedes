<?php

namespace Modules\L10nItEdi\Adapters;

use Modules\Invoicing\Models\Invoice;
use Modules\L10nItEdi\Models\L10nItEdiAttachment;
use Modules\L10nItEdi\Models\L10nItEdiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class ArubaAdapter
{
    protected array $config;
    protected string $environment;

    public function __construct()
    {
        $this->config = config('l10n_it_edi.aruba');
        $this->environment = $this->config['environment'] ?? 'test';
    }

    public function sendInvoice(Invoice $invoice, string $xml): array
    {
        $filename = $this->generateFilename($invoice);
        $endpoint = $this->getEndpoint('upload');

        $this->logRequest($invoice, 'send', $xml);

        try {
            $response = Http::withBasicAuth(
                $this->config['username'],
                $this->config['password']
            )
            ->withHeaders([
                'Content-Type' => 'application/xml',
            ])
            ->withBody($xml, 'application/xml')
            ->post($endpoint, [
                'filename' => $filename,
            ]);

            $responseData = $response->json() ?? ['raw' => $response->body()];

            $this->logResponse($invoice, 'send', $responseData, $response->successful());

            if ($response->successful()) {
                // Store the sent XML
                $this->storeAttachment($invoice, 'sent', $filename, $xml, [
                    'sdi_identifier' => $responseData['idSdi'] ?? null,
                ]);

                // Update invoice state
                $invoice->update([
                    'l10n_it_edi_state' => 'being_sent',
                    'l10n_it_edi_transaction' => $responseData['idSdi'] ?? $filename,
                    'l10n_it_edi_sent_at' => now(),
                ]);

                return [
                    'success' => true,
                    'filename' => $filename,
                    'sdi_id' => $responseData['idSdi'] ?? null,
                    'message' => 'Invoice sent to SDI successfully',
                ];
            }

            throw new Exception($responseData['errorMessage'] ?? 'Unknown error from Aruba');

        } catch (Exception $e) {
            $this->logResponse($invoice, 'send', ['error' => $e->getMessage()], false);

            $invoice->update([
                'l10n_it_edi_state' => 'rejected',
                'l10n_it_edi_error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function checkStatus(Invoice $invoice): array
    {
        $endpoint = $this->getEndpoint('status');
        $filename = $invoice->l10n_it_edi_transaction;

        if (!$filename) {
            return [
                'success' => false,
                'error' => 'No transaction ID found',
            ];
        }

        try {
            $response = Http::withBasicAuth(
                $this->config['username'],
                $this->config['password']
            )->get($endpoint, [
                'filename' => $filename,
            ]);

            $data = $response->json();

            $this->logRequest($invoice, 'check_status', ['filename' => $filename]);
            $this->logResponse($invoice, 'check_status', $data, $response->successful());

            if ($response->successful()) {
                $sdiState = $this->mapSdiState($data['state'] ?? null);
                
                $invoice->update([
                    'l10n_it_edi_state' => $sdiState,
                ]);

                // If there are notifications, store them
                if (isset($data['notifications'])) {
                    foreach ($data['notifications'] as $notification) {
                        $this->processNotification($invoice, $notification);
                    }
                }

                return [
                    'success' => true,
                    'state' => $sdiState,
                    'data' => $data,
                ];
            }

            return [
                'success' => false,
                'error' => $data['errorMessage'] ?? 'Status check failed',
            ];

        } catch (Exception $e) {
            Log::error('Aruba status check failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getNotifications(Invoice $invoice): array
    {
        $endpoint = $this->getEndpoint('notifications');
        $filename = $invoice->l10n_it_edi_transaction;

        try {
            $response = Http::withBasicAuth(
                $this->config['username'],
                $this->config['password']
            )->get($endpoint, [
                'filename' => $filename,
            ]);

            $data = $response->json();

            if ($response->successful() && isset($data['notifications'])) {
                foreach ($data['notifications'] as $notification) {
                    $this->processNotification($invoice, $notification);
                }

                return [
                    'success' => true,
                    'notifications' => $data['notifications'],
                ];
            }

            return [
                'success' => false,
                'error' => $data['errorMessage'] ?? 'No notifications found',
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function downloadInvoice(string $filename): ?string
    {
        $endpoint = $this->getEndpoint('download');

        try {
            $response = Http::withBasicAuth(
                $this->config['username'],
                $this->config['password']
            )->get($endpoint, [
                'filename' => $filename,
            ]);

            if ($response->successful()) {
                return $response->body();
            }

            return null;

        } catch (Exception $e) {
            Log::error('Aruba download failed', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function processNotification(Invoice $invoice, array $notification): void
    {
        $type = $notification['type'] ?? 'notification';
        $filename = $notification['filename'] ?? null;
        $content = $notification['content'] ?? null;

        // Determine notification type
        $attachmentType = match ($type) {
            'RC', 'ricevuta_consegna' => 'receipt',
            'NS', 'notifica_scarto' => 'rejection',
            'MC', 'mancata_consegna' => 'notification',
            'NE', 'notifica_esito' => 'notification',
            'DT', 'decorrenza_termini' => 'notification',
            default => 'notification',
        };

        // Update invoice state based on notification
        $newState = match ($type) {
            'RC', 'ricevuta_consegna' => 'forwarded',
            'NS', 'notifica_scarto' => 'rejected',
            'MC', 'mancata_consegna' => 'forward_failed',
            'NE', 'notifica_esito' => $this->parseEsitoState($content),
            'DT', 'decorrenza_termini' => 'accepted_by_pa_partner_after_expiry',
            default => $invoice->l10n_it_edi_state,
        };

        // Store the notification
        $this->storeAttachment($invoice, $attachmentType, $filename ?? "notification_{$type}.xml", $content, [
            'notification_type' => $type,
            'sdi_message_id' => $notification['messageId'] ?? null,
        ]);

        // Update invoice
        $updateData = ['l10n_it_edi_state' => $newState];
        
        if ($newState === 'rejected') {
            $updateData['l10n_it_edi_error'] = $notification['errorDescription'] ?? 'Invoice rejected by SDI';
        }

        if (in_array($newState, ['forwarded', 'accepted_by_pa_partner'])) {
            $updateData['l10n_it_edi_received_at'] = now();
        }

        $invoice->update($updateData);
    }

    protected function parseEsitoState(?string $content): string
    {
        if (!$content) {
            return 'forwarded';
        }

        // Parse XML to get esito
        try {
            $xml = simplexml_load_string($content);
            $esito = (string)($xml->EsitoCommittente->Esito ?? '');
            
            return match ($esito) {
                'EC01' => 'accepted_by_pa_partner',
                'EC02' => 'rejected_by_pa_partner',
                default => 'forwarded',
            };
        } catch (Exception $e) {
            return 'forwarded';
        }
    }

    protected function mapSdiState(?string $arubaState): string
    {
        return match ($arubaState) {
            'INVIATO', 'SENT' => 'being_sent',
            'CONSEGNATO', 'DELIVERED' => 'forwarded',
            'NON_CONSEGNATO', 'NOT_DELIVERED' => 'forward_failed',
            'SCARTATO', 'REJECTED' => 'rejected',
            'ACCETTATO', 'ACCEPTED' => 'accepted_by_pa_partner',
            'RIFIUTATO', 'REFUSED' => 'rejected_by_pa_partner',
            'DECORRENZA_TERMINI' => 'accepted_by_pa_partner_after_expiry',
            default => 'processing',
        };
    }

    protected function generateFilename(Invoice $invoice): string
    {
        $countryCode = 'IT';
        $vatNumber = preg_replace('/[^A-Za-z0-9]/', '', config('l10n_it_edi.company.partita_iva') ?? '');
        $progressive = str_pad($invoice->id, 5, '0', STR_PAD_LEFT);
        
        return "{$countryCode}{$vatNumber}_{$progressive}.xml";
    }

    protected function getEndpoint(string $type): string
    {
        return $this->config['endpoints'][$this->environment][$type] ?? '';
    }

    protected function storeAttachment(Invoice $invoice, string $type, string $filename, ?string $content, array $metadata = []): L10nItEdiAttachment
    {
        return L10nItEdiAttachment::create([
            'invoice_id' => $invoice->id,
            'type' => $type,
            'filename' => $filename,
            'content' => $content,
            'sdi_identifier' => $metadata['sdi_identifier'] ?? null,
            'sdi_message_id' => $metadata['sdi_message_id'] ?? null,
            'metadata' => $metadata,
        ]);
    }

    protected function logRequest(Invoice $invoice, string $action, $data): void
    {
        L10nItEdiLog::create([
            'invoice_id' => $invoice->id,
            'action' => $action,
            'status' => 'pending',
            'request' => is_string($data) ? $data : json_encode($data),
        ]);
    }

    protected function logResponse(Invoice $invoice, string $action, $data, bool $success): void
    {
        L10nItEdiLog::where('invoice_id', $invoice->id)
            ->where('action', $action)
            ->orderByDesc('id')
            ->first()
            ?->update([
                'status' => $success ? 'success' : 'error',
                'response' => is_string($data) ? $data : json_encode($data),
                'error_message' => $success ? null : ($data['error'] ?? $data['errorMessage'] ?? 'Unknown error'),
            ]);
    }
}
