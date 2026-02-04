<?php

namespace Modules\Crm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LostReason extends Model
{
    protected $table = 'crm_lost_reasons';

    protected $fillable = [
        'name',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'lost_reason_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
