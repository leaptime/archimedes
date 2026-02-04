<?php

namespace Modules\L10nItEdi\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\Invoice;
use Modules\L10nItEdi\Services\L10nItEdiService;
use Modules\L10nItEdi\Models\L10nItEdiAttachment;
use Modules\L10nItEdi\Models\L10nItEdiLog;

class L10nItEdiController extends Controller
{
    protected L10nItEdiService $ediService;

    public function __construct(L10nItEdiService $ediService)
    {
        $this->ediService = $ediService;
    }

    public function send(Invoice $invoice): JsonResponse
    {
        $result = $this->ediService->sendInvoice($invoice);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Invoice sent to SDI',
                'data' => [
                    'state' => $invoice->fresh()->l10n_it_edi_state,
                    'transaction' => $result['sdi_id'] ?? $result['filename'] ?? null,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to send invoice to SDI',
            'errors' => $result['errors'] ?? [$result['error'] ?? 'Unknown error'],
        ], 422);
    }

    public function status(Invoice $invoice): JsonResponse
    {
        $result = $this->ediService->checkStatus($invoice);

        return response()->json([
            'success' => $result['success'],
            'data' => [
                'state' => $invoice->fresh()->l10n_it_edi_state,
                'state_label' => $this->ediService->getStateLabel($invoice->l10n_it_edi_state ?? ''),
                'state_color' => $this->ediService->getStateColor($invoice->l10n_it_edi_state ?? ''),
                'error' => $invoice->l10n_it_edi_error,
                'sent_at' => $invoice->l10n_it_edi_sent_at,
                'received_at' => $invoice->l10n_it_edi_received_at,
            ],
        ]);
    }

    public function preview(Invoice $invoice): JsonResponse
    {
        $result = $this->ediService->previewXml($invoice);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'xml' => $result['xml'],
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'],
        ], 422);
    }

    public function validate(Invoice $invoice): JsonResponse
    {
        $result = $this->ediService->validateInvoice($invoice);

        return response()->json([
            'valid' => $result['valid'],
            'errors' => $result['errors'],
            'can_send' => $result['valid'] && $this->ediService->canResend($invoice),
        ]);
    }

    public function attachments(Invoice $invoice): JsonResponse
    {
        $attachments = $this->ediService->getAttachments($invoice);

        return response()->json([
            'data' => $attachments->map(fn($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'filename' => $a->filename,
                'sdi_identifier' => $a->sdi_identifier,
                'created_at' => $a->created_at,
            ]),
        ]);
    }

    public function downloadAttachment(L10nItEdiAttachment $attachment): \Symfony\Component\HttpFoundation\Response
    {
        return response($attachment->content, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => "attachment; filename=\"{$attachment->filename}\"",
        ]);
    }

    public function logs(Invoice $invoice): JsonResponse
    {
        $logs = L10nItEdiLog::where('invoice_id', $invoice->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $logs->map(fn($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'status' => $log->status,
                'error_message' => $log->error_message,
                'created_at' => $log->created_at,
            ]),
        ]);
    }

    public function refresh(Invoice $invoice): JsonResponse
    {
        // Get latest notifications and update state
        $result = $this->ediService->getNotifications($invoice);

        return response()->json([
            'success' => true,
            'data' => [
                'state' => $invoice->fresh()->l10n_it_edi_state,
                'state_label' => $this->ediService->getStateLabel($invoice->l10n_it_edi_state ?? ''),
                'notifications_count' => count($result['notifications'] ?? []),
            ],
        ]);
    }

    public function naturaOptions(): JsonResponse
    {
        return response()->json([
            'data' => collect(config('l10n_it_edi.natura_codes'))
                ->map(fn($label, $code) => [
                    'code' => $code,
                    'label' => $label,
                ])
                ->values(),
        ]);
    }

    public function regimeFiscaleOptions(): JsonResponse
    {
        return response()->json([
            'data' => collect(config('l10n_it_edi.regime_fiscale_codes'))
                ->map(fn($label, $code) => [
                    'code' => $code,
                    'label' => $label,
                ])
                ->values(),
        ]);
    }

    public function documentTypeOptions(): JsonResponse
    {
        return response()->json([
            'data' => [
                ['code' => 'TD01', 'label' => 'Fattura'],
                ['code' => 'TD02', 'label' => 'Acconto/Anticipo su fattura'],
                ['code' => 'TD03', 'label' => 'Acconto/Anticipo su parcella'],
                ['code' => 'TD04', 'label' => 'Nota di Credito'],
                ['code' => 'TD05', 'label' => 'Nota di Debito'],
                ['code' => 'TD06', 'label' => 'Parcella'],
                ['code' => 'TD16', 'label' => 'Integrazione fattura reverse charge interno'],
                ['code' => 'TD17', 'label' => 'Integrazione/autofattura per acquisto servizi dall\'estero'],
                ['code' => 'TD18', 'label' => 'Integrazione per acquisto di beni intracomunitari'],
                ['code' => 'TD19', 'label' => 'Integrazione/autofattura per acquisto di beni ex art.17 c.2 DPR 633/72'],
                ['code' => 'TD20', 'label' => 'Autofattura per regolarizzazione e integrazione delle fatture'],
                ['code' => 'TD21', 'label' => 'Autofattura per splafonamento'],
                ['code' => 'TD22', 'label' => 'Estrazione beni da Deposito IVA'],
                ['code' => 'TD23', 'label' => 'Estrazione beni da Deposito IVA con versamento dell\'IVA'],
                ['code' => 'TD24', 'label' => 'Fattura differita di cui all\'art. 21, comma 4, lett. a)'],
                ['code' => 'TD25', 'label' => 'Fattura differita di cui all\'art. 21, comma 4, terzo periodo lett. b)'],
                ['code' => 'TD26', 'label' => 'Cessione di beni ammortizzabili e per passaggi interni'],
                ['code' => 'TD27', 'label' => 'Fattura per autoconsumo o per cessioni gratuite senza rivalsa'],
            ],
        ]);
    }
}
