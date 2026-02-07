import { ComponentType } from 'react';
import { ExtensionComponent, SlotContext } from './types';

/**
 * Static Extension Registry
 * 
 * Manages statically registered extension components that are bundled
 * with the application. These load instantly without API calls.
 */
class StaticExtensionRegistry {
    private extensions: Map<string, ExtensionComponent[]> = new Map();
    private components: Map<string, ComponentType<SlotContext>> = new Map();
    private listeners: Set<() => void> = new Set();

    /**
     * Register a component for a slot
     */
    register(
        slot: string,
        component: ComponentType<SlotContext>,
        options: { 
            module?: string; 
            priority?: number;
            id?: string;
        } = {}
    ): () => void {
        const id = options.id || `${options.module || 'unknown'}-${Date.now()}`;
        const ext: ExtensionComponent = {
            id,
            component,
            priority: options.priority ?? 10,
            source: 'static',
            module: options.module,
        };

        const existing = this.extensions.get(slot) || [];
        const updated = [...existing, ext].sort((a, b) => a.priority - b.priority);
        this.extensions.set(slot, updated);
        
        this.notifyListeners();

        // Return unregister function
        return () => this.unregister(slot, id);
    }

    /**
     * Unregister a component
     */
    unregister(slot: string, id: string): void {
        const existing = this.extensions.get(slot) || [];
        const updated = existing.filter(e => e.id !== id);
        
        if (updated.length > 0) {
            this.extensions.set(slot, updated);
        } else {
            this.extensions.delete(slot);
        }
        
        this.notifyListeners();
    }

    /**
     * Register a component by extension ID and path (for dynamic loading)
     */
    registerComponent(
        extensionId: string,
        componentPath: string,
        component: ComponentType<SlotContext>
    ): void {
        const key = `${extensionId}:${componentPath}`;
        this.components.set(key, component);
    }

    /**
     * Get a registered component by extension ID and path
     */
    getComponent(extensionId: string, componentPath: string): ComponentType<SlotContext> | null {
        const key = `${extensionId}:${componentPath}`;
        return this.components.get(key) || null;
    }

    /**
     * Get all extensions for a slot
     */
    getExtensions(slot: string): ExtensionComponent[] {
        return this.extensions.get(slot) || [];
    }

    /**
     * Check if slot has extensions
     */
    hasExtensions(slot: string): boolean {
        return (this.extensions.get(slot)?.length || 0) > 0;
    }

    /**
     * Get all registered slots
     */
    getSlots(): string[] {
        return Array.from(this.extensions.keys());
    }

    /**
     * Subscribe to registry changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Clear all extensions (useful for testing)
     */
    clear(): void {
        this.extensions.clear();
        this.components.clear();
        this.notifyListeners();
    }
}

// Singleton instance
export const staticRegistry = new StaticExtensionRegistry();

/**
 * Register a static extension component for a slot
 * 
 * @example
 * registerExtension('contacts.form.after-email', MyComponent, {
 *   module: 'invoicing',
 *   priority: 50,
 * });
 */
export function registerExtension(
    slot: string,
    component: ComponentType<SlotContext>,
    options?: { module?: string; priority?: number; id?: string }
): () => void {
    return staticRegistry.register(slot, component, options);
}

/**
 * Register a component for dynamic loading by extension ID
 * 
 * @example
 * registerExtensionComponent(
 *   'contact-social-links',
 *   'frontend/SocialLinksForm.tsx',
 *   SocialLinksForm
 * );
 */
export function registerExtensionComponent(
    extensionId: string,
    componentPath: string,
    component: ComponentType<SlotContext>
): void {
    staticRegistry.registerComponent(extensionId, componentPath, component);
}
