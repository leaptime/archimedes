<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentTerm extends Model
{
    use HasFactory;

    protected $table = 'payment_terms';

    protected $fillable = [
        'name',
        'days',
        'description',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Scope for active payment terms
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the default payment term
     */
    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->first()
            ?? static::active()->orderBy('days')->first();
    }

    /**
     * Calculate due date from issue date
     */
    public function calculateDueDate(\DateTimeInterface $issueDate): \DateTimeInterface
    {
        return (clone $issueDate)->modify("+{$this->days} days");
    }
}
