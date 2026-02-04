<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Modules\Core\Models\PermissionGroup;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
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
        ];
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
     * Get the company IDs this user has access to (for multi-company support)
     */
    public function getCompanyIdsAttribute(): array
    {
        // Override this if you have multi-company support
        return [$this->company_id ?? 1];
    }
}
