<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $documentTitle }} from {{ $company->name }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: #1a1a1a;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.8;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .invoice-box {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .invoice-box-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .invoice-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-posted { background: #dbeafe; color: #1d4ed8; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .detail-item {
            font-size: 14px;
        }
        .detail-label {
            color: #6b7280;
            font-size: 12px;
        }
        .detail-value {
            font-weight: 600;
            color: #1a1a1a;
        }
        .amount-due {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .amount-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .amount-value {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
        }
        .custom-message {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            margin: 5px;
        }
        .btn-primary {
            background: #1a1a1a;
            color: white;
        }
        .btn-secondary {
            background: white;
            color: #1a1a1a;
            border: 1px solid #e5e7eb;
        }
        .buttons {
            text-align: center;
            margin: 30px 0;
        }
        .footer {
            padding: 20px 30px;
            background: #f9fafb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .footer a {
            color: #1a1a1a;
            text-decoration: none;
        }
        .attachment-note {
            font-size: 13px;
            color: #6b7280;
            text-align: center;
            margin-top: 20px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 4px;
        }
        .attachment-note strong {
            color: #1a1a1a;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>{{ $company->name }}</h1>
            <p>{{ $documentTitle }} #{{ $invoice->number ?? 'Draft' }}</p>
        </div>

        <div class="content">
            <p class="greeting">
                Hello{{ $contact ? ' ' . explode(' ', $contact->name)[0] : '' }},
            </p>

            <p>
                @if($invoice->move_type === 'out_refund')
                    Please find attached your credit note from {{ $company->name }}.
                @elseif($invoice->payment_state === 'paid')
                    Thank you for your payment! Here is your receipt for invoice #{{ $invoice->number }}.
                @else
                    Please find attached your invoice from {{ $company->name }}. 
                    @if($invoice->invoice_date_due)
                        Payment is due by <strong>{{ \Carbon\Carbon::parse($invoice->invoice_date_due)->format('F j, Y') }}</strong>.
                    @endif
                @endif
            </p>

            @if($customMessage)
            <div class="custom-message">
                {!! nl2br(e($customMessage)) !!}
            </div>
            @endif

            <div class="invoice-box">
                <div class="invoice-box-header">
                    <span class="invoice-number">{{ $documentTitle }} #{{ $invoice->number ?? 'Draft' }}</span>
                    @php
                        $statusClass = 'status-posted';
                        $statusText = 'Open';
                        if ($invoice->payment_state === 'paid') {
                            $statusClass = 'status-paid';
                            $statusText = 'Paid';
                        } elseif ($invoice->invoice_date_due && \Carbon\Carbon::parse($invoice->invoice_date_due)->isPast()) {
                            $statusClass = 'status-overdue';
                            $statusText = 'Overdue';
                        }
                    @endphp
                    <span class="invoice-status {{ $statusClass }}">{{ $statusText }}</span>
                </div>

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
                        <div class="detail-label">Invoice Total</div>
                        <div class="detail-value">${{ number_format($invoice->amount_total, 2) }}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Reference</div>
                        <div class="detail-value">{{ $invoice->ref ?: '-' }}</div>
                    </div>
                </div>

                @if($invoice->payment_state !== 'paid' && $invoice->amount_residual > 0)
                <div class="amount-due">
                    <div class="amount-label">Amount Due</div>
                    <div class="amount-value">${{ number_format($invoice->amount_residual, 2) }}</div>
                </div>
                @endif
            </div>

            <div class="buttons">
                <a href="{{ $viewUrl }}" class="btn btn-primary">View {{ $documentTitle }}</a>
                @if($payUrl && $invoice->payment_state !== 'paid')
                <a href="{{ $payUrl }}" class="btn btn-secondary">Pay Now</a>
                @endif
            </div>

            <div class="attachment-note">
                📎 <strong>PDF attached</strong> - A copy of this {{ strtolower($documentTitle) }} is attached to this email.
            </div>
        </div>

        <div class="footer">
            <p>
                <strong>{{ $company->name }}</strong><br>
                @if($company->address){{ $company->address }}<br>@endif
                @if($company->phone){{ $company->phone }} | @endif
                @if($company->email)<a href="mailto:{{ $company->email }}">{{ $company->email }}</a>@endif
            </p>
            <p style="margin-top: 15px;">
                If you have any questions about this {{ strtolower($documentTitle) }}, please contact us at 
                <a href="mailto:{{ $company->email }}">{{ $company->email }}</a>
            </p>
        </div>
    </div>
</body>
</html>
