<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $document_title }} {{ $invoice->number ?? 'Draft' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
        }
        .container {
            padding: 20px 40px;
        }
        
        /* Header */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .header-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .header-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        .company-name {
            font-size: 18pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        .company-info {
            font-size: 9pt;
            color: #666;
            line-height: 1.5;
        }
        .document-title {
            font-size: 24pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .invoice-number {
            font-size: 12pt;
            color: #666;
        }
        .invoice-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 10px;
        }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-posted { background: #dbeafe; color: #1d4ed8; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-overdue { background: #fee2e2; color: #dc2626; }

        /* Addresses */
        .addresses {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .address-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .address-label {
            font-size: 8pt;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .address-content {
            font-size: 10pt;
            line-height: 1.6;
        }
        .address-name {
            font-weight: bold;
            font-size: 11pt;
        }

        /* Invoice Details */
        .invoice-details {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 4px;
        }
        .detail-item {
            display: table-cell;
            width: 25%;
            text-align: center;
        }
        .detail-label {
            font-size: 8pt;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 3px;
        }
        .detail-value {
            font-size: 11pt;
            font-weight: bold;
            color: #1a1a1a;
        }

        /* Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background: #1a1a1a;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .items-table th.text-right {
            text-align: right;
        }
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10pt;
        }
        .items-table td.text-right {
            text-align: right;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .section-row td {
            background: #f3f4f6;
            font-weight: bold;
            font-size: 10pt;
            padding: 8px;
        }
        .item-description {
            color: #666;
            font-size: 9pt;
            margin-top: 3px;
        }

        /* Totals */
        .totals-section {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .totals-notes {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .totals-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .totals-table {
            width: 100%;
            margin-left: auto;
        }
        .totals-table td {
            padding: 6px 0;
        }
        .totals-table .label {
            text-align: right;
            padding-right: 20px;
            color: #666;
        }
        .totals-table .value {
            text-align: right;
            font-weight: bold;
            width: 120px;
        }
        .totals-table .total-row td {
            font-size: 14pt;
            border-top: 2px solid #1a1a1a;
            padding-top: 10px;
        }
        .totals-table .due-row td {
            color: #dc2626;
            font-size: 12pt;
        }

        /* Tax Summary */
        .tax-summary {
            margin-top: 10px;
            font-size: 9pt;
        }
        .tax-summary-row {
            display: table;
            width: 100%;
        }
        .tax-summary-row span {
            display: table-cell;
        }

        /* Notes */
        .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 4px;
        }
        .notes-label {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 5px;
        }
        .notes-content {
            font-size: 10pt;
            line-height: 1.5;
        }

        /* Payment Info */
        .payment-info {
            margin-top: 30px;
            padding: 15px;
            border: 2px solid #1a1a1a;
            border-radius: 4px;
        }
        .payment-info-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .bank-details {
            display: table;
            width: 100%;
        }
        .bank-detail {
            display: table-row;
        }
        .bank-detail-label {
            display: table-cell;
            width: 100px;
            font-size: 9pt;
            color: #666;
            padding: 3px 0;
        }
        .bank-detail-value {
            display: table-cell;
            font-size: 10pt;
            font-weight: bold;
            padding: 3px 0;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9pt;
            color: #999;
        }

        /* Watermark for drafts */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100pt;
            color: rgba(0,0,0,0.05);
            font-weight: bold;
            z-index: -1;
        }
    </style>
</head>
<body>
    @if($invoice->state === 'draft')
    <div class="watermark">DRAFT</div>
    @endif

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                @if($company->logo)
                <img src="{{ $company->logo }}" alt="{{ $company->name }}" style="max-height: 60px; margin-bottom: 10px;">
                @endif
                <div class="company-name">{{ $company->name }}</div>
                <div class="company-info">
                    {{ $company->address }}<br>
                    {{ $company->city }}, {{ $company->state }} {{ $company->zip }}<br>
                    {{ $company->country }}<br>
                    @if($company->phone)Tel: {{ $company->phone }}<br>@endif
                    @if($company->email){{ $company->email }}<br>@endif
                    @if($company->vat)VAT: {{ $company->vat }}@endif
                </div>
            </div>
            <div class="header-right">
                <div class="document-title">{{ $document_title }}</div>
                <div class="invoice-number">
                    @if($invoice->number)
                        #{{ $invoice->number }}
                    @else
                        Draft
                    @endif
                </div>
                @php
                    $statusClass = 'status-draft';
                    $statusText = 'Draft';
                    if ($invoice->state === 'posted') {
                        if ($invoice->payment_state === 'paid') {
                            $statusClass = 'status-paid';
                            $statusText = 'Paid';
                        } elseif ($invoice->invoice_date_due && \Carbon\Carbon::parse($invoice->invoice_date_due)->isPast()) {
                            $statusClass = 'status-overdue';
                            $statusText = 'Overdue';
                        } else {
                            $statusClass = 'status-posted';
                            $statusText = 'Confirmed';
                        }
                    }
                @endphp
                <div class="invoice-status {{ $statusClass }}">{{ $statusText }}</div>
            </div>
        </div>

        <!-- Addresses -->
        <div class="addresses">
            <div class="address-box">
                <div class="address-label">{{ $is_refund ? 'Refund To' : 'Bill To' }}</div>
                <div class="address-content">
                    <div class="address-name">{{ $contact->name ?? 'N/A' }}</div>
                    @if($contact)
                        @if($contact->street){{ $contact->street }}<br>@endif
                        @if($contact->city || $contact->state || $contact->zip)
                            {{ $contact->city }}@if($contact->state), {{ $contact->state }}@endif {{ $contact->zip }}<br>
                        @endif
                        @if($contact->country){{ $contact->country }}<br>@endif
                        @if($contact->vat)VAT: {{ $contact->vat }}<br>@endif
                        @if($contact->email){{ $contact->email }}@endif
                    @endif
                </div>
            </div>
            <div class="address-box" style="text-align: right;">
                <div class="address-label">{{ $is_refund ? 'Original Invoice' : 'Ship To' }}</div>
                <div class="address-content">
                    @if($invoice->ref)
                        Reference: {{ $invoice->ref }}
                    @else
                        Same as billing address
                    @endif
                </div>
            </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
            <div class="detail-item">
                <div class="detail-label">Invoice Date</div>
                <div class="detail-value">{{ $invoice->invoice_date ? \Carbon\Carbon::parse($invoice->invoice_date)->format('M d, Y') : '-' }}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">{{ $invoice->invoice_date_due ? \Carbon\Carbon::parse($invoice->invoice_date_due)->format('M d, Y') : '-' }}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Payment Terms</div>
                <div class="detail-value">{{ $invoice->payment_term ?? 'Due on Receipt' }}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Currency</div>
                <div class="detail-value">{{ $currency->code ?? 'USD' }}</div>
            </div>
        </div>

        <!-- Line Items -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40%">Description</th>
                    <th class="text-right" style="width: 12%">Qty</th>
                    <th class="text-right" style="width: 15%">Unit Price</th>
                    <th class="text-right" style="width: 10%">Discount</th>
                    <th class="text-right" style="width: 10%">Tax</th>
                    <th class="text-right" style="width: 13%">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->lines as $line)
                    @if($line->display_type === 'line_section')
                        <tr class="section-row">
                            <td colspan="6">{{ $line->name }}</td>
                        </tr>
                    @elseif($line->display_type === 'line_note')
                        <tr>
                            <td colspan="6" style="font-style: italic; color: #666;">{{ $line->name }}</td>
                        </tr>
                    @else
                        @php
                            $lineSubtotal = $line->quantity * $line->price_unit * (1 - ($line->discount / 100));
                        @endphp
                        <tr>
                            <td>
                                <strong>{{ $line->product->name ?? $line->name }}</strong>
                                @if($line->name && $line->product && $line->name !== $line->product->name)
                                    <div class="item-description">{{ $line->name }}</div>
                                @endif
                            </td>
                            <td class="text-right">{{ number_format($line->quantity, 2) }}</td>
                            <td class="text-right">{{ $currency->symbol ?? '$' }}{{ number_format($line->price_unit, 2) }}</td>
                            <td class="text-right">{{ $line->discount > 0 ? number_format($line->discount, 1) . '%' : '-' }}</td>
                            <td class="text-right">{{ $line->tax ? $line->tax->name : '-' }}</td>
                            <td class="text-right">{{ $currency->symbol ?? '$' }}{{ number_format($lineSubtotal, 2) }}</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-notes">
                @if($invoice->narration)
                    <div class="notes-label">Notes</div>
                    <div class="notes-content">{{ $invoice->narration }}</div>
                @endif
            </div>
            <div class="totals-box">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="value">{{ $currency->symbol ?? '$' }}{{ number_format($subtotal, 2) }}</td>
                    </tr>
                    @foreach($tax_lines as $tax)
                    <tr>
                        <td class="label">{{ $tax['name'] }} ({{ $tax['rate'] }}%)</td>
                        <td class="value">{{ $currency->symbol ?? '$' }}{{ number_format($tax['amount'], 2) }}</td>
                    </tr>
                    @endforeach
                    @if(count($tax_lines) === 0 && $tax_total > 0)
                    <tr>
                        <td class="label">Tax</td>
                        <td class="value">{{ $currency->symbol ?? '$' }}{{ number_format($tax_total, 2) }}</td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td class="label">Total</td>
                        <td class="value">{{ $currency->symbol ?? '$' }}{{ number_format($total, 2) }}</td>
                    </tr>
                    @if($amount_paid > 0)
                    <tr>
                        <td class="label">Paid</td>
                        <td class="value">-{{ $currency->symbol ?? '$' }}{{ number_format($amount_paid, 2) }}</td>
                    </tr>
                    @endif
                    @if($amount_due > 0 && $amount_due != $total)
                    <tr class="due-row">
                        <td class="label">Amount Due</td>
                        <td class="value">{{ $currency->symbol ?? '$' }}{{ number_format($amount_due, 2) }}</td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>

        <!-- Payment Information -->
        @if($show_payment_info && ($company->bank_iban || $company->bank_name))
        <div class="payment-info">
            <div class="payment-info-title">Payment Information</div>
            <div class="bank-details">
                @if($company->bank_name)
                <div class="bank-detail">
                    <span class="bank-detail-label">Bank</span>
                    <span class="bank-detail-value">{{ $company->bank_name }}</span>
                </div>
                @endif
                @if($company->bank_iban)
                <div class="bank-detail">
                    <span class="bank-detail-label">IBAN</span>
                    <span class="bank-detail-value">{{ $company->bank_iban }}</span>
                </div>
                @endif
                @if($company->bank_bic)
                <div class="bank-detail">
                    <span class="bank-detail-label">BIC/SWIFT</span>
                    <span class="bank-detail-value">{{ $company->bank_bic }}</span>
                </div>
                @endif
                <div class="bank-detail">
                    <span class="bank-detail-label">Reference</span>
                    <span class="bank-detail-value">{{ $invoice->number ?? $invoice->id }}</span>
                </div>
            </div>
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            Thank you for your business!<br>
            @if($company->website){{ $company->website }}@endif
        </div>
    </div>
</body>
</html>
