<?php

namespace Modules\Core\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

class ModuleRegistry
{
    protected array $modules = [];
    protected array $loadOrder = [];
    protected string $modulesPath;

    public function __construct()
    {
        $this->modulesPath = base_path('modules');
    }

    /**
     * Discover and register all modules
     */
    public function discover(): void
    {
        if (!File::isDirectory($this->modulesPath)) {
            return;
        }

        $directories = File::directories($this->modulesPath);

        foreach ($directories as $directory) {
            $manifestPath = $directory . '/manifest.json';
            
            if (File::exists($manifestPath)) {
                $manifest = json_decode(File::get($manifestPath), true);
                
                if ($manifest && isset($manifest['name'])) {
                    $this->modules[$manifest['name']] = [
                        'path' => $directory,
                        'manifest' => $manifest,
                        'loaded' => false,
                    ];
                }
            }
        }

        $this->resolveLoadOrder();
    }

    /**
     * Resolve module load order based on dependencies
     */
    protected function resolveLoadOrder(): void
    {
        $resolved = [];
        $unresolved = array_keys($this->modules);

        while (!empty($unresolved)) {
            $progress = false;

            foreach ($unresolved as $index => $moduleName) {
                $dependencies = $this->modules[$moduleName]['manifest']['depends'] ?? [];
                $canLoad = true;

                foreach ($dependencies as $dependency) {
                    if (!in_array($dependency, $resolved)) {
                        if (!isset($this->modules[$dependency])) {
                            throw new \RuntimeException(
                                "Module '{$moduleName}' depends on '{$dependency}' which is not installed."
                            );
                        }
                        $canLoad = false;
                        break;
                    }
                }

                if ($canLoad) {
                    $resolved[] = $moduleName;
                    unset($unresolved[$index]);
                    $progress = true;
                }
            }

            if (!$progress && !empty($unresolved)) {
                throw new \RuntimeException(
                    "Circular dependency detected in modules: " . implode(', ', $unresolved)
                );
            }

            $unresolved = array_values($unresolved);
        }

        $this->loadOrder = $resolved;
    }

    /**
     * Get all registered modules
     */
    public function all(): array
    {
        return $this->modules;
    }

    /**
     * Get modules in load order
     */
    public function getLoadOrder(): array
    {
        return $this->loadOrder;
    }

    /**
     * Get a specific module
     */
    public function get(string $name): ?array
    {
        return $this->modules[$name] ?? null;
    }

    /**
     * Check if a module is registered
     */
    public function has(string $name): bool
    {
        return isset($this->modules[$name]);
    }

    /**
     * Get module path
     */
    public function getPath(string $name): ?string
    {
        return $this->modules[$name]['path'] ?? null;
    }

    /**
     * Get module manifest
     */
    public function getManifest(string $name): ?array
    {
        return $this->modules[$name]['manifest'] ?? null;
    }

    /**
     * Mark module as loaded
     */
    public function markLoaded(string $name): void
    {
        if (isset($this->modules[$name])) {
            $this->modules[$name]['loaded'] = true;
        }
    }

    /**
     * Check if module is loaded
     */
    public function isLoaded(string $name): bool
    {
        return $this->modules[$name]['loaded'] ?? false;
    }

    /**
     * Get all loaded modules
     */
    public function getLoaded(): array
    {
        return array_filter($this->modules, fn($module) => $module['loaded']);
    }
}
