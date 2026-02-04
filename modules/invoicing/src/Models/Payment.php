<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'invoice_id',
        'amount',
        'payment_date',
        'payment_method',
        'reference',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    const METHOD_CASH = 'cash';
    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_CREDIT_CARD = 'credit_card';
    const METHOD_CHECK = 'check';
    const METHOD_OTHER = 'other';

    /**
     * Get the invoice this payment belongs to
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($payment) {
            $invoice = $payment->invoice;
            $invoice->amount_paid = $invoice->payments()->sum('amount');
            $invoice->amount_due = $invoice->total - $invoice->amount_paid;

            if ($invoice->amount_due <= 0) {
                $invoice->status = Invoice::STATUS_PAID;
                $invoice->paid_at = now();
            } elseif ($invoice->amount_paid > 0) {
                $invoice->status = Invoice::STATUS_PARTIAL;
            }

            $invoice->save();
        });

        static::deleted(function ($payment) {
            $invoice = $payment->invoice;
            $invoice->amount_paid = $invoice->payments()->sum('amount');
            $invoice->amount_due = $invoice->total - $invoice->amount_paid;

            if ($invoice->amount_paid == 0) {
                $invoice->status = Invoice::STATUS_SENT;
                $invoice->paid_at = null;
            } elseif ($invoice->amount_due > 0) {
                $invoice->status = Invoice::STATUS_PARTIAL;
            }

            $invoice->save();
        });
    }
}
