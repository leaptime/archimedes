<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactAddress extends Model
{
    protected $table = 'contact_addresses';

    protected $fillable = [
        'contact_id',
        'type',
        'name',
        'street',
        'street2',
        'city',
        'postal_code',
        'state_id',
        'country_id',
        'phone',
        'email',
        'notes',
        'is_default',
        'active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'active' => 'boolean',
    ];

    public const TYPE_INVOICE = 'invoice';
    public const TYPE_DELIVERY = 'delivery';
    public const TYPE_PRIVATE = 'private';
    public const TYPE_OTHER = 'other';

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(CountryState::class, 'state_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->street,
            $this->street2,
            $this->city,
            $this->state?->name,
            $this->postal_code,
            $this->country?->name,
        ]);
        return implode(', ', $parts);
    }

    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_INVOICE => 'Invoice Address',
            self::TYPE_DELIVERY => 'Delivery Address',
            self::TYPE_PRIVATE => 'Private Address',
            self::TYPE_OTHER => 'Other Address',
            default => 'Address',
        };
    }
}
