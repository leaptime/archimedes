<?php

namespace Modules\Invoicing\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Services\InvoicePdfService;

class InvoiceMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Invoice $invoice;
    public string $customMessage;
    public bool $attachPdf;

    public function __construct(
        Invoice $invoice,
        string $customMessage = '',
        bool $attachPdf = true
    ) {
        $this->invoice = $invoice;
        $this->customMessage = $customMessage;
        $this->attachPdf = $attachPdf;
    }

    public function envelope(): Envelope
    {
        $subject = $this->getSubject();

        return new Envelope(
            subject: $subject,
            replyTo: [config('invoicing.company.email', config('mail.from.address'))],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'invoice' => $this->invoice,
                'contact' => $this->invoice->contact,
                'company' => $this->getCompanyInfo(),
                'customMessage' => $this->customMessage,
                'documentTitle' => $this->getDocumentTitle(),
                'viewUrl' => $this->getViewUrl(),
                'payUrl' => $this->getPayUrl(),
            ],
        );
    }

    public function attachments(): array
    {
        if (!$this->attachPdf) {
            return [];
        }

        $pdfService = new InvoicePdfService();
        $pdfContent = $pdfService->generate($this->invoice);
        $filename = $this->getFilename();

        return [
            Attachment::fromData(fn () => $pdfContent, $filename)
                ->withMime('application/pdf'),
        ];
    }

    protected function getSubject(): string
    {
        $number = $this->invoice->number ?? 'Draft';
        $company = config('app.name', 'Our Company');

        return match($this->invoice->move_type) {
            'out_invoice' => "Invoice {$number} from {$company}",
            'out_refund' => "Credit Note {$number} from {$company}",
            'in_invoice' => "Your Bill {$number} has been received",
            'in_refund' => "Refund {$number} from {$company}",
            default => "Invoice {$number} from {$company}",
        };
    }

    protected function getDocumentTitle(): string
    {
        return match($this->invoice->move_type) {
            'out_invoice' => 'Invoice',
            'out_refund' => 'Credit Note',
            'in_invoice' => 'Bill',
            'in_refund' => 'Refund',
            default => 'Invoice',
        };
    }

    protected function getCompanyInfo(): object
    {
        return (object)[
            'name' => config('app.name', 'My Company'),
            'address' => config('invoicing.company.address', ''),
            'city' => config('invoicing.company.city', ''),
            'phone' => config('invoicing.company.phone', ''),
            'email' => config('invoicing.company.email', config('mail.from.address')),
            'website' => config('invoicing.company.website', ''),
        ];
    }

    protected function getViewUrl(): string
    {
        return url("/invoices/{$this->invoice->id}");
    }

    protected function getPayUrl(): ?string
    {
        if ($this->invoice->payment_state === 'paid') {
            return null;
        }

        return url("/invoices/{$this->invoice->id}/pay");
    }

    protected function getFilename(): string
    {
        $number = $this->invoice->number ?: "DRAFT-{$this->invoice->id}";
        $number = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $number);
        
        return "{$number}.pdf";
    }
}
