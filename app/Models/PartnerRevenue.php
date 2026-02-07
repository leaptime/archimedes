<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRevenue extends Model
{
    protected $table = 'partner_revenue';

    protected $fillable = [
        'partner_id',
        'organization_id',
        'payout_id',
        'type',
        'description',
        'gross_amount',
        'commission_rate',
        'commission_amount',
        'currency',
        'period_date',
        'status',
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'period_date' => 'date',
    ];

    const TYPE_SUBSCRIPTION = 'subscription';
    const TYPE_MODULE = 'module';
    const TYPE_USERS = 'users';
    const TYPE_STORAGE = 'storage';
    const TYPE_OVERAGE = 'overage';

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_PAID = 'paid';

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(PartnerPayout::class, 'payout_id');
    }

    /**
     * Create a revenue record with automatic commission calculation
     */
    public static function createWithCommission(array $data): self
    {
        $partner = Partner::findOrFail($data['partner_id']);
        
        $grossAmount = $data['gross_amount'];
        $commissionRate = $data['commission_rate'] ?? $partner->commission_rate;
        $commissionAmount = round($grossAmount * ($commissionRate / 100), 2);

        return static::create([
            'partner_id' => $data['partner_id'],
            'organization_id' => $data['organization_id'],
            'type' => $data['type'],
            'description' => $data['description'],
            'gross_amount' => $grossAmount,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'currency' => $data['currency'] ?? 'USD',
            'period_date' => $data['period_date'] ?? now()->startOfMonth(),
            'status' => self::STATUS_PENDING,
        ]);
    }

    /**
     * Approve this revenue record
     */
    public function approve(): void
    {
        $this->update(['status' => self::STATUS_APPROVED]);
    }

    /**
     * Scope for unpaid approved revenue
     */
    public function scopeUnpaid($query)
    {
        return $query->where('status', self::STATUS_APPROVED)
            ->whereNull('payout_id');
    }

    /**
     * Scope for a specific period
     */
    public function scopeForPeriod($query, $year, $month)
    {
        return $query->whereYear('period_date', $year)
            ->whereMonth('period_date', $month);
    }
}
