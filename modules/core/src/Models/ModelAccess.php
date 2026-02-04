<?php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModelAccess extends Model
{
    protected $table = 'model_access';

    protected $fillable = [
        'identifier',
        'name',
        'model',
        'group_id',
        'perm_read',
        'perm_write',
        'perm_create',
        'perm_unlink',
        'module',
        'active',
    ];

    protected $casts = [
        'perm_read' => 'boolean',
        'perm_write' => 'boolean',
        'perm_create' => 'boolean',
        'perm_unlink' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * The group this access rule belongs to
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(PermissionGroup::class, 'group_id');
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
     * Scope for specific groups
     */
    public function scopeForGroups($query, array $groupIds)
    {
        return $query->whereIn('group_id', $groupIds);
    }

    /**
     * Check if this rule grants a specific permission
     */
    public function hasPermission(string $operation): bool
    {
        return match ($operation) {
            'read' => $this->perm_read,
            'write' => $this->perm_write,
            'create' => $this->perm_create,
            'unlink', 'delete' => $this->perm_unlink,
            default => false,
        };
    }
}
