<?php

namespace Modules\Core\Services;

use Illuminate\Support\Facades\File;
use Modules\Core\Models\ExtendableModel;
use Modules\Core\Exceptions\ModuleValidationException;

class ModuleValidator
{
    protected array $errors = [];
    protected array $warnings = [];
    protected bool $strictMode;

    // Required manifest fields
    protected array $requiredManifestFields = [
        'name',
        'version',
        'displayName',
        'description',
    ];

    // Required manifest sections for full compliance
    protected array $requiredManifestSections = [
        'depends',
        'models',
        'frontend',
    ];

    public function __construct(bool $strictMode = false)
    {
        $this->strictMode = $strictMode;
    }

    /**
     * Validate a module at the given path
     */
    public function validate(string $modulePath): ValidationResult
    {
        $this->errors = [];
        $this->warnings = [];

        $moduleName = basename($modulePath);

        // 1. Check manifest exists
        $manifestPath = $modulePath . '/manifest.json';
        if (!File::exists($manifestPath)) {
            $this->errors[] = "Module '{$moduleName}' missing manifest.json";
            return $this->buildResult($moduleName, $modulePath);
        }

        // 2. Parse and validate manifest
        $manifest = json_decode(File::get($manifestPath), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->errors[] = "Module '{$moduleName}' has invalid JSON in manifest.json: " . json_last_error_msg();
            return $this->buildResult($moduleName, $modulePath);
        }

        // 3. Check required fields
        $this->validateRequiredFields($manifest, $moduleName);

        // 4. Check required sections (warnings if missing)
        $this->validateRequiredSections($manifest, $moduleName);

        // 5. Validate models extend ExtendableModel
        $this->validateModels($manifest, $modulePath, $moduleName);

        // 6. Validate frontend pages exist
        $this->validateFrontendPages($manifest, $modulePath, $moduleName);

        // 7. Validate extension points are declared
        $this->validateExtensionPoints($manifest, $moduleName);

        // 8. Check tests directory exists
        $this->validateTestsExist($modulePath, $moduleName);

        // 9. Validate service provider exists
        $this->validateServiceProvider($manifest, $modulePath, $moduleName);

        return $this->buildResult($moduleName, $modulePath, $manifest);
    }

    /**
     * Validate all modules in the modules directory
     */
    public function validateAll(string $modulesPath = null): array
    {
        $modulesPath = $modulesPath ?? base_path('modules');
        $results = [];

        if (!File::isDirectory($modulesPath)) {
            return $results;
        }

        foreach (File::directories($modulesPath) as $modulePath) {
            $results[basename($modulePath)] = $this->validate($modulePath);
        }

        return $results;
    }

    /**
     * Check if a module is compliant (no errors)
     */
    public function isCompliant(string $modulePath): bool
    {
        $result = $this->validate($modulePath);
        return $result->isValid();
    }

    /**
     * Get a compliance report for all modules
     */
    public function getComplianceReport(string $modulesPath = null): array
    {
        $results = $this->validateAll($modulesPath);
        
        $report = [
            'total' => count($results),
            'compliant' => 0,
            'non_compliant' => 0,
            'with_warnings' => 0,
            'modules' => [],
        ];

        foreach ($results as $name => $result) {
            $report['modules'][$name] = [
                'valid' => $result->isValid(),
                'fully_compliant' => $result->isFullyCompliant(),
                'errors' => $result->getErrors(),
                'warnings' => $result->getWarnings(),
            ];

            if ($result->isValid()) {
                $report['compliant']++;
            } else {
                $report['non_compliant']++;
            }

            if (!empty($result->getWarnings())) {
                $report['with_warnings']++;
            }
        }

        return $report;
    }

    // =========================================================================
    // VALIDATION METHODS
    // =========================================================================

    protected function validateRequiredFields(array $manifest, string $moduleName): void
    {
        foreach ($this->requiredManifestFields as $field) {
            if (empty($manifest[$field])) {
                $this->errors[] = "Module '{$moduleName}' missing required field: {$field}";
            }
        }
    }

    protected function validateRequiredSections(array $manifest, string $moduleName): void
    {
        foreach ($this->requiredManifestSections as $section) {
            if (!isset($manifest[$section])) {
                $this->warnings[] = "Module '{$moduleName}' missing recommended section: {$section}";
            }
        }
    }

