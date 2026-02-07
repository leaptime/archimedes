<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Core\Services\ModuleRegistry;
use Modules\Core\Services\ModuleValidator;
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

        // Cache module detail for 5 minutes (300 seconds)
        $cacheKey = "module_detail:{$moduleName}";
        $cacheTTL = 300;

        $data = cache()->remember($cacheKey, $cacheTTL, function () use ($module, $moduleName) {
            return $this->buildModuleDetail($module, $moduleName);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Build the full module detail array (cacheable)
     */
    protected function buildModuleDetail(array $module, string $moduleName): array
    {
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

        // Get frontend pages and slots in new format
        $frontendData = $this->getFrontendData($manifest);

        return [
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
            'api' => $this->getModuleApiRoutes($moduleName),
            'ui' => $uiComponents,
            'tests' => $this->getModuleTests($moduleName, $module['path']),
            'frontend' => $frontendData,
        ];
    }

    /**
     * Clear module detail cache
     */
    public function clearCache(string $moduleName): JsonResponse
    {
        cache()->forget("module_detail:{$moduleName}");
        return response()->json(['message' => 'Cache cleared']);
    }

    /**
     * Get frontend data (pages, slots) from manifest
     */
    protected function getFrontendData(array $manifest): array
    {
        $pages = [];
        $slots = [];

        $manifestPages = $manifest['frontend']['pages'] ?? [];
        
        // Check if it's the new array format
        if (!empty($manifestPages)) {
            $firstPage = reset($manifestPages);
            if (is_array($firstPage) && isset($firstPage['id'])) {
                // New format: array of page objects with layout info
                $pages = $manifestPages;
            } else {
                // Old format: convert to new format
                foreach ($manifestPages as $route => $pagePath) {
                    $pages[] = [
                        'id' => basename($pagePath, '.tsx'),
                        'path' => $route,
                        'title' => ucwords(str_replace(['-', '_'], ' ', basename($pagePath, '.tsx'))),
                        'component' => $pagePath,
                        'template' => 'generic',
                        'layout' => ['regions' => []],
                    ];
                }
            }
        }

        // Get slots (new format)
        $slots = $manifest['frontend']['slots'] ?? [];

        // If no slots but has extensionPoints (old format), convert
        if (empty($slots) && !empty($manifest['frontend']['extensionPoints'])) {
            foreach ($manifest['frontend']['extensionPoints'] as $name => $config) {
                $slots[] = [
                    'id' => $name,
                    'description' => $config['description'] ?? null,
                    'region' => $config['type'] ?? 'generic',
                ];
            }
        }

        return [
            'pages' => $pages,
            'slots' => $slots,
        ];
    }

    /**
     * Get API routes for a module
     */
    protected function getModuleApiRoutes(string $moduleName): array
    {
        $routes = [];
        $allRoutes = \Illuminate\Support\Facades\Route::getRoutes();

        // Module namespace patterns to match
        $namespacePatterns = [
            "Modules\\" . ucfirst($moduleName),
            "Modules\\" . strtoupper($moduleName),
            "Modules\\" . $moduleName,
        ];

        foreach ($allRoutes as $route) {
            $action = $route->getAction();
            $controller = $action['controller'] ?? null;

            if (!$controller) {
                continue;
            }

            // Check if this route belongs to the module
            $belongsToModule = false;
            foreach ($namespacePatterns as $pattern) {
                if (str_contains($controller, $pattern)) {
                    $belongsToModule = true;
                    break;
                }
            }

            if (!$belongsToModule) {
                continue;
            }

            // Extract controller and method
            $controllerParts = explode('@', $controller);
            $controllerClass = $controllerParts[0] ?? '';
            $method = $controllerParts[1] ?? 'index';

            // Get short controller name
            $shortController = class_basename($controllerClass);

            // Get middleware
            $middleware = $route->middleware();
            $hasAuth = in_array('auth', $middleware) || in_array('auth', $middleware);
            $modelAccess = null;
            foreach ($middleware as $mw) {
                if (str_starts_with($mw, 'model.access:')) {
                    $modelAccess = str_replace('model.access:', '', $mw);
                    break;
                }
            }

            $routes[] = [
                'method' => implode('|', $route->methods()),
                'uri' => '/' . $route->uri(),
                'name' => $route->getName(),
                'controller' => $shortController,
                'action' => $method,
                'authenticated' => $hasAuth,
                'modelAccess' => $modelAccess,
            ];
        }

        // Sort by URI
        usort($routes, fn($a, $b) => strcmp($a['uri'], $b['uri']));

        return $routes;
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
        $seenTests = [];

        // Match all test names in the file (each test is counted once)
        preg_match_all('/test\s*\(\s*[\'"]([^\'"]+)[\'"]/', $content, $allTests);
        $uniqueTests = array_values(array_unique($allTests[1] ?? []));

        // Match test.describe blocks to get suite names
        preg_match_all('/test\.describe\s*\(\s*[\'"]([^\'"]+)[\'"]/', $content, $describes);
        $suiteNames = array_values(array_unique($describes[1] ?? []));
        
        if (!empty($suiteNames)) {
            // If we have describe blocks, group tests by their approximate position
            // For simplicity, we'll distribute tests among suites or put them in a single suite
            // A more accurate approach would need full AST parsing
            
            // Just create one suite per unique describe name with the tests listed once
            foreach ($suiteNames as $suiteName) {
                $suites[] = [
                    'name' => $suiteName,
                    'tests' => [], // We'll list tests separately to avoid counting multiple times
                ];
            }
            
            // Put all unique tests in a summary suite
            if (!empty($uniqueTests)) {
                $suites = [[
                    'name' => 'All Tests',
                    'tests' => $uniqueTests,
                ]];
            }
        } else {
            // No describes, put all tests in default suite
            if (!empty($uniqueTests)) {
                $suites[] = [
                    'name' => 'Default',
                    'tests' => $uniqueTests,
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
                
                // Skip abstract classes
                if ($reflection->isAbstract()) {
                    continue;
                }
                
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
            'extensionPoints' => [],
        ];

        // First, get pages and extension points from manifest
        $module = $this->moduleRegistry->get($moduleName);
        if ($module) {
            $manifest = $module['manifest'];
            
            // Get pages from manifest (supports both old object format and new array format)
            $manifestPages = $manifest['frontend']['pages'] ?? [];
            if (is_array($manifestPages) && !empty($manifestPages)) {
                // Check if it's the new array format (has 'id' key in first element)
                $firstPage = reset($manifestPages);
                if (is_array($firstPage) && isset($firstPage['id'])) {
                    // New format: array of page objects
                    foreach ($manifestPages as $page) {
                        $components['pages'][] = [
                            'name' => $page['title'] ?? $page['id'],
                            'type' => 'page',
                            'route' => $page['path'] ?? '',
                            'path' => $page['component'] ?? '',
                            'template' => $page['template'] ?? null,
                            'layout' => $page['layout'] ?? null,
                            'source' => 'manifest',
                        ];
                    }
                } else {
                    // Old format: {route: pagePath}
                    foreach ($manifestPages as $route => $pagePath) {
                        $components['pages'][] = [
                            'name' => basename($pagePath, '.tsx'),
                            'type' => 'page',
                            'route' => $route,
                            'path' => $pagePath,
                            'source' => 'manifest',
                        ];
                    }
                }
            }

            // Get slots from manifest (new format)
            $manifestSlots = $manifest['frontend']['slots'] ?? [];
            foreach ($manifestSlots as $slot) {
                $components['slots'][] = [
                    'id' => $slot['id'] ?? '',
                    'description' => $slot['description'] ?? null,
                    'region' => $slot['region'] ?? null,
                ];
            }

            // Get extension points from manifest (old format, for backward compatibility)
            $extensionPoints = $manifest['frontend']['extensionPoints'] ?? [];
            foreach ($extensionPoints as $name => $config) {
                $components['extensionPoints'][] = [
                    'name' => $name,
                    'type' => $config['type'] ?? 'generic',
                    'description' => $config['description'] ?? null,
                ];
            }
        }

        $frontendPath = $path . '/frontend';
        if (!is_dir($frontendPath)) {
            // Return manifest-based components even if no frontend folder
            return array_filter($components, fn($arr) => !empty($arr));
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

        // Scan pages directory (merge with manifest pages)
        $pagesPath = $frontendPath . '/pages';
        if (is_dir($pagesPath)) {
            $scannedPages = $this->scanTypeScriptFiles($pagesPath, 'page');
            // Only add pages not already from manifest
            $existingNames = array_column($components['pages'], 'name');
            foreach ($scannedPages as $page) {
                if (!in_array($page['name'], $existingNames)) {
                    $components['pages'][] = $page;
                }
            }
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

    /**
     * Get module compliance report
     */
    public function compliance(ModuleValidator $validator): JsonResponse
    {
        $report = $validator->getComplianceReport();

        return response()->json([
            'data' => $report,
        ]);
    }

    /**
     * Get compliance status for a specific module
     */
    public function moduleCompliance(string $moduleName, ModuleValidator $validator): JsonResponse
    {
        $modulePath = base_path("modules/{$moduleName}");
        
        if (!is_dir($modulePath)) {
            return response()->json([
                'message' => 'Module not found',
            ], 404);
        }

        $result = $validator->validate($modulePath);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }
}
