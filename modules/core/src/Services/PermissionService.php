<?php

namespace Modules\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Builder;
use Modules\Core\Models\PermissionGroup;
use Modules\Core\Models\ModelAccess;
use Modules\Core\Models\RecordRule;

class PermissionService
{
    protected ?User $user = null;
    protected array $userGroupsCache = [];
    protected array $accessCache = [];

    /**
     * Set the user context
     */
    public function forUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    /**
     * Get current user
     */
    protected function getUser(): ?User
    {
        return $this->user ?? auth()->user();
    }

    /**
     * Get all group IDs for a user (including implied groups)
     */
    public function getUserGroupIds(?User $user = null): array
    {
        $user = $user ?? $this->getUser();
        if (!$user) {
            return [];
        }

        $cacheKey = "user_groups_{$user->id}";
        
        if (isset($this->userGroupsCache[$cacheKey])) {
            return $this->userGroupsCache[$cacheKey];
        }

        // Get directly assigned groups
        $directGroups = PermissionGroup::active()
            ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
            ->get();

        // Collect all implied groups
        $allGroupIds = [];
        foreach ($directGroups as $group) {
            $allGroupIds = array_merge($allGroupIds, $group->getAllImpliedGroups());
        }

        $allGroupIds = array_unique($allGroupIds);
        $this->userGroupsCache[$cacheKey] = $allGroupIds;

        return $allGroupIds;
    }

    /**
     * Check if user belongs to a group
     */
    public function hasGroup(string $groupIdentifier, ?User $user = null): bool
    {
        $user = $user ?? $this->getUser();
        if (!$user) {
            return false;
        }

        $group = PermissionGroup::where('identifier', $groupIdentifier)->first();
        if (!$group) {
            return false;
        }

        return in_array($group->id, $this->getUserGroupIds($user));
    }

