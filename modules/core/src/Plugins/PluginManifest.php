<?php

namespace Modules\Core\Plugins;

use Illuminate\Support\Arr;

/**
 * Plugin Trust Levels
 * 
 * L1 (Community): UI slots, read-only API hooks
 * L2 (Verified): + Custom fields, write APIs, webhooks  
 * L3 (Certified): + Custom models, migrations, full backend
 * L4 (Core): Full system access (modules only)
 */
class TrustLevel
{
    public const COMMUNITY = 'community';   // L1
    public const VERIFIED = 'verified';     // L2
    public const CERTIFIED = 'certified';   // L3
    public const CORE = 'core';             // L4

    public const LEVELS = [
        self::COMMUNITY => 1,
        self::VERIFIED => 2,
        self::CERTIFIED => 3,
        self::CORE => 4,
    ];

    public static function getLevel(string $trustLevel): int
    {
        return self::LEVELS[$trustLevel] ?? 0;
    }

    public static function isAtLeast(string $current, string $required): bool
    {
        return self::getLevel($current) >= self::getLevel($required);
    }
}

/**
 * Plugin Capabilities
 */
class Capability
{
    // UI Capabilities (L1+)
    public const UI_SLOTS = 'ui.slots';
    public const UI_WIDGETS = 'ui.widgets';
    public const UI_PAGES = 'ui.pages';
    
    // API Capabilities
    public const API_READ = 'api.read';           // L1+
    public const API_WRITE = 'api.write';         // L2+
    public const API_ROUTES = 'api.routes';       // L2+
    public const API_WEBHOOKS = 'api.webhooks';   // L2+
    
    // Data Capabilities
    public const FIELDS_ADD = 'fields.add';       // L2+
    public const FIELDS_MODIFY = 'fields.modify'; // L3+
    public const MODELS_CREATE = 'models.create'; // L3+
    public const MIGRATIONS = 'migrations';       // L3+
    
    // System Capabilities
    public const EVENTS_LISTEN = 'events.listen'; // L2+
    public const EVENTS_EMIT = 'events.emit';     // L2+
    public const CRON_JOBS = 'cron.jobs';         // L3+
    public const QUEUE_JOBS = 'queue.jobs';       // L3+
    
    // Capability requirements by trust level
    public const LEVEL_REQUIREMENTS = [
        self::UI_SLOTS => TrustLevel::COMMUNITY,
        self::UI_WIDGETS => TrustLevel::COMMUNITY,
        self::UI_PAGES => TrustLevel::VERIFIED,
        self::API_READ => TrustLevel::COMMUNITY,
        self::API_WRITE => TrustLevel::VERIFIED,
        self::API_ROUTES => TrustLevel::VERIFIED,
        self::API_WEBHOOKS => TrustLevel::VERIFIED,
        self::FIELDS_ADD => TrustLevel::VERIFIED,
        self::FIELDS_MODIFY => TrustLevel::CERTIFIED,
        self::MODELS_CREATE => TrustLevel::CERTIFIED,
        self::MIGRATIONS => TrustLevel::CERTIFIED,
        self::EVENTS_LISTEN => TrustLevel::VERIFIED,
        self::EVENTS_EMIT => TrustLevel::VERIFIED,
        self::CRON_JOBS => TrustLevel::CERTIFIED,
        self::QUEUE_JOBS => TrustLevel::CERTIFIED,
    ];

    public static function isAllowed(string $capability, string $trustLevel): bool
    {
        $required = self::LEVEL_REQUIREMENTS[$capability] ?? TrustLevel::CORE;
        return TrustLevel::isAtLeast($trustLevel, $required);
    }

    public static function getAllowedCapabilities(string $trustLevel): array
    {
        return array_keys(array_filter(
            self::LEVEL_REQUIREMENTS,
            fn($required) => TrustLevel::isAtLeast($trustLevel, $required)
        ));
    }
}

/**
 * Plugin Manifest Parser and Validator
 */
class PluginManifest
{
    public string $id;
    public string $name;
    public string $version;
    public string $description;
    public string $author;
    public ?string $authorUrl;
    public ?string $license;
    public string $trustLevel;
    public array $extends;      // Modules this plugin extends
    public array $capabilities;
    public array $models;
    public array $fields;
    public array $slots;        // UI slots (renamed from extensionPoints)
    public array $routes;
    public array $events;
    public array $migrations;
    public ?string $icon;
    public ?string $category;
    public array $settings;
    public bool $isValid;
    public array $errors;
    public string $path;
    public string $scope; // 'global' or 'tenant'
    public ?int $organizationId;

    public function __construct(array $data, string $path, string $scope = 'global', ?int $organizationId = null)
    {
        $this->path = $path;
        $this->scope = $scope;
        $this->organizationId = $organizationId;
        $this->errors = [];
        
        $this->parse($data);
        $this->validate();
    }

