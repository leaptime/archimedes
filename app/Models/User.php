<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Modules\Core\Models\PermissionGroup;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    // User roles within organization
    const ROLE_OWNER = 'owner';
    const ROLE_ADMIN = 'admin';
    const ROLE_MEMBER = 'member';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'organization_id',
        'role',
        'is_platform_admin',
        'partner_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_platform_admin' => 'boolean',
        ];
    }

    /**
     * Organization this user belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Partner this user works for (if partner staff)
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * Permission groups the user belongs to
     */
    public function permissionGroups(): BelongsToMany
    {
        return $this->belongsToMany(
            PermissionGroup::class,
            'permission_group_users',
            'user_id',
            'group_id'
        )->withTimestamps();
    }

    /**
     * Check if user has a specific permission group
     */
    public function hasPermissionGroup(string $identifier): bool
    {
        return app(\Modules\Core\Services\PermissionService::class)->hasGroup($identifier, $this);
    }

    /**
     * Check model access permission
     */
    public function canAccess(string $model, string $operation): bool
    {
        return app(\Modules\Core\Services\PermissionService::class)->checkModelAccess($model, $operation, $this);
    }

    /**
     * Get the organization IDs this user has access to
     */
    public function getOrganizationIdsAttribute(): array
    {
        // Partner users can access all their partner's organizations
        if ($this->partner_id) {
            return Organization::where('partner_id', $this->partner_id)
                ->pluck('id')
                ->toArray();
        }

        // Regular users only access their own organization
        return [$this->organization_id];
    }

    /**
     * Check if user is a platform admin
     */
    public function isPlatformAdmin(): bool
    {
        return $this->is_platform_admin === true;
    }

    /**
     * Check if user is a partner user
     */
    public function isPartnerUser(): bool
    {
        return $this->partner_id !== null;
    }

    /**
     * Check if user is organization owner
     */
    public function isOrganizationOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    /**
     * Check if user is organization admin
     */
    public function isOrganizationAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN]);
    }

    /**
     * Check if user can manage the given organization
     */
    public function canManageOrganization(Organization $organization): bool
    {
        // Platform admins can manage any organization
        if ($this->isPlatformAdmin()) {
            return true;
        }

        // Partner users can manage their partner's organizations
        if ($this->isPartnerUser() && $organization->partner_id === $this->partner_id) {
            return true;
        }

        // Organization admins can manage their own organization
        if ($this->organization_id === $organization->id && $this->isOrganizationAdmin()) {
            return true;
        }

        return false;
    }

    /**
     * Get the current organization context
     */
    public function getCurrentOrganization(): ?Organization
    {
        return $this->organization;
    }
}