    /**
     * Check if user has any of the specified groups
     */
    public function hasAnyGroup(array $groupIdentifiers, ?User $user = null): bool
    {
        foreach ($groupIdentifiers as $identifier) {
            if ($this->hasGroup($identifier, $user)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check model-level access (ACL)
     */
    public function checkModelAccess(string $model, string $operation, ?User $user = null): bool
    {
        $user = $user ?? $this->getUser();
        
        // Super admin bypass
        if ($user && $this->isSuperAdmin($user)) {
            return true;
        }

        $groupIds = $this->getUserGroupIds($user);
        if (empty($groupIds)) {
            return false;
        }

        $cacheKey = "access_{$model}_{$operation}_" . implode('_', $groupIds);
        
        if (isset($this->accessCache[$cacheKey])) {
            return $this->accessCache[$cacheKey];
        }

        // Check if any ACL grants this permission
        $hasAccess = ModelAccess::active()
            ->forModel($model)
            ->forGroups($groupIds)
            ->get()
            ->contains(fn($access) => $access->hasPermission($operation));

        $this->accessCache[$cacheKey] = $hasAccess;
        return $hasAccess;
    }

    /**
     * Get record rules for a model and operation
     */
    public function getRecordRules(string $model, string $operation, ?User $user = null): array
    {
        $user = $user ?? $this->getUser();
        $groupIds = $this->getUserGroupIds($user);

        // Get global rules
        $globalRules = RecordRule::active()
            ->forModel($model)
            ->global()
            ->where("perm_{$operation}", true)
            ->orderBy('priority')
            ->get();

        // Get group-specific rules
        $groupRules = collect();
        if (!empty($groupIds)) {
            $groupRules = RecordRule::active()
                ->forModel($model)
                ->forGroups($groupIds)
                ->where("perm_{$operation}", true)
                ->orderBy('priority')
                ->get();
        }

        return [
            'global' => $globalRules->toArray(),
            'group' => $groupRules->toArray(),
        ];
    }

    /**
     * Apply record rules to a query builder
     */
    public function applyRecordRules(Builder $query, string $model, string $operation = 'read', ?User $user = null): Builder
    {
        $user = $user ?? $this->getUser();
        
        // Super admin bypass
        if ($user && $this->isSuperAdmin($user)) {
            return $query;
        }

        $rules = $this->getRecordRules($model, $operation, $user);
        $context = $this->buildRuleContext($user);

        // Apply global rules (AND together)
        foreach ($rules['global'] as $rule) {
            $query = $this->applyRuleDomain($query, $rule, $context);
        }

        // Apply group rules (OR together)
        if (!empty($rules['group'])) {
            $query->where(function ($q) use ($rules, $context) {
                foreach ($rules['group'] as $index => $rule) {
                    if ($index === 0) {
                        $q = $this->applyRuleDomain($q, $rule, $context, false);
                    } else {
                        $q->orWhere(function ($subQ) use ($rule, $context) {
                            $this->applyRuleDomain($subQ, $rule, $context, false);
                        });
                    }
                }
            });
        }

        return $query;
    }

    /**
     * Check if a specific record passes the rules
     */
    public function checkRecordAccess($record, string $operation, ?User $user = null): bool
    {
        $user = $user ?? $this->getUser();
        
        // Super admin bypass
        if ($user && $this->isSuperAdmin($user)) {
            return true;
        }

        $model = $this->getModelIdentifier($record);
        $rules = $this->getRecordRules($model, $operation, $user);
        $context = $this->buildRuleContext($user, $record);

        // All global rules must pass (AND)
        foreach ($rules['global'] as $rule) {
            if (!$this->evaluateRuleDomain($rule, $context)) {
                return false;
            }
        }

        // At least one group rule must pass (OR), if any exist
        if (!empty($rules['group'])) {
            $anyGroupPassed = false;
            foreach ($rules['group'] as $rule) {
                if ($this->evaluateRuleDomain($rule, $context)) {
                    $anyGroupPassed = true;
                    break;
                }
            }
            if (!$anyGroupPassed) {
                return false;
            }
        }

        return true;
    }

    /**
     * Build the context for rule evaluation
     */
    protected function buildRuleContext(?User $user, $record = null): array
    {
        $context = [
            'user' => $user ? [
                'id' => $user->id,
                'email' => $user->email,
                'company_id' => $user->company_id ?? null,
                'company_ids' => $user->company_ids ?? [$user->company_id ?? 1],
            ] : null,
        ];

        if ($record) {
            $context['record'] = $record instanceof \Illuminate\Database\Eloquent\Model
                ? $record->toArray()
                : (array) $record;
        }

        return $context;
    }

    /**
     * Apply a rule domain to a query
     */
    protected function applyRuleDomain(Builder $query, array $rule, array $context, bool $wrap = true): Builder
    {
        $domain = $rule['domain'] ?? null;
        if (empty($domain)) {
            return $query;
        }

        // Parse domain
        $parsed = json_decode($domain, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // It's an expression, need to convert to query conditions
            return $this->applyExpressionDomain($query, $domain, $context, $wrap);
        }

        // It's a structured domain (Odoo-style)
        return $this->applyStructuredDomain($query, $parsed, $context, $wrap);
    }

    /**
     * Apply structured domain (Odoo-style array format)
     */
    protected function applyStructuredDomain(Builder $query, array $domain, array $context, bool $wrap = true): Builder
    {
        $conditions = function ($q) use ($domain, $context) {
            $operator = 'AND';
            
            foreach ($domain as $item) {
                if ($item === '|') {
                    $operator = 'OR';
                    continue;
                }
                if ($item === '&') {
                    $operator = 'AND';
                    continue;
                }

                if (is_array($item) && count($item) >= 3) {
                    [$field, $op, $value] = $item;
                    
                    // Replace context variables
                    $value = $this->replaceContextVariables($value, $context);

                    $method = $operator === 'OR' ? 'orWhere' : 'where';
                    
                    switch ($op) {
                        case '=':
                            $q->$method($field, '=', $value);
                            break;
                        case '!=':
                        case '<>':
                            $q->$method($field, '!=', $value);
                            break;
                        case '>':
                        case '<':
                        case '>=':
                        case '<=':
                            $q->$method($field, $op, $value);
                            break;
                        case 'in':
                            $q->{$method . 'In'}($field, (array) $value);
                            break;
                        case 'not in':
                            $q->{$method . 'NotIn'}($field, (array) $value);
                            break;
                        case 'like':
                        case 'ilike':
                            $q->$method($field, 'LIKE', $value);
                            break;
                        case 'is':
                            if ($value === null || $value === 'null') {
                                $q->{$method . 'Null'}($field);
                            }
                            break;
                        case 'is not':
                            if ($value === null || $value === 'null') {
                                $q->{$method . 'NotNull'}($field);
                            }
                            break;
                    }

                    $operator = 'AND'; // Reset to AND after each condition
                }
            }
        };

        if ($wrap) {
            return $query->where($conditions);
        }
        
        $conditions($query);
        return $query;
    }

    /**
     * Apply expression-based domain (JavaScript-like expression)
     */
    protected function applyExpressionDomain(Builder $query, string $expression, array $context, bool $wrap = true): Builder
    {
        // Parse simple expressions and convert to query conditions
        // Examples: "record.user_id === user.id", "record.company_id in user.company_ids"
        
        // This is a simplified parser - for complex expressions, you might need a proper parser
        $expression = trim($expression);
        
        // Handle "true" - no filter
        if ($expression === 'true' || $expression === '1 === 1') {
            return $query;
        }
        
        // Handle "false" - block all
        if ($expression === 'false' || $expression === '0 === 1') {
            return $query->whereRaw('1 = 0');
        }

        // Try to parse common patterns
        if (preg_match('/record\.(\w+)\s*(===|!==|==|!=|>|<|>=|<=)\s*user\.(\w+)/', $expression, $matches)) {
            $field = $matches[1];
            $op = $matches[2];
            $userField = $matches[3];
            
            $value = $context['user'][$userField] ?? null;
            
            $sqlOp = match ($op) {
                '===', '==' => '=',
                '!==', '!=' => '!=',
                default => $op,
            };

            if ($wrap) {
                return $query->where($field, $sqlOp, $value);
            }
            $query->where($field, $sqlOp, $value);
            return $query;
        }

        // Handle "in" expressions: record.company_id in user.company_ids
        if (preg_match('/user\.company_ids\.includes\(record\.(\w+)\)/', $expression, $matches)) {
            $field = $matches[1];
            $values = $context['user']['company_ids'] ?? [];
            
            if ($wrap) {
                return $query->whereIn($field, $values);
            }
            $query->whereIn($field, $values);
            return $query;
        }

        return $query;
    }

    /**
     * Replace context variables in a value
     */
    protected function replaceContextVariables($value, array $context)
    {
        if (is_string($value)) {
            // Handle user.id, user.company_id, user.company_ids
            if (preg_match('/^user\.(\w+)$/', $value, $matches)) {
                return $context['user'][$matches[1]] ?? null;
            }
        }
        return $value;
    }

    /**
     * Evaluate a rule domain against a record
     */
    protected function evaluateRuleDomain(array $rule, array $context): bool
    {
        $domain = $rule['domain'] ?? null;
        if (empty($domain)) {
            return true;
        }

        // Parse domain
        $parsed = json_decode($domain, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // It's an expression
            return $this->evaluateExpression($domain, $context);
        }

        // It's a structured domain
        return $this->evaluateStructuredDomain($parsed, $context);
    }

    /**
     * Evaluate a structured domain against context
     */
    protected function evaluateStructuredDomain(array $domain, array $context): bool
    {
        $result = true;
        $useOr = false;

        foreach ($domain as $item) {
            if ($item === '|') {
                $useOr = true;
                continue;
            }
            if ($item === '&') {
                $useOr = false;
                continue;
            }

            if (is_array($item) && count($item) >= 3) {
                [$field, $op, $value] = $item;
                
                $recordValue = $context['record'][$field] ?? null;
                $value = $this->replaceContextVariables($value, $context);

                $conditionResult = $this->evaluateCondition($recordValue, $op, $value);

                if ($useOr) {
                    $result = $result || $conditionResult;
                } else {
                    $result = $result && $conditionResult;
                }

                $useOr = false;
            }
        }

        return $result;
    }

    /**
     * Evaluate a single condition
     */
    protected function evaluateCondition($recordValue, string $op, $value): bool
    {
        return match ($op) {
            '=' => $recordValue == $value,
            '!=' => $recordValue != $value,
            '>' => $recordValue > $value,
            '<' => $recordValue < $value,
            '>=' => $recordValue >= $value,
            '<=' => $recordValue <= $value,
            'in' => in_array($recordValue, (array) $value),
            'not in' => !in_array($recordValue, (array) $value),
            'like', 'ilike' => str_contains(strtolower($recordValue ?? ''), strtolower(str_replace('%', '', $value))),
            default => false,
        };
    }

    /**
     * Evaluate a JavaScript-like expression
     */
    protected function evaluateExpression(string $expression, array $context): bool
    {
        $expression = trim($expression);
        
        if ($expression === 'true') return true;
        if ($expression === 'false') return false;

        // Replace context variables
        $expression = preg_replace_callback('/user\.(\w+)/', function ($matches) use ($context) {
            $value = $context['user'][$matches[1]] ?? 'null';
            return is_array($value) ? json_encode($value) : var_export($value, true);
        }, $expression);

        $expression = preg_replace_callback('/record\.(\w+)/', function ($matches) use ($context) {
            $value = $context['record'][$matches[1]] ?? null;
            return is_array($value) ? json_encode($value) : var_export($value, true);
        }, $expression);

        // Convert JS operators to PHP
        $expression = str_replace('===', '==', $expression);
        $expression = str_replace('!==', '!=', $expression);
        $expression = str_replace('.includes(', ' && in_array(', $expression);

        // Safely evaluate
        try {
            return (bool) @eval("return ({$expression});");
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Get model identifier from a record
     */
    protected function getModelIdentifier($record): string
    {
        if ($record instanceof \Illuminate\Database\Eloquent\Model) {
            // Try to get from model class
            $class = get_class($record);
            if (defined("{$class}::MODEL_IDENTIFIER")) {
                return $class::MODEL_IDENTIFIER;
            }
            // Fall back to table name
            return $record->getTable();
        }
        return 'unknown';
    }

    /**
     * Check if user is super admin
     */
    protected function isSuperAdmin(?User $user): bool
    {
        if (!$user) return false;
        
        // Check for super admin flag, platform admin flag, owner role, or group
        if ($user->is_super_admin ?? false) return true;
        if ($user->is_platform_admin ?? false) return true;
        if ($user->role === 'owner') return true;
        
        return $this->hasGroup('base.group_system', $user);
    }

    /**
     * Clear caches
     */
    public function clearCache(): void
    {
        $this->userGroupsCache = [];
        $this->accessCache = [];
    }

    /**
     * Get all permissions for a user (for API response)
     */
    public function getUserPermissions(?User $user = null): array
    {
        $user = $user ?? $this->getUser();
        if (!$user) {
            return ['groups' => [], 'access' => []];
        }

        $groupIds = $this->getUserGroupIds($user);
        $groups = PermissionGroup::whereIn('id', $groupIds)->pluck('identifier')->toArray();

        // Get all model access rules for user's groups
        $accessRules = ModelAccess::active()
            ->whereIn('group_id', $groupIds)
            ->get()
            ->groupBy('model')
            ->map(function ($rules) {
                return [
                    'read' => $rules->contains(fn($r) => $r->perm_read),
                    'write' => $rules->contains(fn($r) => $r->perm_write),
                    'create' => $rules->contains(fn($r) => $r->perm_create),
                    'delete' => $rules->contains(fn($r) => $r->perm_unlink),
                ];
            })
            ->toArray();

        return [
            'groups' => $groups,
            'access' => $accessRules,
            'is_super_admin' => $this->isSuperAdmin($user),
        ];
    }
}
