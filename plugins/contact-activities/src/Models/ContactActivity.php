<?php

namespace Extensions\ContactActivities\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToOrganization;

class ContactActivity extends Model
{
    use BelongsToOrganization;

    protected $table = 'ext_contact_activities';

    protected $fillable = [
        'contact_id',
        'user_id',
        'organization_id',
        'type',
        'title',
        'description',
        'scheduled_at',
        'completed_at',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(\Modules\Contacts\Models\Contact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function isOverdue(): bool
    {
        return !$this->isCompleted() 
            && $this->scheduled_at 
            && $this->scheduled_at->isPast();
    }

    public function markComplete(): void
    {
        $this->update(['completed_at' => now()]);
    }

    public function scopeUpcoming($query)
    {
        return $query->whereNull('completed_at')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at');
    }

    public function scopeOverdue($query)
    {
        return $query->whereNull('completed_at')
            ->where('scheduled_at', '<', now());
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
