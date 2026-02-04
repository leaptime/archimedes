<?php

namespace Modules\Crm\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Activity extends ExtendableModel
{
    protected $table = 'crm_activities';

    const TYPE_CALL = 'call';
    const TYPE_EMAIL = 'email';
    const TYPE_MEETING = 'meeting';
    const TYPE_TASK = 'task';
    const TYPE_DEADLINE = 'deadline';
    const TYPE_NOTE = 'note';

    protected $fillable = [
        'lead_id',
        'user_id',
        'type',
        'summary',
        'description',
        'date_due',
        'time_due',
        'done',
        'done_at',
    ];

    protected $casts = [
        'date_due' => 'date',
        'done' => 'boolean',
        'done_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending($query)
    {
        return $query->where('done', false);
    }

    public function scopeCompleted($query)
    {
        return $query->where('done', true);
    }

    public function scopeOverdue($query)
    {
        return $query->pending()->where('date_due', '<', now()->toDateString());
    }

    public function scopeDueToday($query)
    {
        return $query->pending()->whereDate('date_due', now()->toDateString());
    }

    public function scopeUpcoming($query, int $days = 7)
    {
        return $query->pending()->whereBetween('date_due', [
            now()->toDateString(),
            now()->addDays($days)->toDateString()
        ]);
    }

    public function markDone(): bool
    {
        $this->done = true;
        $this->done_at = now();
        return $this->save();
    }
}
