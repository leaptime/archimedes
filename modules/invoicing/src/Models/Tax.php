<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tax extends Model
{
    protected $fillable = [
        'name',
        'code',
        'tax_group_id',
        'type',
        'amount',
        'type_tax_use',
        'tax_scope',
        'price_include',
        'include_base_amount',
        'description',
        'sequence',
        'active',
        'country_code',
        'extra_data',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'price_include' => 'boolean',
        'include_base_amount' => 'boolean',
        'sequence' => 'integer',
        'active' => 'boolean',
        'extra_data' => 'array',
    ];

    const TYPE_PERCENT = 'percent';
    const TYPE_FIXED = 'fixed';

    const USE_SALE = 'sale';
    const USE_PURCHASE = 'purchase';
    const USE_NONE = 'none';

    const SCOPE_SERVICE = 'service';
    const SCOPE_CONSU = 'consu';
    const SCOPE_ALL = 'all';

    public function taxGroup(): BelongsTo
    {
        return $this->belongsTo(TaxGroup::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeForSale($query)
    {
        return $query->where('type_tax_use', self::USE_SALE);
    }

    public function scopeForPurchase($query)
    {
        return $query->where('type_tax_use', self::USE_PURCHASE);
    }

    public function scopeForCountry($query, ?string $countryCode)
    {
        if ($countryCode) {
            return $query->where(function ($q) use ($countryCode) {
                $q->where('country_code', $countryCode)
                  ->orWhereNull('country_code');
            });
        }
        return $query->whereNull('country_code');
    }

    /**
     * Compute tax amount for a given base amount
     */
    public function computeAmount(float $baseAmount, int $quantity = 1): float
    {
        if ($this->type === self::TYPE_PERCENT) {
            return $baseAmount * ($this->amount / 100);
        }
        
        // Fixed amount per unit
        return $this->amount * $quantity;
    }

    /**
     * Get the base amount from a tax-inclusive price
     */
    public function getBaseFromInclusivePrice(float $priceIncludingTax): float
    {
        if (!$this->price_include) {
            return $priceIncludingTax;
        }

        if ($this->type === self::TYPE_PERCENT) {
            return $priceIncludingTax / (1 + ($this->amount / 100));
        }

        return $priceIncludingTax - $this->amount;
    }

    /**
     * Get display name with percentage
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === self::TYPE_PERCENT) {
            return "{$this->name} ({$this->amount}%)";
        }
        return $this->name;
    }

    /**
     * Check if tax applies to product type
     */
    public function appliesToProductType(string $productType): bool
    {
        if (!$this->tax_scope || $this->tax_scope === self::SCOPE_ALL) {
            return true;
        }
        return $this->tax_scope === $productType;
    }
}
