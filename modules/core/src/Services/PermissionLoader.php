<?php

namespace Modules\Core\Services;

use Illuminate\Support\Facades\DB;
use Modules\Core\Models\PermissionGroup;
use Modules\Core\Models\ModelAccess;
use Modules\Core\Models\RecordRule;

class PermissionLoader
{
    protected ModuleRegistry $moduleRegistry;

    public function __construct(ModuleRegistry $moduleRegistry)
    {
        $this->moduleRegistry = $moduleRegistry;
    }

    /**
     * Load all permissions from installed modules
     */
    public function loadAll(): array
    {
        $stats = [
            'groups' => 0,
            'access_rules' => 0,
            'record_rules' => 0,
        ];

        // First load base groups
        $this->loadBaseGroups();
        $stats['groups'] += 4;

        // Load from each module
        foreach ($this->moduleRegistry->getLoadOrder() as $moduleName) {
            $module = $this->moduleRegistry->get($moduleName);
            if (!$module) continue;

            $manifest = $module['manifest'];
            $modulePath = $module['path'];

            // Load groups from manifest
            if (isset($manifest['permissions']['groups'])) {
                $stats['groups'] += $this->loadGroups($manifest['permissions']['groups'], $moduleName);
            }

            // Load access rules from manifest or CSV
            if (isset($manifest['permissions']['access'])) {
                $stats['access_rules'] += $this->loadAccessRules($manifest['permissions']['access'], $moduleName);
            }
            
            // Try loading from CSV file
            $csvPath = $modulePath . '/security/access.csv';
            if (file_exists($csvPath)) {
                $stats['access_rules'] += $this->loadAccessFromCsv($csvPath, $moduleName);
            }

            // Load record rules from manifest
            if (isset($manifest['permissions']['rules'])) {
                $stats['record_rules'] += $this->loadRecordRules($manifest['permissions']['rules'], $moduleName);
            }
        }

        return $stats;
    }

    /**
     * Load base permission groups
     */
    protected function loadBaseGroups(): void
    {
        $baseGroups = [
            [
                'identifier' => 'base.group_public',
                'name' => 'Public',
                'category' => 'base',
                'description' => 'Public/anonymous users',
            ],
            [
                'identifier' => 'base.group_portal',
                'name' => 'Portal User',
                'category' => 'base',
                'description' => 'External portal users (customers, vendors)',
            ],
            [
                'identifier' => 'base.group_user',
                'name' => 'Internal User',
                'category' => 'base',
                'description' => 'Regular internal users/employees',
            ],
            [
                'identifier' => 'base.group_system',
                'name' => 'System Administrator',
                'category' => 'base',
                'description' => 'Full system access',
                'implied' => ['base.group_user'],
            ],
        ];

        foreach ($baseGroups as $groupData) {
            $implied = $groupData['implied'] ?? [];
            unset($groupData['implied']);

            $group = PermissionGroup::updateOrCreate(
                ['identifier' => $groupData['identifier']],
                array_merge($groupData, ['module' => 'core'])
            );

            // Set up implications
            if (!empty($implied)) {
                $impliedIds = PermissionGroup::whereIn('identifier', $implied)->pluck('id');
                $group->impliedGroups()->sync($impliedIds);
            }
        }
    }

    /**
     * Load groups from manifest
     */
    protected function loadGroups(array $groups, string $moduleName): int
    {
        $count = 0;

        foreach ($groups as $groupData) {
            $implied = $groupData['implied'] ?? [];
            unset($groupData['implied']);

            $group = PermissionGroup::updateOrCreate(
                ['identifier' => $groupData['id'] ?? $groupData['identifier']],
                [
                    'name' => $groupData['name'],
                    'category' => $groupData['category'] ?? $moduleName,
                    'description' => $groupData['description'] ?? null,
                    'module' => $moduleName,
                    'active' => true,
                ]
            );

            // Set up implications
            if (!empty($implied)) {
                $impliedIds = PermissionGroup::whereIn('identifier', $implied)->pluck('id');
                $group->impliedGroups()->sync($impliedIds);
            }

            $count++;
        }

        return $count;
    }

