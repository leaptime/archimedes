<?php

namespace Modules\Core\Plugins;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Event;

class PluginServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        $this->app->singleton(PluginLoader::class, function ($app) {
            return new PluginLoader();
        });

        $this->app->singleton(PluginFieldRegistry::class, function ($app) {
            return new PluginFieldRegistry($app->make(PluginLoader::class));
        });
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        // Register plugin routes
        $this->registerPluginRoutes();

        // Register plugin event listeners
        $this->registerPluginEvents();

        // Register plugin fields (dynamic model attributes)
        $this->registerPluginFields();
    }

    /**
     * Register routes from plugins
     */
    protected function registerPluginRoutes(): void
    {
        $loader = $this->app->make(PluginLoader::class);
        $organizationId = $this->getCurrentOrganizationId();
        
        $routes = $loader->getPluginRoutes($organizationId);

        foreach ($routes as $route) {
            $method = strtolower($route['method'] ?? 'get');
            $uri = $route['uri'];
            $handler = $route['handler'];
            $middleware = $route['middleware'] ?? [];
            $pluginPath = $route['path'];

            // Resolve handler (could be closure file or controller)
            if (is_string($handler) && file_exists($pluginPath . '/' . $handler)) {
                $handler = require $pluginPath . '/' . $handler;
            }

            // Add plugin prefix to avoid conflicts
            $uri = 'plugins/' . $route['pluginId'] . '/' . ltrim($uri, '/');

            Route::middleware(['web', 'auth.session', ...$middleware])
                ->prefix('api')
                ->{$method}($uri, $handler);
        }
    }

    /**
     * Register event listeners from plugins
     */
    protected function registerPluginEvents(): void
    {
        $loader = $this->app->make(PluginLoader::class);
        $organizationId = $this->getCurrentOrganizationId();
        
        $listeners = $loader->getPluginEventListeners($organizationId);

        foreach ($listeners as $eventName => $eventListeners) {
            foreach ($eventListeners as $listener) {
                $handler = $listener['handler'];
                $pluginPath = $listener['path'];

                // Resolve handler
                if (is_string($handler) && file_exists($pluginPath . '/' . $handler)) {
                    $handler = require $pluginPath . '/' . $handler;
                }

                if (is_callable($handler)) {
                    Event::listen($eventName, $handler);
                }
            }
        }
    }

    /**
     * Register custom fields from plugins
     */
    protected function registerPluginFields(): void
    {
        // This is handled by PluginFieldRegistry which hooks into models
    }

    /**
     * Get current organization ID from request context
     */
    protected function getCurrentOrganizationId(): ?int
    {
        // During boot, we might not have request context
        // Return null for global plugins only
        if (!$this->app->runningInConsole() && $this->app->bound('request')) {
            $request = $this->app->make('request');
            return $request->attributes->get('tenant_organization_id');
        }
        
        return null;
    }
}
