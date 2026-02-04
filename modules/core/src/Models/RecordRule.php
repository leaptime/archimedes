<?php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RecordRule extends Model
{
    protected $table = 'record_rules';

    protected $fillable = [
        'identifier',
        'name',
        'model',
        'domain',
        'is_global',
        'perm_read',
        'perm_write',
        'perm_create',
        'perm_unlink',
        'module',
        'active',
        'priority',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'perm_read' => 'boolean',
        'perm_write' => 'boolean',
        'perm_create' => 'boolean',
        'perm_unlink' => 'boolean',
        'active' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Groups this rule applies to
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(
            PermissionGroup::class,
            'record_rule_groups',
            'record_rule_id',
            'group_id'
        );
    }

    /**
     * Scope for active rules
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope for a specific model
     */
    public function scopeForModel($query, string $model)
    {
        return $query->where('model', $model);
    }

    /**
     * Scope for global rules
     */
    public function scopeGlobal($query)
    {
        return $query->where('is_global', true);
    }

    /**
     * Scope for group-specific rules
     */
    public function scopeForGroups($query, array $groupIds)
    {
        return $query->where('is_global', false)
            ->whereHas('groups', function ($q) use ($groupIds) {
                $q->whereIn('permission_groups.id', $groupIds);
            });
    }

    /**
     * Check if rule applies to operation
     */
    public function appliesToOperation(string $operation): bool
    {
        return match ($operation) {
            'read' => $this->perm_read,
            'write' => $this->perm_write,
            'create' => $this->perm_create,
            'unlink', 'delete' => $this->perm_unlink,
            default => false,
        };
    }

    /**
     * Get parsed domain
     */
    public function getParsedDomain(): ?array
    {
        if (empty($this->domain)) {
            return null;
        }

        // Try to parse as JSON first
        $decoded = json_decode($this->domain, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // Return as expression string
        return ['expression' => $this->domain];
    }
}
