<?php

namespace Modules\Core\Contracts;

interface ModuleInterface
{
    /**
     * Get the module name
     */
    public function getName(): string;

    /**
     * Get module dependencies
     */
    public function getDependencies(): array;

    /**
     * Boot the module
     */
    public function boot(): void;

    /**
     * Register module services
     */
    public function register(): void;
}
