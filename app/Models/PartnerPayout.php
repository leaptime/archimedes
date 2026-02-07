<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerPayout extends Model
{
    protected $fillable = [
        'partner_id',
        'reference',
        'status',
        'amount',
        'currency',
        'period_start',
        'period_end',
        'breakdown',
        'payment_method',
        'payment_reference',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'breakdown' => 'array',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function revenueItems(): HasMany
    {
        return $this->hasMany(PartnerRevenue::class, 'payout_id');
    }

    /**
     * Generate a unique payout reference
     */
    public static function generateReference(): string
    {
        $year = date('Y');
        $month = date('m');
        $sequence = static::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count() + 1;

        return sprintf('PAY-%s%s-%04d', $year, $month, $sequence);
    }

    /**
     * Mark payout as processing
     */
    public function markProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Mark payout as completed
     */
    public function markCompleted(string $paymentReference = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'payment_reference' => $paymentReference,
            'paid_at' => now(),
        ]);

        // Update all associated revenue items
        $this->revenueItems()->update(['status' => 'paid']);
    }

    /**
     * Mark payout as failed
     */
    public function markFailed(string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'notes' => $reason,
        ]);
    }

    /**
     * Scope for pending payouts
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}
