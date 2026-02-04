<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactTitle extends Model
{
    protected $table = 'contact_titles';

    protected $fillable = [
        'name',
        'shortcut',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'title_id');
    }
}
