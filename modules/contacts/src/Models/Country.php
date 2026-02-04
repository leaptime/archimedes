<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $table = 'countries';

    protected $fillable = [
        'name',
        'code',
        'phone_code',
        'currency_code',
        'address_format',
        'vat_label',
    ];

    public function states(): HasMany
    {
        return $this->hasMany(CountryState::class, 'country_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'country_id');
    }
}
