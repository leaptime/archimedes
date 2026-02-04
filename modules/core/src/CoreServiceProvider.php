<?php

namespace Modules\Core;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use Modules\Core\Services\ModuleRegistry;
use Modules\Core\Services\FieldRegistry;
use Modules\Core\Services\ExtensionManager;
use Modules\Core\Services\PermissionService;
use Modules\Core\Services\PermissionLoader;
use Modules\Core\Contracts\ModelExtension;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register singletons
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(FieldRegistry::class);
        $this->app->singleton(ExtensionManager::class, function ($app) {
            return new ExtensionManager($app->make(FieldRegistry::class));
        });
        $this->app->singleton(PermissionService::class);
        $this->app->singleton(PermissionLoader::class, function ($app) {
            return new PermissionLoader($app->make(ModuleRegistry::class));
        });

        // Discover modules
        $this->app->make(ModuleRegistry::class)->discover();
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $moduleRegistry = $this->app->make(ModuleRegistry::class);
        $extensionManager = $this->app->make(ExtensionManager::class);

        // Load modules in dependency order
        foreach ($moduleRegistry->getLoadOrder() as $moduleName) {
            $this->loadModule($moduleName, $moduleRegistry, $extensionManager);
        }

        // Publish config
        $this->publishes([
            __DIR__ . '/../config/modules.php' => config_path('modules.php'),
        ], 'modules-config');
    }

    /**
     * Load a module
     */
    protected function loadModule(
        string $moduleName,
        ModuleRegistry $moduleRegistry,
        ExtensionManager $extensionManager
    ): void {
        $module = $moduleRegistry->get($moduleName);
        
        if (!$module) {
            return;
        }

        $manifest = $module['manifest'];
        $path = $module['path'];

        // Register PSR-4 autoloading
        if (isset($manifest['autoload']['psr-4'])) {
            foreach ($manifest['autoload']['psr-4'] as $namespace => $relativePath) {
                $this->registerAutoload($namespace, $path . '/' . $relativePath);
            }
        }

        // Register service providers
        if (isset($manifest['providers'])) {
            foreach ($manifest['providers'] as $provider) {
                if (class_exists($provider)) {
                    $this->app->register($provider);
                }
            }
        }

        // Load extensions
        if (isset($manifest['extends'])) {
            foreach ($manifest['extends'] as $target => $extensionConfig) {
                $this->loadExtension($target, $extensionConfig, $path, $moduleName, $extensionManager);
            }
        }

        // Load routes
        $this->loadModuleRoutes($manifest, $path);

        // Load migrations
        $this->loadModuleMigrations($manifest, $path);

        // Mark module as loaded
        $moduleRegistry->markLoaded($moduleName);
    }

    /**
     * Register PSR-4 autoloading for a module
     */
    protected function registerAutoload(string $namespace, string $path): void
    {
        spl_autoload_register(function ($class) use ($namespace, $path) {
            if (str_starts_with($class, $namespace)) {
                $relativePath = str_replace($namespace, '', $class);
                $relativePath = str_replace('\\', '/', $relativePath);
                $file = $path . $relativePath . '.php';
                
                if (file_exists($file)) {
                    require_once $file;
                    return true;
                }
            }
            return false;
        });
    }

    /**
     * Load module extension
     */
    protected function loadExtension(
        string $target,
        array $config,
        string $modulePath,
        string $moduleName,
        ExtensionManager $extensionManager
    ): void {
        // Load PHP extension class
        if (isset($config['fields'])) {
            $extensionFile = $modulePath . '/' . $config['fields'];
            
            if (File::exists($extensionFile)) {
                require_once $extensionFile;
                
                // Find the extension class in the file
                $classes = get_declared_classes();
                $extensionClass = null;
                
                foreach (array_reverse($classes) as $class) {
                    if (is_subclass_of($class, ModelExtension::class)) {
                        $extension = new $class();
                        if ($extension->target() === $target) {
                            $extensionManager->register($extension, $moduleName);
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Load module routes
     */
    protected function loadModuleRoutes(array $manifest, string $path): void
    {
        if (isset($manifest['routes'])) {
            if (isset($manifest['routes']['api'])) {
                $apiRoutes = $path . '/' . $manifest['routes']['api'];
                if (File::exists($apiRoutes)) {
                    $this->loadRoutesFrom($apiRoutes);
                }
            }

            if (isset($manifest['routes']['web'])) {
                $webRoutes = $path . '/' . $manifest['routes']['web'];
                if (File::exists($webRoutes)) {
                    $this->loadRoutesFrom($webRoutes);
                }
            }
        }
    }

    /**
     * Load module migrations
     */
    protected function loadModuleMigrations(array $manifest, string $path): void
    {
        $migrationsPath = isset($manifest['migrations'])
            ? $path . '/' . $manifest['migrations']
            : $path . '/database/migrations';

        if (File::isDirectory($migrationsPath)) {
            $this->loadMigrationsFrom($migrationsPath);
        }
    }
}
