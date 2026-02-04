<?php

namespace Modules\Core\Traits;

use Modules\Core\Services\ExtensionManager;
use Illuminate\Database\Eloquent\Relations\Relation;

trait HasExtensions
{
    protected static ?string $extensionTarget = null;

    /**
     * Boot the trait
     */
    public static function bootHasExtensions(): void
    {
        // Auto-determine extension target from class name
        if (static::$extensionTarget === null) {
            $className = class_basename(static::class);
            $moduleName = static::getModuleName();
            static::$extensionTarget = strtolower($moduleName . '.' . $className);
        }
    }

    /**
     * Get the extension target identifier
     */
    public static function getExtensionTarget(): string
    {
        return static::$extensionTarget ?? strtolower(
            static::getModuleName() . '.' . class_basename(static::class)
        );
    }

    /**
     * Get the module name from namespace
     */
    protected static function getModuleName(): string
    {
        $namespace = (new \ReflectionClass(static::class))->getNamespaceName();
        $parts = explode('\\', $namespace);
        
        // Expect namespace like Modules\ModuleName\Models
        if (count($parts) >= 2 && $parts[0] === 'Modules') {
            return strtolower($parts[1]);
        }

        return 'unknown';
    }

    /**
     * Get extended fillable fields
     */
    public function getExtendedFillable(): array
    {
        return $this->getExtensionManager()
            ->getFieldRegistry()
            ->getFillable(static::getExtensionTarget());
    }

    /**
     * Get an extended relationship
     */
    public function getExtendedRelationship(string $name): ?Relation
    {
        $relationships = $this->getExtensionManager()
            ->getRelationships(static::getExtensionTarget());

        if (isset($relationships[$name])) {
            return $relationships[$name]($this);
        }

        return null;
    }

    /**
     * Get extended computed attributes
     */
    public function getExtendedComputed(): array
    {
        return $this->getExtensionManager()
            ->getComputed(static::getExtensionTarget());
    }

    /**
     * Get a computed attribute value
     */
    public function getComputedAttribute(string $key)
    {
        $computed = $this->getExtendedComputed();

        if (isset($computed[$key])) {
            return $computed[$key]($this);
        }

        return null;
    }

    /**
     * Get extended validation rules
     */
    public function getExtendedValidation(): array
    {
        return $this->getExtensionManager()
            ->getValidation(static::getExtensionTarget());
    }

    /**
     * Get extension manager instance
     */
    protected function getExtensionManager(): ExtensionManager
    {
        return app(ExtensionManager::class);
    }

    /**
     * Override getFillable to include extended fields
     */
    public function getFillable(): array
    {
        return array_merge(
            parent::getFillable(),
            $this->getExtendedFillable()
        );
    }

    /**
     * Override __call to handle extended relationships
     */
    public function __call($method, $parameters)
    {
        // Check for extended relationship
        $relationship = $this->getExtendedRelationship($method);
        if ($relationship !== null) {
            return $relationship;
        }

        // Check for extended scope
        if (str_starts_with($method, 'scope')) {
            $scopeName = lcfirst(substr($method, 5));
            $scopes = $this->getExtensionManager()
                ->getScopes(static::getExtensionTarget());
            
            if (isset($scopes[$scopeName])) {
                return $scopes[$scopeName]($this->newQuery(), ...$parameters);
            }
        }

        return parent::__call($method, $parameters);
    }

    /**
     * Override getAttribute to handle computed attributes
     */
    public function getAttribute($key)
    {
        // First try parent implementation
        $value = parent::getAttribute($key);
        
        if ($value !== null) {
            return $value;
        }

        // Then check computed attributes
        return $this->getComputedAttribute($key);
    }

    /**
     * Check if model has extended field
     */
    public function hasExtendedField(string $field): bool
    {
        return in_array($field, $this->getExtendedFillable());
    }

    /**
     * Get all validation rules (base + extended)
     */
    public function getAllValidationRules(): array
    {
        $baseRules = method_exists($this, 'rules') ? $this->rules() : [];
        return array_merge($baseRules, $this->getExtendedValidation());
    }
}
