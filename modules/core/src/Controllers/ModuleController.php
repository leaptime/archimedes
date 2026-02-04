<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Core\Services\ModuleRegistry;
use Modules\Core\Services\ExtensionManager;

class ModuleController extends Controller
{
    public function __construct(
        protected ModuleRegistry $moduleRegistry,
        protected ExtensionManager $extensionManager
    ) {}

    /**
     * Get all installed modules
     */
    public function index(): JsonResponse
    {
        $modules = [];

        foreach ($this->moduleRegistry->getLoadOrder() as $moduleName) {
            $module = $this->moduleRegistry->get($moduleName);
            if (!$module) continue;

            $manifest = $module['manifest'];
            
            $modules[] = [
                'id' => $moduleName,
                'name' => $manifest['displayName'] ?? ucfirst($moduleName),
                'description' => $manifest['description'] ?? '',
                'version' => $manifest['version'] ?? '1.0.0',
                'category' => $manifest['category'] ?? 'General',
                'author' => $manifest['author'] ?? 'Unknown',
                'license' => $manifest['license'] ?? 'MIT',
                'depends' => $manifest['depends'] ?? [],
                'status' => $this->moduleRegistry->isLoaded($moduleName) ? 'active' : 'inactive',
                'path' => $module['path'],
                'extends' => array_keys($manifest['extends'] ?? []),
                'permissions' => $manifest['permissions'] ?? [],
                'hasSettings' => !empty($manifest['settings']),
                'navigation' => $manifest['frontend']['navigation'] ?? null,
            ];
        }

        return response()->json([
            'data' => $modules,
            'meta' => [
                'total' => count($modules),
                'loaded' => count($this->moduleRegistry->getLoaded()),
            ],
        ]);
    }

    /**
     * Get a specific module's details
     */
    public function show(string $moduleName): JsonResponse
    {
        $module = $this->moduleRegistry->get($moduleName);

        if (!$module) {
            return response()->json([
                'message' => 'Module not found',
            ], 404);
        }

        $manifest = $module['manifest'];

        // Get extensions this module provides
        $extensions = [];
        foreach ($manifest['extends'] ?? [] as $target => $config) {
            $fields = $this->extensionManager->getFieldRegistry()->getFields($target);
            $relationships = $this->extensionManager->getRelationships($target);
            $computed = $this->extensionManager->getComputed($target);
            $scopes = $this->extensionManager->getScopes($target);

            // Format fields with widget information
            $formattedFields = [];
            foreach ($fields as $fieldName => $definition) {
                $formattedFields[$fieldName] = [
                    'name' => $fieldName,
                    'type' => $definition['type'] ?? 'string',
                    'widget' => $this->getWidgetForType($definition['type'] ?? 'string', $definition),
                    'nullable' => $definition['nullable'] ?? true,
                    'default' => $definition['default'] ?? null,
                    'label' => ucwords(str_replace('_', ' ', $fieldName)),
                    'precision' => $definition['precision'] ?? null,
                    'scale' => $definition['scale'] ?? null,
                    'max' => $definition['max'] ?? null,
                    'references' => $definition['references'] ?? null,
                ];
            }

            $extensions[$target] = [
                'fields' => $formattedFields,
                'relationships' => array_map(fn($name) => [
                    'name' => $name,
                    'type' => 'relation',
                ], array_keys($relationships)),
                'computed' => array_map(fn($name) => [
                    'name' => $name,
                    'type' => 'computed',
                    'description' => 'Dynamically calculated value',
                ], array_keys($computed)),
                'scopes' => array_map(fn($name) => [
                    'name' => $name,
                    'type' => 'scope',
                    'description' => 'Query scope filter',
                ], array_keys($scopes)),
            ];
        }

        // Get models defined by this module
        $models = $this->getModuleModels($moduleName, $module['path']);

        // Get UI components defined by this module
        $uiComponents = $this->getModuleUIComponents($moduleName, $module['path']);

        return response()->json([
            'data' => [
                'id' => $moduleName,
                'name' => $manifest['displayName'] ?? ucfirst($moduleName),
                'description' => $manifest['description'] ?? '',
                'version' => $manifest['version'] ?? '1.0.0',
                'category' => $manifest['category'] ?? 'General',
                'author' => $manifest['author'] ?? 'Unknown',
                'license' => $manifest['license'] ?? 'MIT',
                'depends' => $manifest['depends'] ?? [],
                'status' => $this->moduleRegistry->isLoaded($moduleName) ? 'active' : 'inactive',
                'path' => $module['path'],
                'extensions' => $extensions,
                'models' => $models,
                'permissions' => $manifest['permissions'] ?? [],
                'settings' => $manifest['settings'] ?? [],
                'navigation' => $manifest['frontend']['navigation'] ?? null,
                'routes' => $manifest['routes'] ?? null,
                'ui' => $uiComponents,
                'tests' => $this->getModuleTests($moduleName, $module['path']),
            ],
        ]);
    }

