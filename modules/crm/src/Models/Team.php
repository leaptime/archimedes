<?php

namespace Modules\Crm\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;

class Team extends ExtendableModel
{
    protected $table = 'crm_teams';

    protected $fillable = [
        'name',
        'description',
        'active',
        'use_leads',
        'use_opportunities',
        'alias_email',
        'color',
        'leader_id',
        'company_id',
    ];

    protected $casts = [
        'active' => 'boolean',
        'use_leads' => 'boolean',
        'use_opportunities' => 'boolean',
    ];

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'team_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'crm_team_members', 'team_id', 'user_id')
            ->withPivot('assignment_max', 'active')
            ->withTimestamps();
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'team_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
