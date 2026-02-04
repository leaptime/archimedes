<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceSequenceRange extends Model
{
    protected $table = 'invoice_sequence_ranges';

    protected $fillable = [
        'sequence_id',
        'date_from',
        'date_to',
        'next_number',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
        'next_number' => 'integer',
    ];

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(InvoiceSequence::class, 'sequence_id');
    }
}
