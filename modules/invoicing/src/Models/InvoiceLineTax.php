<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLineTax extends Model
{
    protected $table = 'invoice_line_taxes';

    protected $fillable = [
        'invoice_line_id',
        'tax_id',
        'base',
        'amount',
    ];

    protected $casts = [
        'base' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function line(): BelongsTo
    {
        return $this->belongsTo(InvoiceLine::class, 'invoice_line_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}