    /**
     * Get test information for a module
     */
    protected function getModuleTests(string $moduleName, string $path): array
    {
        $testsPath = $path . '/tests';
        $tests = [
            'files' => [],
            'suites' => [],
            'totalTests' => 0,
            'coverage' => [],
        ];

        if (!is_dir($testsPath)) {
            return $tests;
        }

        // Check for test manifest
        $manifestPath = $testsPath . '/manifest.json';
        if (file_exists($manifestPath)) {
            $manifest = json_decode(file_get_contents($manifestPath), true);
            if ($manifest && isset($manifest['tests'])) {
                return [
                    'files' => $manifest['tests']['e2e']['files'] ?? [],
                    'suites' => $manifest['tests']['e2e']['suites'] ?? [],
                    'totalTests' => $manifest['tests']['e2e']['totalTests'] ?? 0,
                    'coverage' => $manifest['coverage'] ?? [],
                ];
            }
        }

        // Auto-detect test files if no manifest
        $specFiles = glob($testsPath . '/*.spec.ts');
        foreach ($specFiles as $file) {
            $filename = basename($file);
            $tests['files'][] = $filename;
            
            // Parse spec file to extract test info
            $content = file_get_contents($file);
            $suites = $this->parseSpecFile($content);
            $tests['suites'] = array_merge($tests['suites'], $suites);
        }

        // Count total tests
        foreach ($tests['suites'] as $suite) {
            $tests['totalTests'] += count($suite['tests'] ?? []);
        }

        return $tests;
    }

    /**
     * Parse a Playwright spec file to extract test suites and tests
     */
    protected function parseSpecFile(string $content): array
    {
        $suites = [];

        // Match test.describe blocks
        preg_match_all('/test\.describe\s*\(\s*[\'"]([^\'"]+)[\'"]/', $content, $describes);
        
        foreach ($describes[1] as $suiteName) {
            $tests = [];
            
            // Find tests within this describe block
            // This is a simplified approach - might not capture nested describes perfectly
            $pattern = '/test\s*\(\s*[\'"]([^\'"]+)[\'"]/';
            preg_match_all($pattern, $content, $testMatches);
            
            if (!empty($testMatches[1])) {
                $tests = array_values(array_unique($testMatches[1]));
            }
            
            $suites[] = [
                'name' => $suiteName,
                'tests' => $tests,
            ];
        }

        // If no describes found, just get all tests
        if (empty($suites)) {
            preg_match_all('/test\s*\(\s*[\'"]([^\'"]+)[\'"]/', $content, $testMatches);
            if (!empty($testMatches[1])) {
                $suites[] = [
                    'name' => 'Default',
                    'tests' => array_values(array_unique($testMatches[1])),
                ];
            }
        }

        return $suites;
    }

    /**
     * Get widget type for a field type
     */
    protected function getWidgetForType(string $type, array $definition): string
    {
        return match ($type) {
            'string' => isset($definition['max']) && $definition['max'] > 255 ? 'textarea' : 'text',
            'text' => 'textarea',
            'integer', 'bigInteger' => 'number',
            'decimal', 'float' => 'currency',
            'boolean' => 'switch',
            'date' => 'date',
            'datetime', 'timestamp' => 'datetime',
            'json' => 'json',
            'foreignId', 'unsignedBigInteger' => 'select',
            default => 'text',
        };
    }

