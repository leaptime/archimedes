<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankConnectionSyncLog extends Model
{
    protected $fillable = [
        'bank_connection_id',
        'status',
        'transactions_count',
        'error_message',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function connection(): BelongsTo
    {
        return $this->belongsTo(BankConnection::class, 'bank_connection_id');
    }
}
