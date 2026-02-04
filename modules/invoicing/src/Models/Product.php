<?php

namespace Modules\Invoicing\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends ExtendableModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'barcode',
        'type',
        'description',
        'description_sale',
        'description_purchase',
        'list_price',
        'standard_price',
        'default_code',
        'uom',
        'sale_tax_id',
        'purchase_tax_id',
        'category',
        'sale_ok',
        'purchase_ok',
        'active',
    ];

    protected $casts = [
        'list_price' => 'decimal:4',
        'standard_price' => 'decimal:4',
        'sale_ok' => 'boolean',
        'purchase_ok' => 'boolean',
        'active' => 'boolean',
    ];

    const TYPE_CONSUMABLE = 'consu';
    const TYPE_SERVICE = 'service';
    const TYPE_STORABLE = 'storable';

    public function saleTax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'sale_tax_id');
    }

    public function purchaseTax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'purchase_tax_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeSaleable($query)
    {
        return $query->where('sale_ok', true)->where('active', true);
    }

    public function scopePurchaseable($query)
    {
        return $query->where('purchase_ok', true)->where('active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get the description for sales
     */
    public function getSaleDescriptionAttribute(): string
    {
        return $this->description_sale ?: $this->description ?: $this->name;
    }

    /**
     * Get the description for purchases
     */
    public function getPurchaseDescriptionAttribute(): string
    {
        return $this->description_purchase ?: $this->description ?: $this->name;
    }

    /**
     * Get tax for sale
     */
    public function getSaleTaxes(): array
    {
        return $this->sale_tax_id ? [$this->sale_tax_id] : [];
    }

    /**
     * Get tax for purchase
     */
    public function getPurchaseTaxes(): array
    {
        return $this->purchase_tax_id ? [$this->purchase_tax_id] : [];
    }
}
