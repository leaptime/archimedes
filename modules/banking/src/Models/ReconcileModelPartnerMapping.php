<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class ReconcileModelPartnerMapping extends Model
{
    protected $fillable = [
        'reconcile_model_id',
        'partner_id',
        'payment_ref_regex',
        'narration_regex',
    ];

    public function reconcileModel(): BelongsTo
    {
        return $this->belongsTo(ReconcileModel::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'partner_id');
    }
}
