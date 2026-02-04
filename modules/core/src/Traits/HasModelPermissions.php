<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Services\PermissionService;
use Illuminate\Http\JsonResponse;

/**
 * Trait for controllers that need permission checking.
 * Provides methods for checking model access and applying record rules.
 */
trait HasModelPermissions
{
    protected ?PermissionService $permissionService = null;
    protected ?string $modelIdentifier = null;

    /**
     * Get the permission service instance
     */
    protected function permissions(): PermissionService
    {
        if (!$this->permissionService) {
            $this->permissionService = app(PermissionService::class);
        }
        return $this->permissionService;
    }

    /**
     * Set the model identifier for this controller
     */
    protected function setModelIdentifier(string $identifier): void
    {
        $this->modelIdentifier = $identifier;
    }

    /**
     * Get the model identifier
     */
    protected function getModelIdentifier(): string
    {
        return $this->modelIdentifier ?? $this->guessModelIdentifier();
    }

    /**
     * Guess model identifier from controller name
     */
    protected function guessModelIdentifier(): string
    {
        $class = get_class($this);
        
        // Extract module and model from namespace
        // Modules\Contacts\Controllers\ContactController -> contacts.contact
        if (preg_match('/Modules\\\\(\w+)\\\\.*\\\\(\w+)Controller$/', $class, $matches)) {
            $module = strtolower($matches[1]);
            $model = strtolower($matches[2]);
            return "{$module}.{$model}";
        }
        
        return 'unknown';
    }

    /**
     * Check if user can perform operation on the model
     */
    protected function canAccess(string $operation): bool
    {
        return $this->permissions()->checkModelAccess(
            $this->getModelIdentifier(),
            $operation
        );
    }

    /**
     * Authorize an operation or return 403
     */
    protected function authorizeAccess(string $operation): ?JsonResponse
    {
        if (!$this->canAccess($operation)) {
            return response()->json([
                'message' => 'Access denied',
                'error' => "You don't have {$operation} permission on {$this->getModelIdentifier()}",
            ], 403);
        }
        return null;
    }

    /**
     * Check if user can access a specific record
     */
    protected function canAccessRecord(Model $record, string $operation): bool
    {
        return $this->permissions()->checkRecordAccess($record, $operation);
    }

    /**
     * Authorize record access or return 403
     */
    protected function authorizeRecordAccess(Model $record, string $operation): ?JsonResponse
    {
        if (!$this->canAccessRecord($record, $operation)) {
            return response()->json([
                'message' => 'Access denied',
                'error' => "You don't have {$operation} permission on this record",
            ], 403);
        }
        return null;
    }

    /**
     * Apply record rules to a query builder
     */
    protected function applyRecordRules(Builder $query, string $operation = 'read'): Builder
    {
        return $this->permissions()->applyRecordRules(
            $query,
            $this->getModelIdentifier(),
            $operation
        );
    }

    /**
     * Get a filtered query with record rules applied
     */
    protected function getFilteredQuery(string $modelClass, string $operation = 'read'): Builder
    {
        $query = $modelClass::query();
        return $this->applyRecordRules($query, $operation);
    }

    /**
     * Check if user has a specific permission group
     */
    protected function hasGroup(string $groupIdentifier): bool
    {
        return $this->permissions()->hasGroup($groupIdentifier);
    }

    /**
     * Authorize a permission group or return 403
     */
    protected function authorizeGroup(string $groupIdentifier): ?JsonResponse
    {
        if (!$this->hasGroup($groupIdentifier)) {
            return response()->json([
                'message' => 'Access denied',
                'error' => "You need the {$groupIdentifier} group for this action",
            ], 403);
        }
        return null;
    }
}
