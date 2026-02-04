<?php

namespace Modules\Core\Services;

use Modules\Core\Contracts\ModelExtension;

class ExtensionManager
{
    protected FieldRegistry $fieldRegistry;
    protected array $extensions = [];
    protected array $relationships = [];
    protected array $computed = [];
    protected array $scopes = [];
    protected array $validation = [];

    public function __construct(FieldRegistry $fieldRegistry)
    {
        $this->fieldRegistry = $fieldRegistry;
    }

    /**
     * Register a model extension
     */
    public function register(ModelExtension $extension, string $module): void
    {
        $target = $extension->target();

        // Register fields
        $fields = $extension->fields();
        if (!empty($fields)) {
            $this->fieldRegistry->register($target, $fields, $module);
        }

        // Register relationships
        $relationships = $extension->relationships();
        if (!empty($relationships)) {
            if (!isset($this->relationships[$target])) {
                $this->relationships[$target] = [];
            }
            $this->relationships[$target] = array_merge($this->relationships[$target], $relationships);
        }

        // Register computed attributes
        $computed = $extension->computed();
        if (!empty($computed)) {
            if (!isset($this->computed[$target])) {
                $this->computed[$target] = [];
            }
            $this->computed[$target] = array_merge($this->computed[$target], $computed);
        }

        // Register scopes
        $scopes = $extension->scopes();
        if (!empty($scopes)) {
            if (!isset($this->scopes[$target])) {
                $this->scopes[$target] = [];
            }
            $this->scopes[$target] = array_merge($this->scopes[$target], $scopes);
        }

        // Register validation rules
        $validation = $extension->validation();
        if (!empty($validation)) {
            if (!isset($this->validation[$target])) {
                $this->validation[$target] = [];
            }
            $this->validation[$target] = array_merge($this->validation[$target], $validation);
        }

        // Store extension reference
        if (!isset($this->extensions[$target])) {
            $this->extensions[$target] = [];
        }
        $this->extensions[$target][$module] = $extension;
    }

    /**
     * Get relationships for a target
     */
    public function getRelationships(string $target): array
    {
        return $this->relationships[$target] ?? [];
    }

    /**
     * Get computed attributes for a target
     */
    public function getComputed(string $target): array
    {
        return $this->computed[$target] ?? [];
    }

    /**
     * Get scopes for a target
     */
    public function getScopes(string $target): array
    {
        return $this->scopes[$target] ?? [];
    }

    /**
     * Get validation rules for a target
     */
    public function getValidation(string $target): array
    {
        return $this->validation[$target] ?? [];
    }

    /**
     * Get all extensions for a target
     */
    public function getExtensions(string $target): array
    {
        return $this->extensions[$target] ?? [];
    }

    /**
     * Check if target has extensions
     */
    public function hasExtensions(string $target): bool
    {
        return !empty($this->extensions[$target]);
    }

    /**
     * Get field registry
     */
    public function getFieldRegistry(): FieldRegistry
    {
        return $this->fieldRegistry;
    }
}
