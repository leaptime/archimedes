<?php

namespace Modules\L10nItEdi\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;

class L10nItEdiLog extends Model
{
    protected $table = 'l10n_it_edi_logs';

    protected $fillable = [
        'invoice_id',
        'action',
        'status',
        'request',
        'response',
        'error_message',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function isError(): bool
    {
        return $this->status === 'error';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
