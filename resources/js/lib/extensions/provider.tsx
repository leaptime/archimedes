import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    useMemo,
    ReactNode 
} from 'react';
import { staticRegistry } from './registry';
import { 
    ExtensionManifest, 
    ExtensionComponent, 
    ExtensionFieldDef, 
    ExtensionStats,
    RegisteredExtension,
    SlotContext,
} from './types';

interface ExtensionContextValue {
    // Extension data
    extensions: ExtensionManifest[];
    stats: ExtensionStats | null;
    
    // Loading state
    loading: boolean;
    error: string | null;
    
    // Actions
    refresh: () => Promise<void>;
    
    // Slot queries
    getSlotExtensions: (slot: string) => ExtensionComponent[];
    hasSlotExtensions: (slot: string) => boolean;
    
    // Field queries
    getModelFields: (model: string) => ExtensionFieldDef[];
    hasModelFields: (model: string) => boolean;
}

const ExtensionContext = createContext<ExtensionContextValue | null>(null);

interface UnifiedExtensionProviderProps {
    children: ReactNode;
}

/**
 * Unified Extension Provider
 * 
 * Combines static (bundled) and dynamic (API) extensions into one system.
 * Place at the root of your app, after authentication.
 */
export function UnifiedExtensionProvider({ children }: UnifiedExtensionProviderProps) {
    // API-loaded extension data
    const [extensions, setExtensions] = useState<ExtensionManifest[]>([]);
    const [dynamicSlots, setDynamicSlots] = useState<Record<string, RegisteredExtension[]>>({});
    const [fields, setFields] = useState<Record<string, ExtensionFieldDef[]>>({});
    const [stats, setStats] = useState<ExtensionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Static registry version (triggers re-render on changes)
    const [staticVersion, setStaticVersion] = useState(0);

    // Subscribe to static registry changes
    useEffect(() => {
        return staticRegistry.subscribe(() => {
            setStaticVersion(v => v + 1);
        });
    }, []);

    // Fetch plugin data from API
    const fetchExtensions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [extResponse, slotsResponse, fieldsResponse] = await Promise.all([
                fetch('/api/plugins'),
                fetch('/api/plugins/slots'),
                fetch('/api/plugins/fields'),
            ]);

            if (!extResponse.ok || !slotsResponse.ok || !fieldsResponse.ok) {
                throw new Error('Failed to fetch plugin data');
            }

            const extData = await extResponse.json();
            const slotsData = await slotsResponse.json();
            const fieldsData = await fieldsResponse.json();

            setExtensions(extData.data || []);
            setStats(extData.meta || null);
            setDynamicSlots(slotsData.data || {});
            setFields(fieldsData.data || {});
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            console.error('[Plugins] Failed to load:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load extensions on mount
    useEffect(() => {
        fetchExtensions();
    }, [fetchExtensions]);

    // Get extensions for a slot (combines static + dynamic)
    const getSlotExtensions = useCallback((slot: string): ExtensionComponent[] => {
        const result: ExtensionComponent[] = [];

        // Add static extensions
        const staticExts = staticRegistry.getExtensions(slot);
        result.push(...staticExts);

        // Add dynamic plugins (convert to ExtensionComponent)
        const dynamicExts = dynamicSlots[slot] || [];
        for (const ext of dynamicExts) {
            // Try to get pre-registered component
            const pluginId = ext.pluginId || ext.extensionId; // Support both new and legacy
            const component = staticRegistry.getComponent(pluginId, ext.component);
            
            if (component) {
                result.push({
                    id: `${pluginId}-${ext.component}`,
                    component,
                    priority: ext.priority,
                    source: 'dynamic',
                    extensionId: pluginId,
                    trustLevel: ext.trustLevel,
                });
            }
        }

        // Sort by priority
        return result.sort((a, b) => a.priority - b.priority);
    }, [dynamicSlots, staticVersion]);

    // Check if slot has extensions
    const hasSlotExtensions = useCallback((slot: string): boolean => {
        return getSlotExtensions(slot).length > 0;
    }, [getSlotExtensions]);

    // Get custom fields for a model
    const getModelFields = useCallback((model: string): ExtensionFieldDef[] => {
        return fields[model] || [];
    }, [fields]);

    // Check if model has custom fields
    const hasModelFields = useCallback((model: string): boolean => {
        return (fields[model]?.length || 0) > 0;
    }, [fields]);

    const value: ExtensionContextValue = useMemo(() => ({
        extensions,
        stats,
        loading,
        error,
        refresh: fetchExtensions,
        getSlotExtensions,
        hasSlotExtensions,
        getModelFields,
        hasModelFields,
    }), [
        extensions,
        stats,
        loading,
        error,
        fetchExtensions,
        getSlotExtensions,
        hasSlotExtensions,
        getModelFields,
        hasModelFields,
    ]);

    return (
        <ExtensionContext.Provider value={value}>
            {children}
        </ExtensionContext.Provider>
    );
}

/**
 * Hook to access the extension system
 */
export function useExtensions(): ExtensionContextValue {
    const context = useContext(ExtensionContext);
    
    if (!context) {
        // Return a safe default if not in provider
        return {
            extensions: [],
            stats: null,
            loading: false,
            error: null,
            refresh: async () => {},
            getSlotExtensions: () => [],
            hasSlotExtensions: () => false,
            getModelFields: () => [],
            hasModelFields: () => false,
        };
    }
    
    return context;
}

/**
 * Hook to get extensions for a specific slot
 */
export function useSlotExtensions(slot: string): {
    extensions: ExtensionComponent[];
    loading: boolean;
    hasExtensions: boolean;
} {
    const { getSlotExtensions, hasSlotExtensions, loading } = useExtensions();
    
    return {
        extensions: getSlotExtensions(slot),
        loading,
        hasExtensions: hasSlotExtensions(slot),
    };
}

/**
 * Hook to get custom fields for a model
 */
export function useModelFields(model: string): {
    fields: ExtensionFieldDef[];
    loading: boolean;
    hasFields: boolean;
} {
    const { getModelFields, hasModelFields, loading } = useExtensions();
    
    return {
        fields: getModelFields(model),
        loading,
        hasFields: hasModelFields(model),
    };
}