    /**
     * Load access rules from manifest
     */
    protected function loadAccessRules(array $rules, string $moduleName): int
    {
        $count = 0;

        foreach ($rules as $model => $groupRules) {
            foreach ($groupRules as $groupId => $permissions) {
                $group = PermissionGroup::where('identifier', $groupId)->first();
                
                $identifier = "access_{$moduleName}_{$model}_{$groupId}";
                $identifier = str_replace('.', '_', $identifier);

                ModelAccess::updateOrCreate(
                    ['identifier' => $identifier],
                    [
                        'name' => "{$model} access for {$groupId}",
                        'model' => $model,
                        'group_id' => $group?->id,
                        'perm_read' => $permissions['read'] ?? $permissions[0] ?? false,
                        'perm_write' => $permissions['write'] ?? $permissions[1] ?? false,
                        'perm_create' => $permissions['create'] ?? $permissions[2] ?? false,
                        'perm_unlink' => $permissions['delete'] ?? $permissions[3] ?? false,
                        'module' => $moduleName,
                        'active' => true,
                    ]
                );

                $count++;
            }
        }

        return $count;
    }

    /**
     * Load access rules from CSV file
     */
    protected function loadAccessFromCsv(string $path, string $moduleName): int
    {
        $count = 0;
        $handle = fopen($path, 'r');
        
        if (!$handle) return 0;

        // Skip header
        $header = fgetcsv($handle);
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 7) continue;

            [$id, $name, $modelId, $groupId, $read, $write, $create, $unlink] = array_pad($row, 8, '0');

            // Convert model_id format (model_contact -> contacts.contact)
            $model = str_replace('model_', '', $modelId);
            
            // Get group
            $group = PermissionGroup::where('identifier', $groupId)->first();

            ModelAccess::updateOrCreate(
                ['identifier' => $id],
                [
                    'name' => $name,
                    'model' => $model,
                    'group_id' => $group?->id,
                    'perm_read' => (bool) (int) $read,
                    'perm_write' => (bool) (int) $write,
                    'perm_create' => (bool) (int) $create,
                    'perm_unlink' => (bool) (int) $unlink,
                    'module' => $moduleName,
                    'active' => true,
                ]
            );

            $count++;
        }

        fclose($handle);
        return $count;
    }

    /**
     * Load record rules from manifest
     */
    protected function loadRecordRules(array $rules, string $moduleName): int
    {
        $count = 0;

        foreach ($rules as $ruleData) {
            $groups = $ruleData['groups'] ?? [];
            $isGlobal = empty($groups) || ($ruleData['global'] ?? false);

            $rule = RecordRule::updateOrCreate(
                ['identifier' => $ruleData['id'] ?? $ruleData['identifier']],
                [
                    'name' => $ruleData['name'],
                    'model' => $ruleData['model'],
                    'domain' => is_array($ruleData['domain']) 
                        ? json_encode($ruleData['domain']) 
                        : $ruleData['domain'],
                    'is_global' => $isGlobal,
                    'perm_read' => in_array('read', $ruleData['operations'] ?? ['read', 'write', 'create', 'unlink']),
                    'perm_write' => in_array('write', $ruleData['operations'] ?? ['read', 'write', 'create', 'unlink']),
                    'perm_create' => in_array('create', $ruleData['operations'] ?? ['read', 'write', 'create', 'unlink']),
                    'perm_unlink' => in_array('unlink', $ruleData['operations'] ?? ['read', 'write', 'create', 'unlink']) 
                                  || in_array('delete', $ruleData['operations'] ?? []),
                    'module' => $moduleName,
                    'priority' => $ruleData['priority'] ?? 100,
                    'active' => true,
                ]
            );

            // Assign groups
            if (!$isGlobal && !empty($groups)) {
                $groupIds = PermissionGroup::whereIn('identifier', $groups)->pluck('id');
                $rule->groups()->sync($groupIds);
            }

            $count++;
        }

        return $count;
    }

    /**
     * Sync permissions for a single module
     */
    public function syncModule(string $moduleName): array
    {
        $module = $this->moduleRegistry->get($moduleName);
        if (!$module) {
            return ['error' => 'Module not found'];
        }

        $manifest = $module['manifest'];
        $stats = ['groups' => 0, 'access_rules' => 0, 'record_rules' => 0];

        if (isset($manifest['permissions']['groups'])) {
            $stats['groups'] = $this->loadGroups($manifest['permissions']['groups'], $moduleName);
        }

        if (isset($manifest['permissions']['access'])) {
            $stats['access_rules'] = $this->loadAccessRules($manifest['permissions']['access'], $moduleName);
        }

        if (isset($manifest['permissions']['rules'])) {
            $stats['record_rules'] = $this->loadRecordRules($manifest['permissions']['rules'], $moduleName);
        }

        return $stats;
    }
}
