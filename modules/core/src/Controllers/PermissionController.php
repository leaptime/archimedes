<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Core\Services\PermissionService;
use Modules\Core\Services\PermissionLoader;
use Modules\Core\Models\PermissionGroup;
use Modules\Core\Models\ModelAccess;
use Modules\Core\Models\RecordRule;

class PermissionController extends Controller
{
    public function __construct(
        protected PermissionService $permissionService,
        protected PermissionLoader $permissionLoader
    ) {}

    /**
     * Get current user's permissions
     */
    public function myPermissions(): JsonResponse
    {
        $permissions = $this->permissionService->getUserPermissions();
        
        return response()->json([
            'data' => $permissions,
        ]);
    }

    /**
     * Get all groups
     */
    public function groups(): JsonResponse
    {
        $groups = PermissionGroup::active()
            ->with('impliedGroups:id,identifier,name')
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'identifier' => $g->identifier,
                'name' => $g->name,
                'module' => $g->module,
                'category' => $g->category,
                'description' => $g->description,
                'implied' => $g->impliedGroups->pluck('identifier'),
            ]);

        return response()->json(['data' => $groups]);
    }

    /**
     * Get all access rules
     */
    public function accessRules(): JsonResponse
    {
        $rules = ModelAccess::active()
            ->with('group:id,identifier,name')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'identifier' => $r->identifier,
                'name' => $r->name,
                'model' => $r->model,
                'group' => $r->group?->identifier,
                'group_name' => $r->group?->name,
                'permissions' => [
                    'read' => $r->perm_read,
                    'write' => $r->perm_write,
                    'create' => $r->perm_create,
                    'delete' => $r->perm_unlink,
                ],
                'module' => $r->module,
            ]);

        return response()->json(['data' => $rules]);
    }

    /**
     * Get all record rules
     */
    public function recordRules(): JsonResponse
    {
        $rules = RecordRule::active()
            ->with('groups:id,identifier,name')
            ->orderBy('priority')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'identifier' => $r->identifier,
                'name' => $r->name,
                'model' => $r->model,
                'domain' => $r->domain,
                'is_global' => $r->is_global,
                'groups' => $r->groups->pluck('identifier'),
                'operations' => array_filter([
                    $r->perm_read ? 'read' : null,
                    $r->perm_write ? 'write' : null,
                    $r->perm_create ? 'create' : null,
                    $r->perm_unlink ? 'delete' : null,
                ]),
                'priority' => $r->priority,
                'module' => $r->module,
            ]);

        return response()->json(['data' => $rules]);
    }

    /**
     * Check if current user has access to a model/operation
     */
    public function check(Request $request): JsonResponse
    {
        $request->validate([
            'model' => 'required|string',
            'operation' => 'required|string|in:read,write,create,delete,unlink',
        ]);

        $hasAccess = $this->permissionService->checkModelAccess(
            $request->input('model'),
            $request->input('operation')
        );

        return response()->json([
            'data' => [
                'model' => $request->input('model'),
                'operation' => $request->input('operation'),
                'allowed' => $hasAccess,
            ],
        ]);
    }

    /**
     * Check if current user has a specific group
     */
    public function hasGroup(Request $request): JsonResponse
    {
        $request->validate([
            'group' => 'required|string',
        ]);

        $hasGroup = $this->permissionService->hasGroup($request->input('group'));

        return response()->json([
            'data' => [
                'group' => $request->input('group'),
                'has_group' => $hasGroup,
            ],
        ]);
    }

    /**
     * Reload all permissions from modules
     */
    public function reload(): JsonResponse
    {
        // Check admin permission
        if (!$this->permissionService->hasGroup('base.group_system')) {
            return response()->json([
                'message' => 'Access denied',
                'error' => 'Only system administrators can reload permissions',
            ], 403);
        }

        $stats = $this->permissionLoader->loadAll();

        return response()->json([
            'message' => 'Permissions reloaded successfully',
            'data' => $stats,
        ]);
    }

    /**
     * Assign user to groups
     */
    public function assignGroups(Request $request): JsonResponse
    {
        // Check admin permission
        if (!$this->permissionService->hasGroup('base.group_system')) {
            return response()->json([
                'message' => 'Access denied',
            ], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'groups' => 'required|array',
            'groups.*' => 'string',
        ]);

        $user = \App\Models\User::findOrFail($request->input('user_id'));
        $groupIdentifiers = $request->input('groups');

        $groupIds = PermissionGroup::whereIn('identifier', $groupIdentifiers)->pluck('id');

        // Sync groups
        $user->permissionGroups()->sync($groupIds);

        // Clear cache
        $this->permissionService->clearCache();

        return response()->json([
            'message' => 'Groups assigned successfully',
            'data' => [
                'user_id' => $user->id,
                'groups' => $groupIdentifiers,
            ],
        ]);
    }

    /**
     * Get all users with their groups (admin only)
     */
    public function users(): JsonResponse
    {
        // Check admin permission
        if (!$this->permissionService->hasGroup('base.group_system')) {
            return response()->json([
                'message' => 'Access denied',
            ], 403);
        }

        $users = \App\Models\User::with('permissionGroups:id,identifier,name')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'groups' => $u->permissionGroups->pluck('identifier'),
            ]);

        return response()->json(['data' => $users]);
    }

    /**
     * Get permissions matrix for a model
     */
    public function modelMatrix(string $model): JsonResponse
    {
        $accessRules = ModelAccess::active()
            ->forModel($model)
            ->with('group:id,identifier,name')
            ->get();

        $recordRules = RecordRule::active()
            ->forModel($model)
            ->with('groups:id,identifier,name')
            ->orderBy('priority')
            ->get();

        return response()->json([
            'data' => [
                'model' => $model,
                'access' => $accessRules->map(fn($r) => [
                    'group' => $r->group?->identifier ?? 'global',
                    'group_name' => $r->group?->name ?? 'Global',
                    'read' => $r->perm_read,
                    'write' => $r->perm_write,
                    'create' => $r->perm_create,
                    'delete' => $r->perm_unlink,
                ]),
                'rules' => $recordRules->map(fn($r) => [
                    'name' => $r->name,
                    'domain' => $r->domain,
                    'is_global' => $r->is_global,
                    'groups' => $r->groups->pluck('identifier'),
                    'operations' => array_filter([
                        $r->perm_read ? 'read' : null,
                        $r->perm_write ? 'write' : null,
                        $r->perm_create ? 'create' : null,
                        $r->perm_unlink ? 'delete' : null,
                    ]),
                ]),
            ],
        ]);
    }
}
