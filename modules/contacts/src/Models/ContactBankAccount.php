<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactBankAccount extends Model
{
    protected $table = 'contact_bank_accounts';

    protected $fillable = [
        'contact_id',
        'acc_number',
        'acc_holder_name',
        'bank_name',
        'bank_bic',
        'country_id',
        'active',
        'sequence',
    ];

    protected $casts = [
        'active' => 'boolean',
        'sequence' => 'integer',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sequence');
    }

    public function getMaskedAccountAttribute(): string
    {
        $num = $this->acc_number;
        if (strlen($num) <= 4) {
            return $num;
        }
        return str_repeat('*', strlen($num) - 4) . substr($num, -4);
    }

    public function getDisplayNameAttribute(): string
    {
        $parts = array_filter([
            $this->bank_name,
            $this->masked_account,
        ]);
        return implode(' - ', $parts);
    }
}
