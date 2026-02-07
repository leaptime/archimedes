<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationModule extends Model
{
    protected $fillable = [
        'organization_id',
        'module_id',
        'is_active',
        'activated_at',
        'expires_at',
        'monthly_price',
        'yearly_price',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'activated_at' => 'date',
        'expires_at' => 'date',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'settings' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Check if module is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if module is active and not expired
     */
    public function isUsable(): bool
    {
        return $this->is_active && !$this->isExpired();
    }

    /**
     * Get current price based on billing cycle
     */
    public function getCurrentPrice(string $billingCycle = 'monthly'): float
    {
        return $billingCycle === 'yearly' ? $this->yearly_price : $this->monthly_price;
    }
}
