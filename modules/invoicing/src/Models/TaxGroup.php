<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaxGroup extends Model
{
    protected $fillable = [
        'name',
        'code',
        'sequence',
        'active',
    ];

    protected $casts = [
        'sequence' => 'integer',
        'active' => 'boolean',
    ];

    public function taxes(): HasMany
    {
        return $this->hasMany(Tax::class)->orderBy('sequence');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
