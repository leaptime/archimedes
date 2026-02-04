<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceTaxLine extends Model
{
    protected $table = 'invoice_tax_lines';

    protected $fillable = [
        'invoice_id',
        'tax_id',
        'tax_name',
        'tax_rate',
        'base',
        'amount',
    ];

    protected $casts = [
        'tax_rate' => 'decimal:4',
        'base' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}
