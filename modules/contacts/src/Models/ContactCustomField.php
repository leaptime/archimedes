<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactCustomField extends Model
{
    protected $table = 'contact_custom_fields';

    protected $fillable = [
        'name',
        'label',
        'field_type',
        'options',
        'required',
        'searchable',
        'applies_to',
        'sequence',
        'active',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
        'searchable' => 'boolean',
        'active' => 'boolean',
        'sequence' => 'integer',
    ];

    public const TYPE_STRING = 'string';
    public const TYPE_TEXT = 'text';
    public const TYPE_NUMBER = 'number';
    public const TYPE_DATE = 'date';
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_SELECT = 'select';
    public const TYPE_MULTISELECT = 'multiselect';

    public const APPLIES_TO_ALL = 'all';
    public const APPLIES_TO_COMPANY = 'company';
    public const APPLIES_TO_INDIVIDUAL = 'individual';

    public function values(): HasMany
    {
        return $this->hasMany(ContactCustomFieldValue::class, 'field_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeForContact($query, Contact $contact)
    {
        return $query->where(function ($q) use ($contact) {
            $q->where('applies_to', self::APPLIES_TO_ALL);
            if ($contact->is_company) {
                $q->orWhere('applies_to', self::APPLIES_TO_COMPANY);
            } else {
                $q->orWhere('applies_to', self::APPLIES_TO_INDIVIDUAL);
            }
        });
    }

    public function scopeSearchable($query)
    {
        return $query->where('searchable', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sequence');
    }

    public function getValueForContact(Contact $contact)
    {
        $value = $this->values()->where('contact_id', $contact->id)->first();
        return $value?->value;
    }

    public function castValue($value)
    {
        return match($this->field_type) {
            self::TYPE_NUMBER => is_numeric($value) ? (float) $value : null,
            self::TYPE_BOOLEAN => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            self::TYPE_DATE => $value ? \Carbon\Carbon::parse($value) : null,
            self::TYPE_MULTISELECT => is_array($value) ? $value : json_decode($value, true),
            default => $value,
        };
    }
}
