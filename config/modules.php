<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Modules Path
    |--------------------------------------------------------------------------
    |
    | This is the path where modules are stored. By default, this is set to
    | the `modules` directory in the base path of your Laravel application.
    |
    */
    'path' => base_path('modules'),

    /*
    |--------------------------------------------------------------------------
    | Auto-discover Modules
    |--------------------------------------------------------------------------
    |
    | When enabled, the system will automatically discover and load all
    | modules from the modules path. Set to false to manually specify
    | which modules to load.
    |
    */
    'auto_discover' => true,

    /*
    |--------------------------------------------------------------------------
    | Enabled Modules
    |--------------------------------------------------------------------------
    |
    | When auto_discover is false, only the modules listed here will be loaded.
    | Modules are loaded in the order specified (dependencies are still resolved).
    |
    */
    'enabled' => [
        'core',
        'contacts',
        'invoicing',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Module Discovery
    |--------------------------------------------------------------------------
    |
    | When enabled, module discovery results will be cached for better
    | performance in production. Run `php artisan module:clear` to clear.
    |
    */
    'cache' => env('MODULE_CACHE', false),
];
