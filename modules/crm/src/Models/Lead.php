<?php

namespace Modules\Crm\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Contacts\Models\Contact;
use App\Models\User;

class Lead extends ExtendableModel
{
    use SoftDeletes;

    protected $table = 'crm_leads';

    public const MODEL_IDENTIFIER = 'crm.lead';

    const TYPE_LEAD = 'lead';
    const TYPE_OPPORTUNITY = 'opportunity';

    const PRIORITY_LOW = 0;
    const PRIORITY_MEDIUM = 1;
    const PRIORITY_HIGH = 2;
    const PRIORITY_VERY_HIGH = 3;

    protected $fillable = [
        'name',
        'type',
        'active',
        'priority',
        'color',
        'stage_id',
        'probability',
        'user_id',
        'team_id',
        'contact_id',
        'contact_name',
        'partner_name',
        'email',
        'phone',
        'mobile',
        'website',
        'function',
        'street',
        'street2',
        'city',
        'state',
        'zip',
        'country_code',
        'expected_revenue',
        'currency_code',
        'recurring_revenue',
        'recurring_plan',
        'date_deadline',
        'date_open',
        'date_closed',
        'date_conversion',
        'date_last_stage_update',
        'lost_reason_id',
        'lost_feedback',
        'source',
        'medium',
        'campaign',
        'referred_by',
        'description',
        'internal_notes',
        'company_id',
        'created_by',
    ];

    protected $casts = [
        'active' => 'boolean',
        'priority' => 'integer',
        'probability' => 'integer',
        'expected_revenue' => 'decimal:2',
        'recurring_revenue' => 'decimal:2',
        'date_deadline' => 'date',
        'date_open' => 'datetime',
        'date_closed' => 'datetime',
        'date_conversion' => 'datetime',
        'date_last_stage_update' => 'datetime',
    ];

    protected $appends = ['display_name', 'is_won', 'is_lost', 'weighted_revenue'];

    // Relationships
    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lostReason(): BelongsTo
    {
        return $this->belongsTo(LostReason::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'crm_lead_tag', 'lead_id', 'tag_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'lead_id');
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        if ($this->contact_name && $this->partner_name) {
            return "{$this->name} - {$this->contact_name} ({$this->partner_name})";
        }
        if ($this->partner_name) {
            return "{$this->name} - {$this->partner_name}";
        }
        if ($this->contact_name) {
            return "{$this->name} - {$this->contact_name}";
        }
        return $this->name;
    }

    public function getIsWonAttribute(): bool
    {
        return $this->stage?->is_won ?? false;
    }

    public function getIsLostAttribute(): bool
    {
        return $this->stage?->is_lost ?? false;
    }

    public function getWeightedRevenueAttribute(): float
    {
        return round($this->expected_revenue * ($this->probability / 100), 2);
    }

    // Scopes
    public function scopeLeads($query)
    {
        return $query->where('type', self::TYPE_LEAD);
    }

    public function scopeOpportunities($query)
    {
        return $query->where('type', self::TYPE_OPPORTUNITY);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOpen($query)
    {
        return $query->whereHas('stage', fn($q) => $q->where('is_won', false)->where('is_lost', false));
    }

    public function scopeWon($query)
    {
        return $query->whereHas('stage', fn($q) => $q->where('is_won', true));
    }

    public function scopeLost($query)
    {
        return $query->whereHas('stage', fn($q) => $q->where('is_lost', true));
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('user_id');
    }

    public function scopeInTeam($query, int $teamId)
    {
        return $query->where('team_id', $teamId);
    }

    public function scopeClosingThisMonth($query)
    {
        return $query->whereBetween('date_deadline', [
            now()->startOfMonth(),
            now()->endOfMonth()
        ]);
    }

    public function scopeOverdue($query)
    {
        return $query->open()
            ->whereNotNull('date_deadline')
            ->where('date_deadline', '<', now()->toDateString());
    }

    // Business Logic
    public function convertToOpportunity(): bool
    {
        if ($this->type !== self::TYPE_LEAD) {
            return false;
        }

        $this->type = self::TYPE_OPPORTUNITY;
        $this->date_conversion = now();
        return $this->save();
    }

    public function markAsWon(?float $actualRevenue = null): bool
    {
        $wonStage = Stage::where('is_won', true)->first();
        if (!$wonStage) {
            return false;
        }

        $this->stage_id = $wonStage->id;
        $this->probability = 100;
        $this->date_closed = now();
        $this->date_last_stage_update = now();
        
        if ($actualRevenue !== null) {
            $this->expected_revenue = $actualRevenue;
        }

        return $this->save();
    }

    public function markAsLost(int $reasonId, ?string $feedback = null): bool
    {
        $lostStage = Stage::where('is_lost', true)->first();
        if (!$lostStage) {
            return false;
        }

        $this->stage_id = $lostStage->id;
        $this->probability = 0;
        $this->date_closed = now();
        $this->date_last_stage_update = now();
        $this->lost_reason_id = $reasonId;
        $this->lost_feedback = $feedback;

        return $this->save();
    }

    public function reopen(): bool
    {
        if (!$this->is_won && !$this->is_lost) {
            return false;
        }

        $firstStage = Stage::where('is_won', false)->where('is_lost', false)->orderBy('sequence')->first();
        if (!$firstStage) {
            return false;
        }

        $this->stage_id = $firstStage->id;
        $this->probability = $firstStage->probability;
        $this->date_closed = null;
        $this->date_last_stage_update = now();
        $this->lost_reason_id = null;
        $this->lost_feedback = null;

        return $this->save();
    }

    public function assignTo(int $userId): bool
    {
        $this->user_id = $userId;
        if (!$this->date_open) {
            $this->date_open = now();
        }
        return $this->save();
    }

    public function moveTo(int $stageId): bool
    {
        $stage = Stage::find($stageId);
        if (!$stage) {
            return false;
        }

        $this->stage_id = $stageId;
        $this->probability = $stage->probability;
        $this->date_last_stage_update = now();

        if ($stage->is_won || $stage->is_lost) {
            $this->date_closed = now();
        }

        return $this->save();
    }

    public function createContactFromLead(): ?Contact
    {
        if ($this->contact_id) {
            return $this->contact;
        }

        $contact = Contact::create([
            'name' => $this->contact_name ?: $this->partner_name ?: $this->name,
            'company_name' => $this->partner_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'website' => $this->website,
            'function' => $this->function,
            'street' => $this->street,
            'street2' => $this->street2,
            'city' => $this->city,
            'state' => $this->state,
            'zip' => $this->zip,
            'country_code' => $this->country_code,
            'is_company' => !empty($this->partner_name) && empty($this->contact_name),
        ]);

        $this->contact_id = $contact->id;
        $this->save();

        return $contact;
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($lead) {
            if (!$lead->stage_id) {
                $lead->stage_id = Stage::where('is_won', false)
                    ->where('is_lost', false)
                    ->orderBy('sequence')
                    ->value('id');
            }
            if ($lead->stage_id && !$lead->probability) {
                $lead->probability = Stage::find($lead->stage_id)?->probability ?? 10;
            }
        });

        static::updating(function ($lead) {
            if ($lead->isDirty('stage_id')) {
                $lead->date_last_stage_update = now();
                $newStage = Stage::find($lead->stage_id);
                if ($newStage && !$lead->isDirty('probability')) {
                    $lead->probability = $newStage->probability;
                }
            }
        });
    }
}
