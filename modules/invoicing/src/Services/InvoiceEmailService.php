<?php

namespace Modules\Invoicing\Services;

use Illuminate\Support\Facades\Mail;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Mail\InvoiceMail;

class InvoiceEmailService
{
    public function send(
        Invoice $invoice,
        ?string $recipientEmail = null,
        ?string $recipientName = null,
        string $customMessage = '',
        bool $attachPdf = true,
        array $cc = [],
        array $bcc = []
    ): bool {
        $invoice->load('contact');

        $email = $recipientEmail ?? $invoice->contact?->email;
        $name = $recipientName ?? $invoice->contact?->name;

        if (!$email) {
            throw new \InvalidArgumentException('No recipient email address provided');
        }

        $mail = new InvoiceMail($invoice, $customMessage, $attachPdf);

        $mailer = Mail::to($email, $name);

        if (!empty($cc)) {
            $mailer->cc($cc);
        }

        if (!empty($bcc)) {
            $mailer->bcc($bcc);
        }

        $mailer->send($mail);

        // Update invoice sent status
        $invoice->update([
            'is_sent' => true,
            'sent_at' => now(),
        ]);

        // Log the send action
        $this->logSendAction($invoice, $email, $cc, $bcc);

        return true;
    }

    public function sendReminder(
        Invoice $invoice,
        string $customMessage = ''
    ): bool {
        if ($invoice->payment_state === 'paid') {
            throw new \InvalidArgumentException('Cannot send reminder for paid invoice');
        }

        $defaultMessage = $this->getDefaultReminderMessage($invoice);
        $message = $customMessage ?: $defaultMessage;

        return $this->send($invoice, customMessage: $message);
    }

    public function preview(Invoice $invoice): array
    {
        $invoice->load('contact');

        return [
            'to' => [
                'email' => $invoice->contact?->email,
                'name' => $invoice->contact?->name,
            ],
            'subject' => $this->getSubject($invoice),
            'body_preview' => $this->getBodyPreview($invoice),
        ];
    }

    protected function getSubject(Invoice $invoice): string
    {
        $number = $invoice->number ?? 'Draft';
        $company = config('app.name', 'Our Company');

        return match($invoice->move_type) {
            'out_invoice' => "Invoice {$number} from {$company}",
            'out_refund' => "Credit Note {$number} from {$company}",
            'in_invoice' => "Your Bill {$number} has been received",
            'in_refund' => "Refund {$number} from {$company}",
            default => "Invoice {$number} from {$company}",
        };
    }

    protected function getBodyPreview(Invoice $invoice): string
    {
        $contact = $invoice->contact;
        $greeting = $contact ? "Hello " . explode(' ', $contact->name)[0] : "Hello";

        if ($invoice->move_type === 'out_refund') {
            return "{$greeting}, please find attached your credit note.";
        }

        if ($invoice->payment_state === 'paid') {
            return "{$greeting}, thank you for your payment! Here is your receipt.";
        }

        $due = $invoice->invoice_date_due 
            ? "Payment is due by " . \Carbon\Carbon::parse($invoice->invoice_date_due)->format('F j, Y') . "."
            : "";

        return "{$greeting}, please find attached your invoice. {$due}";
    }

    protected function getDefaultReminderMessage(Invoice $invoice): string
    {
        $daysOverdue = $invoice->invoice_date_due 
            ? now()->diffInDays(\Carbon\Carbon::parse($invoice->invoice_date_due), false) 
            : 0;

        if ($daysOverdue < 0) {
            $daysOverdue = abs($daysOverdue);
            return "This is a friendly reminder that invoice #{$invoice->number} is now {$daysOverdue} days overdue. " .
                   "The amount due is $" . number_format($invoice->amount_residual, 2) . ". " .
                   "Please arrange payment at your earliest convenience.";
        }

        return "This is a friendly reminder that invoice #{$invoice->number} will be due soon. " .
               "The amount due is $" . number_format($invoice->amount_residual, 2) . ".";
    }

    protected function logSendAction(Invoice $invoice, string $email, array $cc, array $bcc): void
    {
        activity()
            ->performedOn($invoice)
            ->withProperties([
                'action' => 'email_sent',
                'recipient' => $email,
                'cc' => $cc,
                'bcc' => $bcc,
            ])
            ->log('Invoice email sent');
    }
}