    /**
     * Get models defined by a module
     */
    protected function getModuleModels(string $moduleName, string $path): array
    {
        $models = [];
        $modelsPath = $path . '/src/Models';

        if (!is_dir($modelsPath)) {
            return $models;
        }

        $files = glob($modelsPath . '/*.php');
        foreach ($files as $file) {
            $className = pathinfo($file, PATHINFO_FILENAME);
            $fullClassName = "Modules\\" . ucfirst($moduleName) . "\\Models\\" . $className;
            
            if (class_exists($fullClassName)) {
                $reflection = new \ReflectionClass($fullClassName);
                
                // Get fillable fields from the model
                $instance = $reflection->newInstanceWithoutConstructor();
                $fillable = [];
                
                if ($reflection->hasProperty('fillable')) {
                    $prop = $reflection->getProperty('fillable');
                    $prop->setAccessible(true);
                    $fillable = $prop->getValue($instance) ?? [];
                }

                $models[] = [
                    'name' => $className,
                    'table' => $this->getTableName($instance, $className),
                    'fields' => $fillable,
                    'isExtendable' => $reflection->isSubclassOf(\Modules\Core\Models\ExtendableModel::class),
                ];
            }
        }

        return $models;
    }

    /**
     * Get table name from model
     */
    protected function getTableName($instance, string $className): string
    {
        if (method_exists($instance, 'getTable')) {
            try {
                return $instance->getTable();
            } catch (\Throwable $e) {
                // Fall back to convention
            }
        }
        return strtolower(\Illuminate\Support\Str::plural($className));
    }

    /**
     * Get UI components defined by a module
     */
    protected function getModuleUIComponents(string $moduleName, string $path): array
    {
        $components = [
            'views' => [],
            'widgets' => [],
            'extensions' => [],
            'layouts' => [],
            'pages' => [],
        ];

        $frontendPath = $path . '/frontend';
        if (!is_dir($frontendPath)) {
            return $components;
        }

        // Scan views directory
        $viewsPath = $frontendPath . '/views';
        if (is_dir($viewsPath)) {
            $components['views'] = $this->scanTypeScriptFiles($viewsPath, 'view');
        }

        // Scan widgets directory
        $widgetsPath = $frontendPath . '/widgets';
        if (is_dir($widgetsPath)) {
            $components['widgets'] = $this->scanTypeScriptFiles($widgetsPath, 'widget');
        }

        // Scan extensions directory (slot extensions)
        $extensionsPath = $frontendPath . '/extensions';
        if (is_dir($extensionsPath)) {
            $components['extensions'] = $this->scanTypeScriptFiles($extensionsPath, 'extension');
        }

        // Scan layout directory
        $layoutPath = $frontendPath . '/layout';
        if (is_dir($layoutPath)) {
            $components['layouts'] = $this->scanTypeScriptFiles($layoutPath, 'layout');
        }

        // Scan pages directory
        $pagesPath = $frontendPath . '/pages';
        if (is_dir($pagesPath)) {
            $components['pages'] = $this->scanTypeScriptFiles($pagesPath, 'page');
        }

        // Scan components directory
        $componentsPath = $frontendPath . '/components';
        if (is_dir($componentsPath)) {
            $components['components'] = $this->scanTypeScriptFiles($componentsPath, 'component');
        }

        // Scan hooks directory
        $hooksPath = $frontendPath . '/hooks';
        if (is_dir($hooksPath)) {
            $components['hooks'] = $this->scanTypeScriptFiles($hooksPath, 'hook');
        }

        // Scan slots directory
        $slotsPath = $frontendPath . '/slots';
        if (is_dir($slotsPath)) {
            $components['slots'] = $this->scanTypeScriptFiles($slotsPath, 'slot');
        }

        // Filter out empty arrays
        return array_filter($components, fn($arr) => !empty($arr));
    }