    protected function validateModels(array $manifest, string $modulePath, string $moduleName): void
    {
        if (!isset($manifest['models']) || !is_array($manifest['models'])) {
            // Check if there are PHP files in src/Models that should be declared
            $modelsPath = $modulePath . '/src/Models';
            if (File::isDirectory($modelsPath)) {
                $modelFiles = File::files($modelsPath);
                if (count($modelFiles) > 0) {
                    $this->warnings[] = "Module '{$moduleName}' has models but 'models' section not declared in manifest";
                }
            }
            return;
        }

        foreach ($manifest['models'] as $modelName => $modelConfig) {
            $className = is_array($modelConfig) ? ($modelConfig['class'] ?? null) : $modelConfig;
            
            if (!$className) {
                $this->errors[] = "Module '{$moduleName}' model '{$modelName}' missing class definition";
                continue;
            }

            // Check if class exists
            if (!class_exists($className)) {
                $this->errors[] = "Module '{$moduleName}' model class not found: {$className}";
                continue;
            }

            // Check if it extends ExtendableModel
            if (!is_subclass_of($className, ExtendableModel::class)) {
                $this->errors[] = "Module '{$moduleName}' model '{$modelName}' must extend ExtendableModel";
            }
        }
    }

    protected function validateFrontendPages(array $manifest, string $modulePath, string $moduleName): void
    {
        if (!isset($manifest['frontend']['pages'])) {
            return;
        }

        $frontendBasePath = base_path('resources/js');
        $pages = $manifest['frontend']['pages'];
        
        // Check if it's the new array format
        $firstPage = reset($pages);
        $isNewFormat = is_array($firstPage) && isset($firstPage['id']);
        
        foreach ($pages as $key => $page) {
            // Determine the page path based on format
            if ($isNewFormat) {
                $pagePath = $page['component'] ?? null;
            } else {
                // Old format: {route: pagePath} or {route: {component: path}}
                $pagePath = is_array($page) ? ($page['component'] ?? $page['file'] ?? null) : $page;
            }
            
            if (!is_string($pagePath)) {
                continue; // Skip if we can't determine the path
            }
            
            // Handle both relative and pages/ prefixed paths
            $fullPath = $frontendBasePath . '/' . ltrim($pagePath, '/');
            
            // Also check without .tsx extension
            if (!File::exists($fullPath) && !File::exists($fullPath . '.tsx')) {
                $this->warnings[] = "Module '{$moduleName}' frontend page not found: {$pagePath}";
            }
        }
    }

    protected function validateExtensionPoints(array $manifest, string $moduleName): void
    {
        // Check if module declares extension points it provides
        if (!isset($manifest['frontend']['extensionPoints'])) {
            $this->warnings[] = "Module '{$moduleName}' does not declare extensionPoints in manifest";
        }
    }

    protected function validateTestsExist(string $modulePath, string $moduleName): void
    {
        $testsPath = $modulePath . '/tests';
        
        if (!File::isDirectory($testsPath)) {
            $this->warnings[] = "Module '{$moduleName}' missing tests directory";
            return;
        }

        // Check for at least one test file
        $testFiles = array_merge(
            File::glob($testsPath . '/*.spec.ts') ?: [],
            File::glob($testsPath . '/*.test.ts') ?: [],
            File::glob($testsPath . '/*.php') ?: [],
            File::glob($testsPath . '/**/*.spec.ts') ?: [],
            File::glob($testsPath . '/**/*.test.ts') ?: []
        );

        if (empty($testFiles)) {
            $this->warnings[] = "Module '{$moduleName}' has no test files";
        }
    }

    protected function validateServiceProvider(array $manifest, string $modulePath, string $moduleName): void
    {
        if (!isset($manifest['providers']) || empty($manifest['providers'])) {
            $this->warnings[] = "Module '{$moduleName}' does not declare providers in manifest";
            return;
        }

        foreach ($manifest['providers'] as $providerClass) {
            if (!class_exists($providerClass)) {
                $this->errors[] = "Module '{$moduleName}' provider class not found: {$providerClass}";
            }
        }
    }

    protected function buildResult(string $name, string $path, ?array $manifest = null): ValidationResult
    {
        return new ValidationResult(
            $name,
            $path,
            $this->errors,
            $this->warnings,
            $manifest
        );
    }
}

/**
 * Validation Result DTO
 */
class ValidationResult
{
    public function __construct(
        protected string $moduleName,
        protected string $modulePath,
        protected array $errors,
        protected array $warnings,
        protected ?array $manifest
    ) {}

    public function isValid(): bool
    {
        return empty($this->errors);
    }

    public function isFullyCompliant(): bool
    {
        return empty($this->errors) && empty($this->warnings);
    }

    public function getModuleName(): string
    {
        return $this->moduleName;
    }

    public function getModulePath(): string
    {
        return $this->modulePath;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getWarnings(): array
    {
        return $this->warnings;
    }

    public function getManifest(): ?array
    {
        return $this->manifest;
    }

    public function toArray(): array
    {
        return [
            'module' => $this->moduleName,
            'path' => $this->modulePath,
            'valid' => $this->isValid(),
            'fully_compliant' => $this->isFullyCompliant(),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
        ];
    }
}
