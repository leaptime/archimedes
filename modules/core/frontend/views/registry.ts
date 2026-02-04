import { ViewDefinition, ViewExtension, ViewModification } from './types';

class ViewRegistryService {
    private views: Map<string, ViewDefinition> = new Map();
    private extensions: Map<string, ViewExtension[]> = new Map();
    private modifications: Map<string, ViewModification[]> = new Map();

    /**
     * Register a view
     */
    register(view: ViewDefinition): void {
        this.views.set(view.id, view);
    }

    /**
     * Get a view by ID
     */
    get(id: string): ViewDefinition | undefined {
        return this.views.get(id);
    }

    /**
     * Get view for a model and type
     */
    getForModel(model: string, type: string): ViewDefinition | undefined {
        // Find all views matching model and type
        const matching = Array.from(this.views.values())
            .filter(v => v.model === model && v.type === type)
            .sort((a, b) => (a.priority || 100) - (b.priority || 100));
        
        return matching[0];
    }

    /**
     * Get all views for a model
     */
    getAllForModel(model: string): ViewDefinition[] {
        return Array.from(this.views.values())
            .filter(v => v.model === model)
            .sort((a, b) => (a.priority || 100) - (b.priority || 100));
    }

    /**
     * Register slot content extension
     */
    registerSlotContent(extension: ViewExtension): void {
        const key = `${extension.view}:${extension.slot}`;
        const existing = this.extensions.get(key) || [];
        existing.push(extension);
        existing.sort((a, b) => a.priority - b.priority);
        this.extensions.set(key, existing);
    }

    /**
     * Get extensions for a slot
     */
    getSlotExtensions(viewId: string, slotName: string): ViewExtension[] {
        const key = `${viewId}:${slotName}`;
        return this.extensions.get(key) || [];
    }

    /**
     * Register view modification
     */
    registerModification(modification: ViewModification): void {
        const existing = this.modifications.get(modification.view) || [];
        existing.push(modification);
        this.modifications.set(modification.view, existing);
    }

    /**
     * Get modifications for a view
     */
    getModifications(viewId: string): ViewModification[] {
        return this.modifications.get(viewId) || [];
    }

    /**
     * Check if view exists
     */
    has(id: string): boolean {
        return this.views.has(id);
    }

    /**
     * Get all registered views
     */
    getAll(): ViewDefinition[] {
        return Array.from(this.views.values());
    }

    /**
     * Clear registry (for testing)
     */
    clear(): void {
        this.views.clear();
        this.extensions.clear();
        this.modifications.clear();
    }
}

// Singleton instance
export const viewRegistry = new ViewRegistryService();

// Helper functions
export function registerView(view: ViewDefinition): void {
    viewRegistry.register(view);
}

export function registerSlotContent(extension: ViewExtension): void {
    viewRegistry.registerSlotContent(extension);
}

export function registerViewModification(modification: ViewModification): void {
    viewRegistry.registerModification(modification);
}
