<?php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;

class PermissionGroup extends Model
{
    protected $table = 'permission_groups';

    protected $fillable = [
        'identifier',
        'name',
        'module',
        'category',
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Groups that this group implies (inherits from)
     */
    public function impliedGroups(): BelongsToMany
    {
        return $this->belongsToMany(
            PermissionGroup::class,
            'permission_group_implications',
            'group_id',
            'implied_group_id'
        );
    }

    /**
     * Groups that imply this group (parents)
     */
    public function parentGroups(): BelongsToMany
    {
        return $this->belongsToMany(
            PermissionGroup::class,
            'permission_group_implications',
            'implied_group_id',
            'group_id'
        );
    }

    /**
     * Users directly assigned to this group
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'permission_group_users',
            'group_id',
            'user_id'
        )->withTimestamps();
    }

    /**
     * Model access rules for this group
     */
    public function modelAccess()
    {
        return $this->hasMany(ModelAccess::class, 'group_id');
    }

    /**
     * Record rules for this group
     */
    public function recordRules(): BelongsToMany
    {
        return $this->belongsToMany(
            RecordRule::class,
            'record_rule_groups',
            'group_id',
            'record_rule_id'
        );
    }

    /**
     * Get all implied groups recursively (includes self)
     */
    public function getAllImpliedGroups(): array
    {
        $groups = [$this->id];
        $toProcess = $this->impliedGroups()->pluck('permission_groups.id')->toArray();

        while (!empty($toProcess)) {
            $groupId = array_shift($toProcess);
            if (!in_array($groupId, $groups)) {
                $groups[] = $groupId;
                $implied = self::find($groupId)?->impliedGroups()->pluck('permission_groups.id')->toArray() ?? [];
                $toProcess = array_merge($toProcess, $implied);
            }
        }

        return $groups;
    }

    /**
     * Check if this group implies another group
     */
    public function implies(string $groupIdentifier): bool
    {
        $targetGroup = self::where('identifier', $groupIdentifier)->first();
        if (!$targetGroup) {
            return false;
        }

        return in_array($targetGroup->id, $this->getAllImpliedGroups());
    }

    /**
     * Scope for active groups
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope for groups by module
     */
    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }
}
