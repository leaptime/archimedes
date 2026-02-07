<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'legal_name',
        'type',
        'status',
        'email',
        'phone',
        'website',
        'street',
        'street2',
        'city',
        'state',
        'zip',
        'country',
        'tax_id',
        'vat_number',
        'commission_rate',
        'minimum_payout',
        'payout_method',
        'payout_details',
        'currency',
        'max_organizations',
        'max_users_per_org',
        'logo_path',
        'primary_color',
        'custom_domain',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'minimum_payout' => 'decimal:2',
        'payout_details' => 'array',
        'metadata' => 'array',
        'max_organizations' => 'integer',
        'max_users_per_org' => 'integer',
    ];

    protected $attributes = [
        'type' => 'reseller',
        'status' => 'active',
        'commission_rate' => 20.00,
        'minimum_payout' => 100.00,
        'payout_method' => 'bank_transfer',
        'currency' => 'USD',
        'country' => 'US',
    ];

    const TYPE_RESELLER = 'reseller';
    const TYPE_AFFILIATE = 'affiliate';
    const TYPE_DISTRIBUTOR = 'distributor';

    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_TERMINATED = 'terminated';

    /**
     * Organizations managed by this partner
     */
    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }

    /**
     * Users belonging to this partner (partner staff)
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Payouts to this partner
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(PartnerPayout::class);
    }

    /**
     * Revenue records for this partner
     */
    public function revenue(): HasMany
    {
        return $this->hasMany(PartnerRevenue::class);
    }

    /**
     * Generate a unique partner code
     */
    public static function generateCode(): string
    {
        do {
            $code = 'PTR-' . strtoupper(substr(md5(uniqid()), 0, 8));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    /**
     * Check if partner can create more organizations
     */
    public function canCreateOrganization(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if ($this->max_organizations === null) {
            return true;
        }

        return $this->organizations()->count() < $this->max_organizations;
    }

    /**
     * Get total active organizations count
     */
    public function getActiveOrganizationsCountAttribute(): int
    {
        return $this->organizations()->where('status', 'active')->count();
    }

    /**
     * Get total users across all organizations
     */
    public function getTotalUsersCountAttribute(): int
    {
        return User::whereIn('organization_id', $this->organizations()->pluck('id'))->count();
    }

    /**
     * Get total monthly recurring revenue from organizations
     */
    public function getMonthlyRevenueAttribute(): float
    {
        return $this->revenue()
            ->where('status', 'approved')
            ->whereMonth('period_date', now()->month)
            ->whereYear('period_date', now()->year)
            ->sum('gross_amount');
    }

    /**
     * Get total commission for current month
     */
    public function getMonthlyCommissionAttribute(): float
    {
        return $this->revenue()
            ->where('status', 'approved')
            ->whereMonth('period_date', now()->month)
            ->whereYear('period_date', now()->year)
            ->sum('commission_amount');
    }

    /**
     * Get pending payout amount
     */
    public function getPendingPayoutAttribute(): float
    {
        return $this->revenue()
            ->where('status', 'approved')
            ->whereNull('payout_id')
            ->sum('commission_amount');
    }

    /**
     * Scope for active partners
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Get full address
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->street,
            $this->street2,
            $this->city,
            $this->state,
            $this->zip,
            $this->country,
        ]);

        return implode(', ', $parts);
    }
}
