<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceLine extends Model
{
    use HasFactory;

    protected $table = 'invoice_items';

    const DISPLAY_TYPE_PRODUCT = 'product';
    const DISPLAY_TYPE_SECTION = 'line_section';
    const DISPLAY_TYPE_NOTE = 'line_note';

    protected $fillable = [
        'invoice_id',
        'product_id',
        'name',
        'description',
        'quantity',
        'unit_price',
        'price_unit',
        'discount',
        'tax_rate',
        'tax_ids',
        'tax_amount',
        'tax_details',
        'price_subtotal',
        'price_total',
        'total',
        'account_code',
        'analytic_account',
        'analytic_distribution',
        'display_type',
        'sequence',
        'sort_order',
        'refund_line_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'price_unit' => 'decimal:4',
        'discount' => 'decimal:2',
        'tax_rate' => 'decimal:4',
        'tax_amount' => 'decimal:2',
        'price_subtotal' => 'decimal:2',
        'price_total' => 'decimal:2',
        'total' => 'decimal:2',
        'tax_ids' => 'array',
        'tax_details' => 'array',
        'analytic_distribution' => 'array',
        'sequence' => 'integer',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'quantity' => 1,
        'discount' => 0,
        'display_type' => self::DISPLAY_TYPE_PRODUCT,
        'sequence' => 10,
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function refundLine(): BelongsTo
    {
        return $this->belongsTo(self::class, 'refund_line_id');
    }

    public function lineTaxes(): HasMany
    {
        return $this->hasMany(InvoiceLineTax::class, 'invoice_line_id');
    }

    // -------------------------------------------------------------------------
    // Computed Properties
    // -------------------------------------------------------------------------

    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->description ?: ($this->product?->name ?? 'Line');
    }

    public function getPriceUnitAttribute($value): float
    {
        return $value ?? $this->unit_price ?? 0;
    }

    public function getSubtotalAttribute(): float
    {
        return $this->price_subtotal ?? $this->calculateSubtotal();
    }

    // -------------------------------------------------------------------------
    // Tax Computation
    // -------------------------------------------------------------------------

    public function calculateSubtotal(): float
    {
        $price = $this->price_unit ?? $this->unit_price ?? 0;
        $quantity = $this->quantity ?? 1;
        $discount = $this->discount ?? 0;

        return $price * $quantity * (1 - $discount / 100);
    }

    public function calculateTaxes(): array
    {
        $taxIds = $this->tax_ids ?? [];
        $baseAmount = $this->calculateSubtotal();
        $taxDetails = [];
        $totalTax = 0;

        foreach ($taxIds as $taxId) {
            $tax = Tax::find($taxId);
            if (!$tax) continue;

            $taxAmount = $tax->computeAmount($baseAmount, $this->quantity ?? 1);
            $totalTax += $taxAmount;

            $taxDetails[] = [
                'tax_id' => $tax->id,
                'tax_name' => $tax->name,
                'tax_rate' => $tax->amount,
                'base' => $baseAmount,
                'amount' => $taxAmount,
            ];

            // If tax includes base amount, add to base for next tax
            if ($tax->include_base_amount) {
                $baseAmount += $taxAmount;
            }
        }

        return [
            'subtotal' => $this->calculateSubtotal(),
            'tax_amount' => $totalTax,
            'total' => $this->calculateSubtotal() + $totalTax,
            'details' => $taxDetails,
        ];
    }

    public function computePrices(): void
    {
        $this->price_subtotal = $this->calculateSubtotal();
        
        $taxData = $this->calculateTaxes();
        $this->tax_amount = $taxData['tax_amount'];
        $this->tax_details = $taxData['details'];
        $this->price_total = $taxData['total'];
        
        // Legacy fields
        $this->total = $this->price_total;
    }

    // -------------------------------------------------------------------------
    // Product Helpers
    // -------------------------------------------------------------------------

    public function setProductWithDefaults(Product $product): void
    {
        $this->product_id = $product->id;
        $this->name = $product->name;
        $this->description = $this->invoice?->is_sale_document
            ? $product->sale_description
            : $product->purchase_description;

        $this->price_unit = $this->invoice?->is_sale_document
            ? $product->list_price
            : $product->standard_price;

        $this->unit_price = $this->price_unit;

        // Set taxes
        $taxes = $this->invoice?->is_sale_document
            ? $product->getSaleTaxes()
            : $product->getPurchaseTaxes();

        $this->tax_ids = $taxes;
    }

    // -------------------------------------------------------------------------
    // Section/Note Helpers
    // -------------------------------------------------------------------------

    public static function createSection(Invoice $invoice, string $name, int $sequence = 10): self
    {
        return static::create([
            'invoice_id' => $invoice->id,
            'display_type' => self::DISPLAY_TYPE_SECTION,
            'name' => $name,
            'sequence' => $sequence,
        ]);
    }

    public static function createNote(Invoice $invoice, string $note, int $sequence = 10): self
    {
        return static::create([
            'invoice_id' => $invoice->id,
            'display_type' => self::DISPLAY_TYPE_NOTE,
            'name' => $note,
            'sequence' => $sequence,
        ]);
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($line) {
            // Only compute for product lines
            if ($line->display_type === self::DISPLAY_TYPE_PRODUCT) {
                $line->computePrices();
            }

            // Sync sequence fields
            if ($line->isDirty('sequence') && !$line->isDirty('sort_order')) {
                $line->sort_order = $line->sequence;
            } elseif ($line->isDirty('sort_order') && !$line->isDirty('sequence')) {
                $line->sequence = $line->sort_order;
            }
        });

        static::saved(function ($line) {
            // Recalculate invoice totals
            if ($line->invoice) {
                $line->invoice->calculateTotals();
                $line->invoice->save();
            }
        });

        static::deleted(function ($line) {
            // Recalculate invoice totals
            if ($line->invoice) {
                $line->invoice->calculateTotals();
                $line->invoice->save();
            }
        });
    }
}
