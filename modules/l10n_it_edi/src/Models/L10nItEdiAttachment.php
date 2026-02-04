<?php

namespace Modules\L10nItEdi\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;

class L10nItEdiAttachment extends Model
{
    protected $table = 'l10n_it_edi_attachments';

    protected $fillable = [
        'invoice_id',
        'type',
        'filename',
        'content',
        'sdi_identifier',
        'sdi_message_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function isSent(): bool
    {
        return $this->type === 'sent';
    }

    public function isNotification(): bool
    {
        return $this->type === 'notification';
    }

    public function isReceipt(): bool
    {
        return $this->type === 'receipt';
    }

    public function isRejection(): bool
    {
        return $this->type === 'rejection';
    }
}
