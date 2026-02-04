<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Industry extends Model
{
    protected $table = 'industries';

    protected $fillable = [
        'name',
        'full_name',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'industry_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
