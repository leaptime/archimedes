<?php

namespace Modules\Core\Plugins;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * Plugin Loader Service
 * 
 * Discovers and loads plugins from:
 * - plugins/ (L1-L3 Marketplace - global)
 * - tenants/{org_id}/plugins/ (L1-L3 Tenant-specific)
 */
class PluginLoader
{
    protected string $pluginsPath;
    protected string $tenantsPath;
    protected array $loadedPlugins = [];
    protected bool $booted = false;

    public function __construct()
    {
        $this->pluginsPath = base_path('plugins');
        $this->tenantsPath = base_path('tenants');
    }

    /**
     * Get all available plugins for a given organization
     */
    public function getPlugins(?int $organizationId = null): Collection
    {
        $cacheKey = 'plugins:' . ($organizationId ?? 'global');
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $plugins = collect();

            // Load global marketplace plugins
            $plugins = $plugins->merge($this->discoverGlobalPlugins());

            // Load tenant-specific plugins if organization provided
            if ($organizationId) {
                $plugins = $plugins->merge($this->discoverTenantPlugins($organizationId));
            }

            return $plugins;
        });
    }

    /**
     * Discover global marketplace plugins
     */
    protected function discoverGlobalPlugins(): Collection
    {
        $plugins = collect();

        if (!File::isDirectory($this->pluginsPath)) {
            return $plugins;
        }

        $directories = File::directories($this->pluginsPath);

        foreach ($directories as $dir) {
            $manifestPath = $dir . '/manifest.json';
            $manifest = PluginManifest::fromFile($manifestPath, 'global');

            if ($manifest && $manifest->isValid) {
                $plugins->put($manifest->id, $manifest);
            } elseif ($manifest) {
                Log::warning("Invalid plugin manifest", [
                    'path' => $manifestPath,
                    'errors' => $manifest->errors,
                ]);
            }
        }

        return $plugins;
    }

    /**
     * Discover tenant-specific plugins
     */
    protected function discoverTenantPlugins(int $organizationId): Collection
    {
        $plugins = collect();
        $tenantPath = $this->tenantsPath . '/' . $organizationId . '/plugins';

        if (!File::isDirectory($tenantPath)) {
            return $plugins;
        }

        $directories = File::directories($tenantPath);

        foreach ($directories as $dir) {
            $manifestPath = $dir . '/manifest.json';
            $manifest = PluginManifest::fromFile($manifestPath, 'tenant', $organizationId);

            if ($manifest && $manifest->isValid) {
                // Prefix tenant plugins to avoid ID conflicts
                $manifest->id = "tenant_{$organizationId}_{$manifest->id}";
                $plugins->put($manifest->id, $manifest);
            } elseif ($manifest) {
                Log::warning("Invalid tenant plugin manifest", [
                    'path' => $manifestPath,
                    'organizationId' => $organizationId,
                    'errors' => $manifest->errors,
                ]);
            }
        }

        return $plugins;
    }

    /**
     * Get a specific plugin by ID
     */
    public function getPlugin(string $pluginId, ?int $organizationId = null): ?PluginManifest
    {
        return $this->getPlugins($organizationId)->get($pluginId);
    }

    /**
     * Check if a plugin is enabled for an organization
     */
    public function isEnabled(string $pluginId, ?int $organizationId = null): bool
    {
        // For now, all discovered plugins are enabled
        // TODO: Add organization_plugins table to track enabled/disabled state
        return $this->getPlugin($pluginId, $organizationId) !== null;
    }

    /**
     * Get all slots registered by plugins
     */
    public function getSlots(?int $organizationId = null): array
    {
        $slots = [];

        foreach ($this->getPlugins($organizationId) as $plugin) {
            foreach ($plugin->slots as $slot) {
                $slotName = $slot['slot'];
                if (!isset($slots[$slotName])) {
                    $slots[$slotName] = [];
                }
                $slots[$slotName][] = [
                    'pluginId' => $plugin->id,
                    'component' => $slot['component'],
                    'priority' => $slot['priority'] ?? 10,
                    'props' => $slot['props'] ?? [],
                    'path' => $plugin->path,
                    'trustLevel' => $plugin->trustLevel,
                ];
            }
        }

        // Sort by priority
        foreach ($slots as &$slotItems) {
            usort($slotItems, fn($a, $b) => $a['priority'] <=> $b['priority']);
        }

        return $slots;
    }

    /**
     * Get all custom fields added by plugins
     */
    public function getPluginFields(?int $organizationId = null): array
    {
        $fields = [];

        foreach ($this->getPlugins($organizationId) as $plugin) {
            if (!$plugin->canAddFields()) {
                continue;
            }

            foreach ($plugin->fields as $field) {
                $model = $field['model'];
                if (!isset($fields[$model])) {
                    $fields[$model] = [];
                }
                $fields[$model][] = array_merge($field, [
                    'pluginId' => $plugin->id,
                    'trustLevel' => $plugin->trustLevel,
                ]);
            }
        }

        return $fields;
    }

    /**
     * Get all routes added by plugins
     */
    public function getPluginRoutes(?int $organizationId = null): array
    {
        $routes = [];

        foreach ($this->getPlugins($organizationId) as $plugin) {
            if (!$plugin->canAddRoutes()) {
                continue;
            }

            foreach ($plugin->routes as $route) {
                $routes[] = array_merge($route, [
                    'pluginId' => $plugin->id,
                    'path' => $plugin->path,
                    'trustLevel' => $plugin->trustLevel,
                ]);
            }
        }

        return $routes;
    }

    /**
     * Get all models created by plugins
     */
    public function getPluginModels(?int $organizationId = null): array
    {
        $models = [];

        foreach ($this->getPlugins($organizationId) as $plugin) {
            if (!$plugin->canCreateModels()) {
                continue;
            }

            foreach ($plugin->models as $model) {
                $models[] = array_merge($model, [
                    'pluginId' => $plugin->id,
                    'path' => $plugin->path,
                    'trustLevel' => $plugin->trustLevel,
                ]);
            }
        }

        return $models;
    }

    /**
     * Get all event listeners from plugins
     */
    public function getPluginEventListeners(?int $organizationId = null): array
    {
        $listeners = [];

        foreach ($this->getPlugins($organizationId) as $plugin) {
            if (!$plugin->hasCapability(Capability::EVENTS_LISTEN)) {
                continue;
            }

            foreach ($plugin->events as $event) {
                if ($event['type'] ?? 'listen' !== 'listen') {
                    continue;
                }
                
                $eventName = $event['event'];
                if (!isset($listeners[$eventName])) {
                    $listeners[$eventName] = [];
                }
                $listeners[$eventName][] = array_merge($event, [
                    'pluginId' => $plugin->id,
                    'path' => $plugin->path,
                ]);
            }
        }

        return $listeners;
    }

    /**
     * Clear plugin cache
     */
    public function clearCache(?int $organizationId = null): void
    {
        if ($organizationId) {
            Cache::forget('plugins:' . $organizationId);
        }
        Cache::forget('plugins:global');
    }

    /**
     * Validate all plugins
     */
    public function validateAll(?int $organizationId = null): array
    {
        $results = [];
        
        foreach ($this->getPlugins($organizationId) as $plugin) {
            $results[$plugin->id] = [
                'isValid' => $plugin->isValid,
                'errors' => $plugin->errors,
                'trustLevel' => $plugin->trustLevel,
                'scope' => $plugin->scope,
            ];
        }

        return $results;
    }

    /**
     * Get plugin statistics
     */
    public function getStats(?int $organizationId = null): array
    {
        $plugins = $this->getPlugins($organizationId);
        
        $byTrustLevel = $plugins->groupBy('trustLevel')->map->count();
        $byScope = $plugins->groupBy('scope')->map->count();
        
        return [
            'total' => $plugins->count(),
            'byTrustLevel' => $byTrustLevel->toArray(),
            'byScope' => $byScope->toArray(),
            'slots' => count($this->getSlots($organizationId)),
            'customFields' => array_sum(array_map('count', $this->getPluginFields($organizationId))),
            'customRoutes' => count($this->getPluginRoutes($organizationId)),
        ];
    }
}
