<?php

namespace Modules\Crm\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stage extends ExtendableModel
{
    protected $table = 'crm_stages';

    protected $fillable = [
        'name',
        'sequence',
        'is_won',
        'is_lost',
        'probability',
        'requirements',
        'fold',
        'color',
        'team_id',
    ];

    protected $casts = [
        'is_won' => 'boolean',
        'is_lost' => 'boolean',
        'fold' => 'boolean',
        'sequence' => 'integer',
        'probability' => 'integer',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sequence');
    }

    public function scopeActive($query)
    {
        return $query->where('fold', false);
    }
}
