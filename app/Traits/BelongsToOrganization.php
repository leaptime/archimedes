<?php

namespace App\Traits;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * Trait for models that belong to an organization (tenant)
 * Provides automatic scoping and organization assignment
 * 
 * This works alongside PostgreSQL RLS for defense-in-depth security:
 * - PostgreSQL RLS: Database-level enforcement (primary, cannot be bypassed)
 * - This trait: Application-level convenience + fallback for non-PostgreSQL
 */
trait BelongsToOrganization
{
    /**
     * Boot the trait
     */
    public static function bootBelongsToOrganization(): void
    {
        // Only add global scope if NOT using PostgreSQL (RLS handles it there)
        if (DB::connection()->getDriverName() !== 'pgsql') {
            static::addGlobalScope('organization', function (Builder $builder) {
                if (auth()->check() && !auth()->user()->is_platform_admin) {
                    $user = auth()->user();
                    
                    if ($user->partner_id) {
                        // Partner users see all their partner's organizations
                        $orgIds = Organization::where('partner_id', $user->partner_id)
                            ->pluck('id')
                            ->toArray();
                        $builder->whereIn('organization_id', $orgIds);
                    } elseif ($user->organization_id) {
                        // Regular users see only their organization
                        $builder->where('organization_id', $user->organization_id);
                    }
                }
            });
        }

        // Automatically set organization_id on create
        static::creating(function (Model $model) {
            if (empty($model->organization_id) && auth()->check()) {
                $model->organization_id = auth()->user()->organization_id;
            }
        });
    }

    /**
     * Relationship to Organization
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope to filter by organization
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope to filter by current user's organization
     */
    public function scopeForCurrentOrganization(Builder $query): Builder
    {
        if (auth()->check()) {
            return $query->where('organization_id', auth()->user()->organization_id);
        }
        
        return $query->whereRaw('1 = 0'); // Return empty if no auth
    }

    /**
     * Scope for partner access (all organizations under a partner)
     */
    public function scopeForPartner(Builder $query, int $partnerId): Builder
    {
        $orgIds = Organization::where('partner_id', $partnerId)->pluck('id');
        return $query->whereIn('organization_id', $orgIds);
    }

    /**
     * Check if record belongs to the given organization
     */
    public function belongsToOrganization(int $organizationId): bool
    {
        return $this->organization_id === $organizationId;
    }

    /**
     * Check if current user can access this record
     */
    public function isAccessibleByCurrentUser(): bool
    {
        if (!auth()->check()) {
            return false;
        }

        $user = auth()->user();

        // Platform admins can access everything
        if ($user->is_platform_admin) {
            return true;
        }

        // Partner users can access their organizations
        if ($user->partner_id) {
            $organization = $this->organization;
            return $organization && $organization->partner_id === $user->partner_id;
        }

        // Regular users can only access their organization
        return $this->organization_id === $user->organization_id;
    }
}