    protected function parse(array $data): void
    {
        $this->id = $data['id'] ?? '';
        $this->name = $data['name'] ?? '';
        $this->version = $data['version'] ?? '1.0.0';
        $this->description = $data['description'] ?? '';
        $this->author = $data['author'] ?? 'Unknown';
        $this->authorUrl = $data['authorUrl'] ?? null;
        $this->license = $data['license'] ?? null;
        $this->trustLevel = $data['trustLevel'] ?? TrustLevel::COMMUNITY;
        $this->extends = $data['extends'] ?? $data['requires'] ?? [];  // Support both 'extends' and legacy 'requires'
        $this->capabilities = $data['capabilities'] ?? [];
        $this->models = $data['models'] ?? [];
        $this->fields = $data['fields'] ?? [];
        $this->slots = $data['slots'] ?? $data['extensionPoints'] ?? [];  // Support both 'slots' and legacy 'extensionPoints'
        $this->routes = $data['routes'] ?? [];
        $this->events = $data['events'] ?? [];
        $this->migrations = $data['migrations'] ?? [];
        $this->icon = $data['icon'] ?? null;
        $this->category = $data['category'] ?? null;
        $this->settings = $data['settings'] ?? [];
    }

    protected function validate(): void
    {
        $this->isValid = true;

        // Required fields
        if (empty($this->id)) {
            $this->addError('id', 'Plugin ID is required');
        } elseif (!preg_match('/^[a-z][a-z0-9-]*$/', $this->id)) {
            $this->addError('id', 'Plugin ID must be lowercase alphanumeric with hyphens');
        }

        if (empty($this->name)) {
            $this->addError('name', 'Plugin name is required');
        }

        if (!preg_match('/^\d+\.\d+\.\d+$/', $this->version)) {
            $this->addError('version', 'Version must be in semver format (x.y.z)');
        }

        // Validate trust level
        if (!isset(TrustLevel::LEVELS[$this->trustLevel])) {
            $this->addError('trustLevel', 'Invalid trust level: ' . $this->trustLevel);
        }

        // Validate capabilities against trust level
        foreach ($this->capabilities as $capability) {
            if (!Capability::isAllowed($capability, $this->trustLevel)) {
                $this->addError(
                    'capabilities',
                    "Capability '{$capability}' requires higher trust level than '{$this->trustLevel}'"
                );
            }
        }

        // Validate models (require certified level)
        if (!empty($this->models) && !TrustLevel::isAtLeast($this->trustLevel, TrustLevel::CERTIFIED)) {
            $this->addError('models', 'Creating models requires certified trust level');
        }

        // Validate migrations (require certified level)
        if (!empty($this->migrations) && !TrustLevel::isAtLeast($this->trustLevel, TrustLevel::CERTIFIED)) {
            $this->addError('migrations', 'Running migrations requires certified trust level');
        }

        // Validate slots
        foreach ($this->slots as $i => $slot) {
            if (empty($slot['slot'])) {
                $this->addError("slots[{$i}]", 'Slot name is required');
            }
            if (empty($slot['component'])) {
                $this->addError("slots[{$i}]", 'Slot component is required');
            }
        }

        // Validate routes (require verified level)
        if (!empty($this->routes) && !TrustLevel::isAtLeast($this->trustLevel, TrustLevel::VERIFIED)) {
            $this->addError('routes', 'Adding routes requires verified trust level');
        }

        // Validate fields (require verified level)
        if (!empty($this->fields) && !TrustLevel::isAtLeast($this->trustLevel, TrustLevel::VERIFIED)) {
            $this->addError('fields', 'Adding fields requires verified trust level');
        }
    }

    protected function addError(string $field, string $message): void
    {
        $this->isValid = false;
        $this->errors[$field] = $message;
    }

    public function hasCapability(string $capability): bool
    {
        return in_array($capability, $this->capabilities) && 
               Capability::isAllowed($capability, $this->trustLevel);
    }

    public function canCreateModels(): bool
    {
        return $this->hasCapability(Capability::MODELS_CREATE);
    }

    public function canRunMigrations(): bool
    {
        return $this->hasCapability(Capability::MIGRATIONS);
    }

    public function canAddFields(): bool
    {
        return $this->hasCapability(Capability::FIELDS_ADD);
    }

    public function canAddRoutes(): bool
    {
        return $this->hasCapability(Capability::API_ROUTES);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'version' => $this->version,
            'description' => $this->description,
            'author' => $this->author,
            'authorUrl' => $this->authorUrl,
            'license' => $this->license,
            'trustLevel' => $this->trustLevel,
            'extends' => $this->extends,
            'capabilities' => $this->capabilities,
            'models' => $this->models,
            'fields' => $this->fields,
            'slots' => $this->slots,
            'routes' => $this->routes,
            'events' => $this->events,
            'icon' => $this->icon,
            'category' => $this->category,
            'settings' => $this->settings,
            'path' => $this->path,
            'scope' => $this->scope,
            'organizationId' => $this->organizationId,
            'isValid' => $this->isValid,
            'errors' => $this->errors,
        ];
    }

    public static function fromFile(string $manifestPath, string $scope = 'global', ?int $organizationId = null): ?self
    {
        if (!file_exists($manifestPath)) {
            return null;
        }

        $content = file_get_contents($manifestPath);
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        $pluginPath = dirname($manifestPath);
        return new self($data, $pluginPath, $scope, $organizationId);
    }
}
