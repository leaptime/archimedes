import { WidgetDefinition } from './types';

class WidgetRegistryService {
    private widgets: Map<string, WidgetDefinition> = new Map();
    private typeDefaults: Map<string, string> = new Map();

    /**
     * Register a widget
     */
    register(name: string, widget: WidgetDefinition): void {
        this.widgets.set(name, widget);
        
        // Register as default for types if specified
        if (widget.defaultFor) {
            for (const type of widget.defaultFor) {
                if (!this.typeDefaults.has(type)) {
                    this.typeDefaults.set(type, name);
                }
            }
        }
    }

    /**
     * Get a widget by name
     */
    get(name: string): WidgetDefinition | undefined {
        return this.widgets.get(name);
    }

    /**
     * Get widget for a field type
     */
    getForType(type: string): WidgetDefinition | undefined {
        const defaultWidget = this.typeDefaults.get(type);
        if (defaultWidget) {
            return this.widgets.get(defaultWidget);
        }
        // Fallback to char widget
        return this.widgets.get('char');
    }

    /**
     * Resolve widget - by name or by field type
     */
    resolve(widgetName?: string, fieldType?: string): WidgetDefinition | undefined {
        if (widgetName) {
            const widget = this.get(widgetName);
            if (widget) return widget;
            console.warn(`Widget "${widgetName}" not found, falling back to type default`);
        }
        
        if (fieldType) {
            return this.getForType(fieldType);
        }
        
        return this.get('char');
    }

    /**
     * Get all widgets
     */
    getAll(): Map<string, WidgetDefinition> {
        return new Map(this.widgets);
    }

    /**
     * Get widgets that support a specific type
     */
    getForSupportedType(type: string): WidgetDefinition[] {
        return Array.from(this.widgets.values())
            .filter(w => w.supportedTypes.includes(type) || w.supportedTypes.includes('*'));
    }

    /**
     * Check if widget exists
     */
    has(name: string): boolean {
        return this.widgets.has(name);
    }

    /**
     * Clear registry (for testing)
     */
    clear(): void {
        this.widgets.clear();
        this.typeDefaults.clear();
    }
}

// Singleton instance
export const widgetRegistry = new WidgetRegistryService();

// Helper function
export function registerWidget(name: string, widget: WidgetDefinition): void {
    widgetRegistry.register(name, widget);
}
