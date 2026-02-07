import { ComponentType, ReactNode } from 'react';

/**
 * Plugin manifest from the API
 * 
 * Note: Also exported as ExtensionManifest for backward compatibility
 */
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    trustLevel: 'community' | 'verified' | 'certified' | 'core';
    capabilities: string[];
    // New field names
    extends?: string[];           // Modules this plugin extends
    slots?: SlotDef[];            // UI slots
    // Legacy field names (for backward compatibility)
    requires?: string[];          // Legacy: modules this plugin extends
    extensionPoints?: SlotDef[];  // Legacy: UI slots
    // Common fields
    fields: PluginFieldDef[];
    isValid: boolean;
    errors: Record<string, string>;
    path: string;
    scope: 'global' | 'tenant';
    organizationId?: number;
}

// Backward compatibility alias
export type ExtensionManifest = PluginManifest;

/**
 * UI slot definition from manifest
 */
export interface SlotDef {
    slot: string;
    component: string;
    priority: number;
    props?: Record<string, unknown>;
}

// Backward compatibility alias
export type ExtensionPointDef = SlotDef;

/**
 * Registered extension component
 */
export interface ExtensionComponent {
    id: string;
    component: ComponentType<SlotContext>;
    priority: number;
    source: 'static' | 'dynamic';
    module?: string;
    extensionId?: string;
    trustLevel?: string;
}

/**
 * Custom field definition from plugins
 */
export interface PluginFieldDef {
    model: string;
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: { value: string; label: string }[];
    helpText?: string;
    placeholder?: string;
    group?: string;
    validation?: Record<string, unknown>;
    pluginId?: string;
    extensionId?: string; // Legacy field name
}

// Backward compatibility alias
export type ExtensionFieldDef = PluginFieldDef;

export type FieldType = 
    | 'string' 
    | 'text' 
    | 'textarea'
    | 'integer' 
    | 'number' 
    | 'boolean' 
    | 'date' 
    | 'datetime' 
    | 'email' 
    | 'url' 
    | 'select'
    | 'json';

/**
 * Context passed to extension components
 */
export interface SlotContext {
    // Entity context (for detail/list views)
    entity?: Record<string, unknown>;
    items?: Record<string, unknown>[];
    selectedItems?: Record<string, unknown>[];
    onRefresh?: () => void;
    
    // Form context (when inside FormProvider)
    data?: Record<string, unknown>;
    setData?: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    readonly?: boolean;
    
    // Additional props from extension definition
    [key: string]: unknown;
}

/**
 * Form context value
 */
export interface FormContextValue {
    data: Record<string, unknown>;
    setData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    disabled: boolean;
    readonly: boolean;
    isDirty: boolean;
}

/**
 * Plugin statistics from API
 */
export interface PluginStats {
    total: number;
    byTrustLevel: Record<string, number>;
    byScope: Record<string, number>;
    slots: number;
    extensionPoints?: number; // Legacy
    customFields: number;
    customRoutes: number;
}

// Backward compatibility alias
export type ExtensionStats = PluginStats;

/**
 * Registered plugin from API
 */
export interface RegisteredPlugin {
    pluginId: string;
    extensionId?: string; // Legacy
    component: string;
    priority: number;
    props?: Record<string, unknown>;
    path: string;
    trustLevel: string;
}

// Backward compatibility alias
export type RegisteredExtension = RegisteredPlugin;
