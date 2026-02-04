<?php

namespace Modules\L10nItEdi\Services;

use Modules\Invoicing\Models\Invoice;
use Modules\L10nItEdi\Adapters\ArubaAdapter;
use Modules\L10nItEdi\Models\L10nItEdiAttachment;
use Exception;

class L10nItEdiService
{
    protected FatturaPaXmlGenerator $xmlGenerator;
    protected ArubaAdapter $adapter;

    public function __construct(FatturaPaXmlGenerator $xmlGenerator, ArubaAdapter $adapter)
    {
        $this->xmlGenerator = $xmlGenerator;
        $this->adapter = $adapter;
    }

    public function sendInvoice(Invoice $invoice): array
    {
        // Validate invoice is ready to send
        $validation = $this->validateInvoice($invoice);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'errors' => $validation['errors'],
            ];
        }

        // Generate FatturaPA XML
        $xml = $this->xmlGenerator->generate($invoice);

        // Validate XML
        $xmlValidation = $this->validateXml($xml);
        if (!$xmlValidation['valid']) {
            return [
                'success' => false,
                'errors' => $xmlValidation['errors'],
            ];
        }

        // Send via adapter
        return $this->adapter->sendInvoice($invoice, $xml);
    }

    public function checkStatus(Invoice $invoice): array
    {
        return $this->adapter->checkStatus($invoice);
    }

    public function getNotifications(Invoice $invoice): array
    {
        return $this->adapter->getNotifications($invoice);
    }

    public function generateXml(Invoice $invoice): string
    {
        return $this->xmlGenerator->generate($invoice);
    }

    public function previewXml(Invoice $invoice): array
    {
        try {
            $xml = $this->xmlGenerator->generate($invoice);
            return [
                'success' => true,
                'xml' => $xml,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function validateInvoice(Invoice $invoice): array
    {
        $errors = [];

        // Check invoice state
        if ($invoice->state !== 'posted') {
            $errors[] = 'Invoice must be posted before sending to SDI';
        }

        // Check if already sent
        if ($invoice->l10n_it_edi_state && !in_array($invoice->l10n_it_edi_state, ['rejected'])) {
            $errors[] = 'Invoice has already been sent to SDI';
        }

        // Check contact fiscal data
        $contact = $invoice->contact;
        if (!$contact) {
            $errors[] = 'Invoice must have a contact';
        } else {
            if (!$contact->vat && !$contact->l10n_it_codice_fiscale) {
                $errors[] = 'Contact must have VAT number or Codice Fiscale';
            }

            // For B2B, need PA index or PEC
            if (!$contact->l10n_it_pa_index && !$contact->l10n_it_pec_email) {
                $errors[] = 'Contact must have Codice Destinatario (PA Index) or PEC email';
            }
        }

        // Check company fiscal data
        $companyConfig = config('l10n_it_edi.company');
        if (!($companyConfig['partita_iva'] ?? null)) {
            $errors[] = 'Company VAT number (Partita IVA) is not configured';
        }

        // Check invoice lines
        $hasProductLines = $invoice->lines->where('display_type', 'product')->count() > 0;
        if (!$hasProductLines) {
            $errors[] = 'Invoice must have at least one product line';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    public function validateXml(string $xml): array
    {
        $errors = [];

        // Basic XML validation
        libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        
        if (!$dom->loadXML($xml)) {
            foreach (libxml_get_errors() as $error) {
                $errors[] = "XML Error: {$error->message} at line {$error->line}";
            }
            libxml_clear_errors();
            return [
                'valid' => false,
                'errors' => $errors,
            ];
        }

        // Schema validation (optional - requires schema file)
        // $schemaPath = __DIR__ . '/../../data/Schema_del_file_xml_FatturaPA_versione_1.2.xsd';
        // if (file_exists($schemaPath) && !$dom->schemaValidate($schemaPath)) {
        //     foreach (libxml_get_errors() as $error) {
        //         $errors[] = "Schema Error: {$error->message}";
        //     }
        //     libxml_clear_errors();
        // }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    public function getStateLabel(string $state): string
    {
        return match ($state) {
            'being_sent' => 'Invio in corso',
            'requires_user_signature' => 'Richiede firma',
            'processing' => 'In elaborazione SDI',
            'rejected' => 'Scartato da SDI',
            'forwarded' => 'Consegnato al destinatario',
            'forward_failed' => 'Mancata consegna',
            'forward_attempt' => 'Tentativo di consegna',
            'accepted_by_pa_partner' => 'Accettato dalla PA',
            'rejected_by_pa_partner' => 'Rifiutato dalla PA',
            'accepted_by_pa_partner_after_expiry' => 'Decorrenza termini',
            default => $state,
        };
    }

    public function getStateColor(string $state): string
    {
        return match ($state) {
            'being_sent', 'processing', 'forward_attempt' => 'blue',
            'requires_user_signature' => 'yellow',
            'rejected', 'forward_failed', 'rejected_by_pa_partner' => 'red',
            'forwarded', 'accepted_by_pa_partner', 'accepted_by_pa_partner_after_expiry' => 'green',
            default => 'gray',
        };
    }

    public function canResend(Invoice $invoice): bool
    {
        return in_array($invoice->l10n_it_edi_state, ['rejected', null]);
    }

    public function getAttachments(Invoice $invoice): \Illuminate\Database\Eloquent\Collection
    {
        return L10nItEdiAttachment::where('invoice_id', $invoice->id)
            ->orderByDesc('created_at')
            ->get();
    }
}
