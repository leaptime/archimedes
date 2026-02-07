<?php

namespace Modules\Core\Plugins;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PluginController extends Controller
{
    protected PluginLoader $loader;
    protected PluginFieldRegistry $fieldRegistry;

    public function __construct(PluginLoader $loader, PluginFieldRegistry $fieldRegistry)
    {
        $this->loader = $loader;
        $this->fieldRegistry = $fieldRegistry;
    }

    /**
     * List all plugins for the current organization
     */
    public function index(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $plugins = $this->loader->getPlugins($organizationId);

        return response()->json([
            'data' => $plugins->map(fn($plugin) => $plugin->toArray())->values(),
            'meta' => $this->loader->getStats($organizationId),
        ]);
    }

    /**
     * Get a specific plugin
     */
    public function show(Request $request, string $pluginId): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $plugin = $this->loader->getPlugin($pluginId, $organizationId);

        if (!$plugin) {
            return response()->json(['message' => 'Plugin not found'], 404);
        }

        return response()->json(['data' => $plugin->toArray()]);
    }

    /**
     * Get all slots with registered components
     */
    public function slots(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $slots = $this->loader->getSlots($organizationId);

        return response()->json(['data' => $slots]);
    }

    /**
     * Get plugins for a specific slot
     */
    public function pluginsForSlot(Request $request, string $slot): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $slots = $this->loader->getSlots($organizationId);

        $slotPlugins = $slots[$slot] ?? [];

        return response()->json(['data' => $slotPlugins]);
    }

    /**
     * Get all custom fields grouped by model
     */
    public function fields(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $this->fieldRegistry->initialize($organizationId);

        return response()->json([
            'data' => $this->fieldRegistry->getAllFieldDefinitions(),
        ]);
    }

    /**
     * Get custom fields for a specific model
     */
    public function fieldsForModel(Request $request, string $model): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $this->fieldRegistry->initialize($organizationId);

        $fields = $this->fieldRegistry->getFieldsForModel($model);

        return response()->json(['data' => $fields]);
    }

    /**
     * Validate plugins
     */
    public function validate(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $results = $this->loader->validateAll($organizationId);

        $valid = array_filter($results, fn($r) => $r['isValid']);
        $invalid = array_filter($results, fn($r) => !$r['isValid']);

        return response()->json([
            'data' => $results,
            'meta' => [
                'total' => count($results),
                'valid' => count($valid),
                'invalid' => count($invalid),
            ],
        ]);
    }

    /**
     * Clear plugin cache
     */
    public function clearCache(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $this->loader->clearCache($organizationId);

        return response()->json(['message' => 'Plugin cache cleared']);
    }

    /**
     * Get plugin statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        
        return response()->json([
            'data' => $this->loader->getStats($organizationId),
        ]);
    }

    /**
     * Get plugins that extend a specific module
     */
    public function forModule(Request $request, string $moduleId): JsonResponse
    {
        $organizationId = $request->attributes->get('tenant_organization_id');
        $plugins = $this->loader->getPlugins($organizationId);

        // Filter plugins that extend this module
        $modulePlugins = $plugins->filter(function ($plugin) use ($moduleId) {
            $extends = $plugin->extends;
            foreach ($extends as $dep) {
                // Parse "contacts >= 1.0" or just "contacts"
                $moduleName = preg_replace('/\s*(>=|<=|>|<|=)\s*[\d.]+$/', '', $dep);
                if ($moduleName === $moduleId) {
                    return true;
                }
            }
            return false;
        });

        return response()->json([
            'data' => $modulePlugins->map(fn($plugin) => $plugin->toArray())->values(),
            'meta' => [
                'total' => $modulePlugins->count(),
                'module' => $moduleId,
            ],
        ]);
    }
}
