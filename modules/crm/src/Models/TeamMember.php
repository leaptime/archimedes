<?php

namespace Modules\Crm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class TeamMember extends Model
{
    protected $table = 'crm_team_members';

    protected $fillable = [
        'team_id',
        'user_id',
        'assignment_max',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'assignment_max' => 'integer',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
