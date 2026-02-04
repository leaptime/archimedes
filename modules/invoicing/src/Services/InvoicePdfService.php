<?php

namespace Modules\Invoicing\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Modules\Invoicing\Models\Invoice;
use Illuminate\Support\Facades\Storage;

class InvoicePdfService
{
    protected array $config;

    public function __construct()
    {
        $this->config = config('invoicing.pdf', []);
    }

    public function generate(Invoice $invoice): string
    {
        $invoice->load([
            'contact',
            'lines.tax',
            'lines.product',
            'currency',
            'payments',
        ]);

        $data = $this->prepareData($invoice);

        $pdf = Pdf::loadView('invoices.pdf', $data);
        
        $pdf->setPaper(
            $this->config['paper_size'] ?? 'a4',
            $this->config['orientation'] ?? 'portrait'
        );

        return $pdf->output();
    }

    public function download(Invoice $invoice)
    {
        $invoice->load(['contact', 'lines.tax', 'lines.product', 'currency']);
        $data = $this->prepareData($invoice);

        $pdf = Pdf::loadView('invoices.pdf', $data);
        
        $pdf->setPaper(
            $this->config['paper_size'] ?? 'a4',
            $this->config['orientation'] ?? 'portrait'
        );

        $filename = $this->getFilename($invoice);

        return $pdf->download($filename);
    }

    public function store(Invoice $invoice): string
    {
        $content = $this->generate($invoice);
        $filename = $this->getFilename($invoice);
        $path = "invoices/{$invoice->id}/{$filename}";

        Storage::disk('local')->put($path, $content);

        return $path;
    }

    public function stream(Invoice $invoice)
    {
        $invoice->load(['contact', 'lines.tax', 'lines.product', 'currency']);
        $data = $this->prepareData($invoice);

        $pdf = Pdf::loadView('invoices.pdf', $data);
        
        $pdf->setPaper(
            $this->config['paper_size'] ?? 'a4',
            $this->config['orientation'] ?? 'portrait'
        );

        $filename = $this->getFilename($invoice);

        return $pdf->stream($filename);
    }

    protected function prepareData(Invoice $invoice): array
    {
        $company = $this->getCompanyInfo();
        
        return [
            'invoice' => $invoice,
            'company' => $company,
            'contact' => $invoice->contact,
            'lines' => $invoice->lines->where('display_type', 'product'),
            'sections' => $this->groupLinesBySection($invoice->lines),
            'subtotal' => $invoice->amount_untaxed,
            'tax_total' => $invoice->amount_tax,
            'total' => $invoice->amount_total,
            'amount_due' => $invoice->amount_residual,
            'amount_paid' => $invoice->amount_total - $invoice->amount_residual,
            'currency' => $invoice->currency ?? (object)['symbol' => '$', 'code' => 'USD'],
            'tax_lines' => $this->getTaxSummary($invoice),
            'payments' => $invoice->payments ?? collect(),
            'is_refund' => in_array($invoice->move_type, ['out_refund', 'in_refund']),
            'document_title' => $this->getDocumentTitle($invoice),
            'show_payment_info' => $invoice->state === 'posted' && $invoice->payment_state !== 'paid',
        ];
    }

    protected function getCompanyInfo(): object
    {
        return (object)[
            'name' => config('app.name', 'My Company'),
            'address' => config('invoicing.company.address', '123 Business Street'),
            'city' => config('invoicing.company.city', 'City'),
            'state' => config('invoicing.company.state', 'State'),
            'zip' => config('invoicing.company.zip', '12345'),
            'country' => config('invoicing.company.country', 'Country'),
            'phone' => config('invoicing.company.phone', '+1 234 567 8900'),
            'email' => config('invoicing.company.email', 'info@company.com'),
            'website' => config('invoicing.company.website', 'www.company.com'),
            'vat' => config('invoicing.company.vat', ''),
            'logo' => config('invoicing.company.logo', null),
            'bank_name' => config('invoicing.company.bank_name', ''),
            'bank_iban' => config('invoicing.company.bank_iban', ''),
            'bank_bic' => config('invoicing.company.bank_bic', ''),
        ];
    }

    protected function groupLinesBySection($lines): array
    {
        $sections = [];
        $currentSection = null;

        foreach ($lines as $line) {
            if ($line->display_type === 'line_section') {
                $currentSection = $line->name;
                $sections[$currentSection] = [];
            } elseif ($line->display_type === 'product') {
                $key = $currentSection ?? '__default__';
                if (!isset($sections[$key])) {
                    $sections[$key] = [];
                }
                $sections[$key][] = $line;
            }
        }

        return $sections;
    }

    protected function getTaxSummary(Invoice $invoice): array
    {
        $taxSummary = [];

        foreach ($invoice->lines as $line) {
            if ($line->display_type !== 'product') continue;
            
            $lineSubtotal = $line->quantity * $line->price_unit * (1 - ($line->discount / 100));
            
            if ($line->tax) {
                $taxName = $line->tax->name;
                $taxAmount = $lineSubtotal * ($line->tax->amount / 100);
                
                if (!isset($taxSummary[$taxName])) {
                    $taxSummary[$taxName] = [
                        'name' => $taxName,
                        'rate' => $line->tax->amount,
                        'base' => 0,
                        'amount' => 0,
                    ];
                }
                
                $taxSummary[$taxName]['base'] += $lineSubtotal;
                $taxSummary[$taxName]['amount'] += $taxAmount;
            }
        }

        return array_values($taxSummary);
    }

    protected function getDocumentTitle(Invoice $invoice): string
    {
        return match($invoice->move_type) {
            'out_invoice' => 'INVOICE',
            'out_refund' => 'CREDIT NOTE',
            'in_invoice' => 'VENDOR BILL',
            'in_refund' => 'VENDOR REFUND',
            default => 'INVOICE',
        };
    }

    protected function getFilename(Invoice $invoice): string
    {
        $number = $invoice->number ?: "DRAFT-{$invoice->id}";
        $number = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $number);
        
        return "{$number}.pdf";
    }
}
