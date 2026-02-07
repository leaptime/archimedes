<?php

namespace Extensions\ContactActivities\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToOrganization;

class ContactNote extends Model
{
    use BelongsToOrganization;

    protected $table = 'ext_contact_notes';

    protected $fillable = [
        'contact_id',
        'user_id',
        'organization_id',
        'content',
        'is_pinned',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(\Modules\Contacts\Models\Contact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function togglePin(): void
    {
        $this->update(['is_pinned' => !$this->is_pinned]);
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }
}
