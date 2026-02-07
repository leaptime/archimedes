<?php

namespace Modules\Core\Plugins;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Plugin Field Registry
 * 
 * Manages custom fields added by plugins to existing models.
 * Uses a JSON column approach for flexibility without schema changes.
 */
class PluginFieldRegistry
{
    protected PluginLoader $loader;
    protected array $fieldsByModel = [];
    protected bool $initialized = false;

    public function __construct(PluginLoader $loader)
    {
        $this->loader = $loader;
    }

    /**
     * Initialize field registry for an organization
     */
    public function initialize(?int $organizationId = null): void
    {
        if ($this->initialized) {
            return;
        }

        $this->fieldsByModel = $this->loader->getPluginFields($organizationId);
        $this->initialized = true;
    }

    /**
     * Get custom fields for a model
     */
    public function getFieldsForModel(string $modelClass): array
    {
        // Normalize model class name
        $modelName = class_basename($modelClass);
        
        return $this->fieldsByModel[$modelName] ?? [];
    }

    /**
     * Check if model has plugin fields
     */
    public function hasPluginFields(string $modelClass): bool
    {
        return !empty($this->getFieldsForModel($modelClass));
    }

    /**
     * Get field definition
     */
    public function getField(string $modelClass, string $fieldName): ?array
    {
        $fields = $this->getFieldsForModel($modelClass);
        
        foreach ($fields as $field) {
            if ($field['name'] === $fieldName) {
                return $field;
            }
        }
        
        return null;
    }

    /**
     * Validate field value against definition
     */
    public function validateFieldValue(array $fieldDef, $value): array
    {
        $errors = [];
        $type = $fieldDef['type'] ?? 'string';
        $required = $fieldDef['required'] ?? false;
        $rules = $fieldDef['validation'] ?? [];

        // Required check
        if ($required && ($value === null || $value === '')) {
            $errors[] = "Field {$fieldDef['name']} is required";
            return $errors;
        }

        // Type validation
        switch ($type) {
            case 'string':
                if ($value !== null && !is_string($value)) {
                    $errors[] = "Field {$fieldDef['name']} must be a string";
                }
                if (isset($rules['maxLength']) && strlen($value) > $rules['maxLength']) {
                    $errors[] = "Field {$fieldDef['name']} exceeds maximum length of {$rules['maxLength']}";
                }
                break;

            case 'integer':
            case 'number':
                if ($value !== null && !is_numeric($value)) {
                    $errors[] = "Field {$fieldDef['name']} must be a number";
                }
                if (isset($rules['min']) && $value < $rules['min']) {
                    $errors[] = "Field {$fieldDef['name']} must be at least {$rules['min']}";
                }
                if (isset($rules['max']) && $value > $rules['max']) {
                    $errors[] = "Field {$fieldDef['name']} must be at most {$rules['max']}";
                }
                break;

            case 'boolean':
                if ($value !== null && !is_bool($value) && !in_array($value, [0, 1, '0', '1', true, false], true)) {
                    $errors[] = "Field {$fieldDef['name']} must be a boolean";
                }
                break;

            case 'date':
                if ($value !== null && !strtotime($value)) {
                    $errors[] = "Field {$fieldDef['name']} must be a valid date";
                }
                break;

            case 'email':
                if ($value !== null && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Field {$fieldDef['name']} must be a valid email";
                }
                break;

            case 'url':
                if ($value !== null && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $errors[] = "Field {$fieldDef['name']} must be a valid URL";
                }
                break;

            case 'select':
                $options = $fieldDef['options'] ?? [];
                $validValues = array_column($options, 'value');
                if ($value !== null && !in_array($value, $validValues)) {
                    $errors[] = "Field {$fieldDef['name']} has an invalid value";
                }
                break;
        }

        // Pattern validation
        if (isset($rules['pattern']) && $value !== null) {
            if (!preg_match($rules['pattern'], $value)) {
                $errors[] = $rules['patternMessage'] ?? "Field {$fieldDef['name']} format is invalid";
            }
        }

        return $errors;
    }

    /**
     * Cast field value to proper type
     */
    public function castFieldValue(array $fieldDef, $value)
    {
        if ($value === null) {
            return null;
        }

        $type = $fieldDef['type'] ?? 'string';

        switch ($type) {
            case 'integer':
                return (int) $value;
            case 'number':
            case 'float':
            case 'decimal':
                return (float) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
            case 'array':
                return is_array($value) ? $value : json_decode($value, true);
            default:
                return (string) $value;
        }
    }

    /**
     * Get all plugin fields grouped by model for API response
     */
    public function getAllFieldDefinitions(): array
    {
        $result = [];

        foreach ($this->fieldsByModel as $model => $fields) {
            $result[$model] = array_map(function ($field) {
                return [
                    'name' => $field['name'],
                    'label' => $field['label'] ?? ucfirst($field['name']),
                    'type' => $field['type'] ?? 'string',
                    'required' => $field['required'] ?? false,
                    'options' => $field['options'] ?? null,
                    'placeholder' => $field['placeholder'] ?? null,
                    'helpText' => $field['helpText'] ?? null,
                    'pluginId' => $field['pluginId'],
                    'group' => $field['group'] ?? null,
                ];
            }, $fields);
        }

        return $result;
    }
}
