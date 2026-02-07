<?php

namespace Modules\Invoicing\Models;

use Modules\Core\Models\ExtendableModel;
use Modules\Contacts\Models\Contact;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class Invoice extends ExtendableModel
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoices';

    public const MODEL_IDENTIFIER = 'invoicing.invoice';

    // Move types (like Odoo's account.move)
    const MOVE_TYPE_OUT_INVOICE = 'out_invoice';   // Customer Invoice
    const MOVE_TYPE_OUT_REFUND = 'out_refund';     // Customer Credit Note
    const MOVE_TYPE_IN_INVOICE = 'in_invoice';     // Vendor Bill
    const MOVE_TYPE_IN_REFUND = 'in_refund';       // Vendor Credit Note
    const MOVE_TYPE_ENTRY = 'entry';               // Journal Entry

    // States
    const STATE_DRAFT = 'draft';
    const STATE_POSTED = 'posted';
    const STATE_CANCEL = 'cancel';

    // Payment states
    const PAYMENT_NOT_PAID = 'not_paid';
    const PAYMENT_IN_PAYMENT = 'in_payment';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_PARTIAL = 'partial';
    const PAYMENT_REVERSED = 'reversed';

    // Legacy status (for backward compatibility)
    const STATUS_DRAFT = 'draft';
    const STATUS_SENT = 'sent';
    const STATUS_PAID = 'paid';
    const STATUS_PARTIAL = 'partial';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        // Core fields
        'number',
        'move_type',
        'state',
        'status',
        'ref',
        
        // Partner
        'contact_id',
        'partner_shipping_id',
        'partner_address',
        'partner_vat',
        
        // Dates
        'invoice_date',
        'invoice_date_due',
        'issue_date',
        'due_date',
        'accounting_date',
        'sent_at',
        'paid_at',
        
        // Currency
        'currency_id',
        'currency',
        'currency_rate',
        
        // Payment
        'payment_term_id',
        'payment_state',
        
        // Amounts (company currency)
        'amount_untaxed',
        'amount_tax',
        'amount_total',
        'amount_residual',
        
        // Amounts (document currency)
        'amount_untaxed_signed',
        'amount_tax_signed',
        'amount_total_signed',
        'amount_residual_signed',
        
        // Legacy amounts
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total',
        'amount_paid',
        'amount_due',
        
        // References
        'origin',
        'invoice_origin',
        
        // Notes
        'notes',
        'terms',
        'footer',
        'narration',
        
        // Sequence
        'sequence_id',
        
        // Company
        'company_id',
        'user_id',
        
        // Auto-post
        'auto_post',
        'auto_post_origin_id',
        
        // EDI
        'edi_state',
        'edi_data',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'invoice_date_due' => 'date',
        'issue_date' => 'date',
        'due_date' => 'date',
        'accounting_date' => 'date',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
        'currency_rate' => 'decimal:10',
        'amount_untaxed' => 'decimal:2',
        'amount_tax' => 'decimal:2',
        'amount_total' => 'decimal:2',
        'amount_residual' => 'decimal:2',
        'amount_untaxed_signed' => 'decimal:2',
        'amount_tax_signed' => 'decimal:2',
        'amount_total_signed' => 'decimal:2',
        'amount_residual_signed' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'auto_post' => 'boolean',
        'edi_data' => 'array',
    ];

    protected $attributes = [
        'move_type' => self::MOVE_TYPE_OUT_INVOICE,
        'state' => self::STATE_DRAFT,
        'status' => self::STATUS_DRAFT,
        'payment_state' => self::PAYMENT_NOT_PAID,
        'currency_rate' => 1,
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(InvoiceSequence::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('sequence');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceLine::class, 'invoice_id')->orderBy('sequence');
    }

    public function taxLines(): HasMany
    {
        return $this->hasMany(InvoiceTaxLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function cashBookAllocations(): HasMany
    {
        return $this->hasMany(\Modules\CashBook\Models\CashBookAllocation::class);
    }

    public function cashBookEntries(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\CashBook\Models\CashBookEntry::class,
            'cashbook_allocations',
            'invoice_id',
            'cashbook_entry_id'
        )->withPivot('amount_applied', 'notes')->withTimestamps();
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeDraft($query)
    {
        return $query->where('state', self::STATE_DRAFT);
    }

    public function scopePosted($query)
    {
        return $query->where('state', self::STATE_POSTED);
    }

    public function scopeOutInvoice($query)
    {
        return $query->where('move_type', self::MOVE_TYPE_OUT_INVOICE);
    }

    public function scopeOutRefund($query)
    {
        return $query->where('move_type', self::MOVE_TYPE_OUT_REFUND);
    }

    public function scopeInInvoice($query)
    {
        return $query->where('move_type', self::MOVE_TYPE_IN_INVOICE);
    }

    public function scopeInRefund($query)
    {
        return $query->where('move_type', self::MOVE_TYPE_IN_REFUND);
    }

    public function scopeSale($query)
    {
        return $query->whereIn('move_type', [self::MOVE_TYPE_OUT_INVOICE, self::MOVE_TYPE_OUT_REFUND]);
    }

    public function scopePurchase($query)
    {
        return $query->whereIn('move_type', [self::MOVE_TYPE_IN_INVOICE, self::MOVE_TYPE_IN_REFUND]);
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('payment_state', [self::PAYMENT_NOT_PAID, self::PAYMENT_PARTIAL]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('state', self::STATE_POSTED)
            ->whereIn('payment_state', [self::PAYMENT_NOT_PAID, self::PAYMENT_PARTIAL])
            ->where('invoice_date_due', '<', now());
    }

    // -------------------------------------------------------------------------
    // Computed Properties
    // -------------------------------------------------------------------------

    public function getIsInvoiceAttribute(): bool
    {
        return in_array($this->move_type, [self::MOVE_TYPE_OUT_INVOICE, self::MOVE_TYPE_IN_INVOICE]);
    }

    public function getIsRefundAttribute(): bool
    {
        return in_array($this->move_type, [self::MOVE_TYPE_OUT_REFUND, self::MOVE_TYPE_IN_REFUND]);
    }

    public function getIsSaleDocumentAttribute(): bool
    {
        return in_array($this->move_type, [self::MOVE_TYPE_OUT_INVOICE, self::MOVE_TYPE_OUT_REFUND]);
    }

    public function getIsPurchaseDocumentAttribute(): bool
    {
        return in_array($this->move_type, [self::MOVE_TYPE_IN_INVOICE, self::MOVE_TYPE_IN_REFUND]);
    }

    public function getIsOverdueAttribute(): bool
    {
        $dueDate = $this->invoice_date_due ?? $this->due_date;
        return $dueDate && $dueDate < now() && 
               $this->state === self::STATE_POSTED &&
               !in_array($this->payment_state, [self::PAYMENT_PAID, self::PAYMENT_REVERSED]);
    }

    public function getDaysUntilDueAttribute(): int
    {
        $dueDate = $this->invoice_date_due ?? $this->due_date;
        return $dueDate ? now()->diffInDays($dueDate, false) : 0;
    }

    public function getDisplayNameAttribute(): string
    {
        $typeName = match ($this->move_type) {
            self::MOVE_TYPE_OUT_INVOICE => 'Invoice',
            self::MOVE_TYPE_OUT_REFUND => 'Credit Note',
            self::MOVE_TYPE_IN_INVOICE => 'Bill',
            self::MOVE_TYPE_IN_REFUND => 'Refund',
            default => 'Entry',
        };

        return $this->number ? "{$typeName} {$this->number}" : "{$typeName} Draft";
    }

    // -------------------------------------------------------------------------
    // Business Logic
    // -------------------------------------------------------------------------

    public function calculateTotals(): void
    {
        $lines = $this->lines()->where('display_type', 'product')->get();
        
        $untaxed = 0;
        $tax = 0;

        foreach ($lines as $line) {
            $untaxed += $line->price_subtotal ?? ($line->quantity * $line->price_unit * (1 - $line->discount / 100));
            $tax += $line->tax_amount ?? 0;
        }

        // Apply document-level discount if any
        $untaxed -= $this->discount_amount ?? 0;

        $total = $untaxed + $tax;
        $residual = $total - ($this->amount_paid ?? 0);

        // Sign for refunds
        $sign = $this->is_refund ? -1 : 1;

        $this->amount_untaxed = $untaxed;
        $this->amount_tax = $tax;
        $this->amount_total = $total;
        $this->amount_residual = max(0, $residual);

        $this->amount_untaxed_signed = $untaxed * $sign;
        $this->amount_tax_signed = $tax * $sign;
        $this->amount_total_signed = $total * $sign;
        $this->amount_residual_signed = $residual * $sign;

        // Legacy fields
        $this->subtotal = $untaxed;
        $this->tax_amount = $tax;
        $this->total = $total;
        $this->amount_due = max(0, $residual);

        // Update tax lines
        $this->computeTaxLines();
    }

    protected function computeTaxLines(): void
    {
        // Delete existing tax lines
        $this->taxLines()->delete();

        $taxTotals = [];
        
        foreach ($this->lines()->where('display_type', 'product')->get() as $line) {
            $taxIds = $line->tax_ids ?? [];
            $baseAmount = $line->price_subtotal ?? ($line->quantity * $line->price_unit * (1 - ($line->discount ?? 0) / 100));

            foreach ($taxIds as $taxId) {
                $tax = Tax::find($taxId);
                if (!$tax) continue;

                if (!isset($taxTotals[$taxId])) {
                    $taxTotals[$taxId] = [
                        'tax' => $tax,
                        'base' => 0,
                        'amount' => 0,
                    ];
                }

                $taxTotals[$taxId]['base'] += $baseAmount;
                $taxTotals[$taxId]['amount'] += $tax->computeAmount($baseAmount);
            }
        }

        foreach ($taxTotals as $taxId => $data) {
            $this->taxLines()->create([
                'tax_id' => $taxId,
                'tax_name' => $data['tax']->name,
                'tax_rate' => $data['tax']->amount,
                'base' => $data['base'],
                'amount' => $data['amount'],
            ]);
        }
    }

    public function post(): bool
    {
        if ($this->state !== self::STATE_DRAFT) {
            return false;
        }

        // Generate number if not set
        if (!$this->number) {
            $this->number = $this->generateNumber();
        }

        $this->state = self::STATE_POSTED;
        $this->status = self::STATUS_SENT;
        
        // Set invoice date if not set
        if (!$this->invoice_date) {
            $this->invoice_date = now();
        }

        return $this->save();
    }

    public function cancel(): bool
    {
        if ($this->state === self::STATE_CANCEL) {
            return false;
        }

        if ($this->payment_state === self::PAYMENT_PAID) {
            return false; // Cannot cancel paid invoice
        }

        $this->state = self::STATE_CANCEL;
        $this->status = self::STATUS_CANCELLED;
        
        return $this->save();
    }

    public function resetToDraft(): bool
    {
        if ($this->state !== self::STATE_CANCEL) {
            return false;
        }

        $this->state = self::STATE_DRAFT;
        $this->status = self::STATUS_DRAFT;
        
        return $this->save();
    }

    public function markAsSent(): void
    {
        if ($this->state === self::STATE_DRAFT) {
            $this->post();
        }
        
        $this->sent_at = now();
        $this->status = self::STATUS_SENT;
        $this->save();
    }

    public function registerPayment(float $amount, ?string $method = null, ?string $reference = null): Payment
    {
        $payment = $this->payments()->create([
            'amount' => $amount,
            'payment_date' => now(),
            'payment_method' => $method ?? Payment::METHOD_BANK_TRANSFER,
            'reference' => $reference,
        ]);

        $this->updatePaymentState();

        return $payment;
    }

    public function updatePaymentState(): void
    {
        // Sum from legacy payments table
        $paymentsTotal = $this->payments()->sum('amount');
        
        // Sum from Cash Book allocations
        $cashBookTotal = $this->cashBookAllocations()->sum('amount_applied');
        
        $totalPaid = $paymentsTotal + $cashBookTotal;
        
        $this->amount_paid = $totalPaid;
        $this->amount_residual = max(0, $this->amount_total - $totalPaid);
        $this->amount_due = $this->amount_residual;

        if ($this->amount_residual <= 0) {
            $this->payment_state = self::PAYMENT_PAID;
            $this->status = self::STATUS_PAID;
            $this->paid_at = now();
        } elseif ($totalPaid > 0) {
            $this->payment_state = self::PAYMENT_PARTIAL;
            $this->status = self::STATUS_PARTIAL;
        } else {
            $this->payment_state = self::PAYMENT_NOT_PAID;
        }

        $this->save();
    }

    public function generateNumber(): string
    {
        $sequence = InvoiceSequence::getByCode($this->move_type);
        
        if ($sequence) {
            return $sequence->getNextNumber($this->invoice_date ?? now());
        }

        // Fallback to simple generation
        $prefix = match ($this->move_type) {
            self::MOVE_TYPE_OUT_INVOICE => 'INV',
            self::MOVE_TYPE_OUT_REFUND => 'RINV',
            self::MOVE_TYPE_IN_INVOICE => 'BILL',
            self::MOVE_TYPE_IN_REFUND => 'RBILL',
            default => 'DOC',
        };

        $year = ($this->invoice_date ?? now())->format('Y');
        $count = static::where('move_type', $this->move_type)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return $prefix . '/' . $year . '/' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }

    public function duplicate(): self
    {
        $new = $this->replicate([
            'number', 'state', 'status', 'payment_state',
            'sent_at', 'paid_at', 'amount_paid', 'amount_residual', 'amount_due',
            'edi_state', 'edi_data',
        ]);

        $new->state = self::STATE_DRAFT;
        $new->status = self::STATUS_DRAFT;
        $new->payment_state = self::PAYMENT_NOT_PAID;
        $new->invoice_date = now();
        $new->invoice_date_due = null;
        $new->amount_paid = 0;
        $new->save();

        // Duplicate lines
        foreach ($this->lines as $line) {
            $newLine = $line->replicate(['invoice_id']);
            $newLine->invoice_id = $new->id;
            $newLine->save();
        }

        $new->calculateTotals();
        $new->save();

        return $new;
    }

    public function createCreditNote(): self
    {
        $creditNote = $this->replicate([
            'number', 'state', 'status', 'payment_state',
            'sent_at', 'paid_at', 'amount_paid', 'amount_residual', 'amount_due',
            'edi_state', 'edi_data',
        ]);

        $creditNote->move_type = $this->is_sale_document 
            ? self::MOVE_TYPE_OUT_REFUND 
            : self::MOVE_TYPE_IN_REFUND;
        $creditNote->state = self::STATE_DRAFT;
        $creditNote->status = self::STATUS_DRAFT;
        $creditNote->payment_state = self::PAYMENT_NOT_PAID;
        $creditNote->invoice_date = now();
        $creditNote->invoice_date_due = null;
        $creditNote->invoice_origin = $this->number;
        $creditNote->origin = "Reversal of {$this->number}";
        $creditNote->amount_paid = 0;
        $creditNote->save();

        // Duplicate lines
        foreach ($this->lines as $line) {
            $newLine = $line->replicate(['invoice_id']);
            $newLine->invoice_id = $creditNote->id;
            $newLine->refund_line_id = $line->id;
            $newLine->save();
        }

        $creditNote->calculateTotals();
        $creditNote->save();

        return $creditNote;
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            // Sync date fields
            if ($invoice->invoice_date && !$invoice->issue_date) {
                $invoice->issue_date = $invoice->invoice_date;
            } elseif ($invoice->issue_date && !$invoice->invoice_date) {
                $invoice->invoice_date = $invoice->issue_date;
            }

            if ($invoice->invoice_date_due && !$invoice->due_date) {
                $invoice->due_date = $invoice->invoice_date_due;
            } elseif ($invoice->due_date && !$invoice->invoice_date_due) {
                $invoice->invoice_date_due = $invoice->due_date;
            }

            // Set default currency
            if (!$invoice->currency_id && !$invoice->currency) {
                $invoice->currency = 'USD';
            }
        });

        static::saving(function ($invoice) {
            // Sync legacy status with state
            if ($invoice->isDirty('state')) {
                $invoice->status = match ($invoice->state) {
                    self::STATE_DRAFT => self::STATUS_DRAFT,
                    self::STATE_POSTED => $invoice->payment_state === self::PAYMENT_PAID 
                        ? self::STATUS_PAID 
                        : self::STATUS_SENT,
                    self::STATE_CANCEL => self::STATUS_CANCELLED,
                    default => $invoice->status,
                };
            }
        });
    }
}
