<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactCustomFieldValue extends Model
{
    protected $table = 'contact_custom_field_values';

    protected $fillable = [
        'contact_id',
        'field_id',
        'value',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ContactCustomField::class, 'field_id');
    }

    public function getCastedValueAttribute()
    {
        return $this->field?->castValue($this->value);
    }
}
