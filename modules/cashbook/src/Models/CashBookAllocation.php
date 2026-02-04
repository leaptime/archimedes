<?php

namespace Modules\CashBook\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;

class CashBookAllocation extends Model
{
    protected $table = 'cashbook_allocations';

    protected $fillable = [
        'cashbook_entry_id',
        'invoice_id',
        'amount_applied',
        'notes',
    ];

    protected $casts = [
        'amount_applied' => 'decimal:2',
    ];

    // Relationships
    public function entry(): BelongsTo
    {
        return $this->belongsTo(CashBookEntry::class, 'cashbook_entry_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    // Boot method to sync invoice payment state
    protected static function booted(): void
    {
        static::created(function (CashBookAllocation $allocation) {
            $allocation->entry->updateAllocatedAmount();
            $allocation->invoice->updatePaymentState();
        });

        static::updated(function (CashBookAllocation $allocation) {
            $allocation->entry->updateAllocatedAmount();
            $allocation->invoice->updatePaymentState();
        });

        static::deleted(function (CashBookAllocation $allocation) {
            $allocation->entry->updateAllocatedAmount();
            $allocation->invoice->updatePaymentState();
        });
    }
}