    /**
     * Scan TypeScript/TSX files and extract component information
     */
    protected function scanTypeScriptFiles(string $path, string $type): array
    {
        $files = [];
        $patterns = ['*.tsx', '*.ts'];

        foreach ($patterns as $pattern) {
            foreach (glob($path . '/' . $pattern) as $file) {
                $filename = pathinfo($file, PATHINFO_FILENAME);
                
                // Skip index files
                if ($filename === 'index' || $filename === 'types') {
                    continue;
                }

                $content = file_get_contents($file);
                $info = $this->parseTypeScriptFile($content, $filename, $type);
                
                if ($info) {
                    $files[] = $info;
                }
            }
        }

        // Also scan subdirectories (e.g., widgets/builtin)
        foreach (glob($path . '/*', GLOB_ONLYDIR) as $subdir) {
            $subdirName = basename($subdir);
            foreach ($patterns as $pattern) {
                foreach (glob($subdir . '/' . $pattern) as $file) {
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    
                    if ($filename === 'index' || $filename === 'types') {
                        continue;
                    }

                    $content = file_get_contents($file);
                    $info = $this->parseTypeScriptFile($content, $filename, $type);
                    
                    if ($info) {
                        $info['subdir'] = $subdirName;
                        $files[] = $info;
                    }
                }
            }
        }

        return $files;
    }

    /**
     * Parse TypeScript file to extract component information
     */
    protected function parseTypeScriptFile(string $content, string $filename, string $type): ?array
    {
        $info = [
            'name' => $filename,
            'type' => $type,
            'exports' => [],
            'registrations' => [],
        ];

        // Find exported functions/components
        preg_match_all('/export\s+(?:function|const)\s+(\w+)/', $content, $exports);
        if (!empty($exports[1])) {
            $info['exports'] = $exports[1];
        }

        // Find registerWidget calls - simpler pattern
        if (preg_match_all('/registerWidget\s*\(\s*[\'"](\w+)[\'"]/', $content, $widgetRegs)) {
            foreach ($widgetRegs[1] as $widget) {
                $info['registrations'][] = ['type' => 'widget', 'name' => $widget];
            }
        }

        // Find registerView calls - look for id in the object
        if (preg_match_all('/registerView\s*\(\s*\{[\s\S]*?id:\s*[\'"]([^\'"]+)[\'"]/', $content, $viewRegs)) {
            foreach ($viewRegs[1] as $view) {
                $info['registrations'][] = ['type' => 'view', 'id' => $view];
            }
        }

        // Find registerSlotContent calls - simpler approach
        if (preg_match_all('/registerSlotContent\s*\(\s*\{/', $content, $slotMatches, PREG_OFFSET_CAPTURE)) {
            foreach ($slotMatches[0] as $match) {
                $start = $match[1];
                $chunk = substr($content, $start, 500); // Get next 500 chars
                
                $view = '';
                $slot = '';
                
                if (preg_match('/view:\s*[\'"]([^\'"]+)[\'"]/', $chunk, $viewMatch)) {
                    $view = $viewMatch[1];
                }
                if (preg_match('/slot:\s*[\'"]([^\'"]+)[\'"]/', $chunk, $slotMatch)) {
                    $slot = $slotMatch[1];
                }
                
                if ($view && $slot) {
                    $info['registrations'][] = ['type' => 'slot', 'view' => $view, 'slot' => $slot];
                }
            }
        }

        // Find slot definitions in JSX
        if (preg_match_all('/<Slot\s+name=["\']([^"\']+)["\']/', $content, $slotDefs)) {
            $info['slots'] = array_unique($slotDefs[1]);
        }

        // Check for specific patterns
        if (str_contains($content, 'FormSheet') || str_contains($content, 'registerView')) {
            $info['isFormView'] = true;
        }
        if (str_contains($content, 'widget="') || str_contains($content, "widget='")) {
            $info['usesWidgets'] = true;
        }

        // Only return if we found something meaningful
        if (!empty($info['exports']) || !empty($info['registrations']) || !empty($info['slots'])) {
            return $info;
        }

        return null;
    }

    /**
     * Get module statistics
     */
    public function stats(): JsonResponse
    {
        $modules = $this->moduleRegistry->all();
        $loaded = $this->moduleRegistry->getLoaded();

        $byCategory = [];
        foreach ($modules as $name => $module) {
            $category = $module['manifest']['category'] ?? 'General';
            $byCategory[$category] = ($byCategory[$category] ?? 0) + 1;
        }

        return response()->json([
            'data' => [
                'total' => count($modules),
                'active' => count($loaded),
                'inactive' => count($modules) - count($loaded),
                'byCategory' => $byCategory,
            ],
        ]);
    }
}
