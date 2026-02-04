<?php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Modules\Core\Traits\HasExtensions;
use Modules\Core\Services\PermissionService;

abstract class ExtendableModel extends Model
{
    use HasExtensions;

    /**
     * The model identifier for permission checking (e.g., 'contacts.contact')
     * Override in child classes if needed
     */
    public const MODEL_IDENTIFIER = null;

    /**
     * Whether to auto-apply record rules on queries
     */
    protected static bool $autoApplyRecordRules = false;

    /**
     * Boot the model
     */
    protected static function booted(): void
    {
        parent::booted();

        // Auto-apply record rules if enabled
        if (static::$autoApplyRecordRules && static::MODEL_IDENTIFIER) {
            static::addGlobalScope('record_rules', function (Builder $builder) {
                $permissionService = app(PermissionService::class);
                $permissionService->applyRecordRules(
                    $builder, 
                    static::MODEL_IDENTIFIER, 
                    'read'
                );
            });
        }
    }

    /**
     * Get model identifier for permissions
     */
    public static function getPermissionIdentifier(): string
    {
        if (static::MODEL_IDENTIFIER) {
            return static::MODEL_IDENTIFIER;
        }

        // Auto-generate from class name
        $class = static::class;
        if (preg_match('/Modules\\\\(\w+)\\\\.*\\\\(\w+)$/', $class, $matches)) {
            $module = strtolower($matches[1]);
            $model = strtolower($matches[2]);
            return "{$module}.{$model}";
        }

        return (new static())->getTable();
    }

    /**
     * Scope to apply record rules for read operations
     */
    public function scopeWithRecordRules(Builder $query, string $operation = 'read'): Builder
    {
        $permissionService = app(PermissionService::class);
        return $permissionService->applyRecordRules(
            $query,
            static::getPermissionIdentifier(),
            $operation
        );
    }

    /**
     * Scope for accessible records (alias for withRecordRules)
     */
    public function scopeAccessible(Builder $query): Builder
    {
        return $this->scopeWithRecordRules($query, 'read');
    }

    /**
     * Check if current user can read this record
     */
    public function canRead(): bool
    {
        return app(PermissionService::class)->checkRecordAccess($this, 'read');
    }

    /**
     * Check if current user can write to this record
     */
    public function canWrite(): bool
    {
        return app(PermissionService::class)->checkRecordAccess($this, 'write');
    }

    /**
     * Check if current user can delete this record
     */
    public function canDelete(): bool
    {
        return app(PermissionService::class)->checkRecordAccess($this, 'unlink');
    }

    /**
     * Get the model's attributes including computed ones for serialization
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        // Add computed attributes
        foreach ($this->getExtendedComputed() as $key => $callback) {
            if (!isset($array[$key])) {
                $array[$key] = $callback($this);
            }
        }

        return $array;
    }

    /**
     * Get model data for API resource
     */
    public function toResourceArray(array $includes = []): array
    {
        $data = $this->toArray();

        // Include requested relationships
        foreach ($includes as $relation) {
            if ($this->relationLoaded($relation)) {
                $data[$relation] = $this->getRelation($relation);
            } elseif (method_exists($this, $relation) || $this->getExtendedRelationship($relation)) {
                $data[$relation] = $this->{$relation};
            }
        }

        return $data;
    }

    /**
     * Create a new model instance with extended fields support
     */
    public static function createWithExtensions(array $attributes): static
    {
        $instance = new static();
        $fillable = $instance->getFillable();
        
        // Filter attributes to only fillable fields
        $filtered = array_intersect_key($attributes, array_flip($fillable));
        
        return static::create($filtered);
    }

    /**
     * Update model with extended fields support
     */
    public function updateWithExtensions(array $attributes): bool
    {
        $fillable = $this->getFillable();
        
        // Filter attributes to only fillable fields
        $filtered = array_intersect_key($attributes, array_flip($fillable));
        
        return $this->update($filtered);
    }
}
