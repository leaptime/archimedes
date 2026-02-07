import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import React from 'react';

// Types for extension data from API
export interface ExtensionManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    trustLevel: 'community' | 'verified' | 'certified' | 'core';
    capabilities: string[];
    extensionPoints: ExtensionPointDef[];
    fields: ExtensionFieldDef[];
    isValid: boolean;
    errors: Record<string, string>;
    path: string;
    scope: 'global' | 'tenant';
    organizationId?: number;
}

export interface ExtensionPointDef {
    slot: string;
    component: string;
    priority: number;
    props?: Record<string, any>;
}

export interface ExtensionFieldDef {
    model: string;
    name: string;
    label: string;
    type: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    helpText?: string;
    group?: string;
    validation?: Record<string, any>;
}

export interface ExtensionStats {
    total: number;
    byTrustLevel: Record<string, number>;
    byScope: Record<string, number>;
    extensionPoints: number;
    customFields: number;
    customRoutes: number;
}

// Registered component for a slot
export interface RegisteredExtension {
    extensionId: string;
    component: string;
    priority: number;
    props?: Record<string, any>;
    path: string;
    trustLevel: string;
}

// Context for extension data
interface ExtensionContextType {
    extensions: ExtensionManifest[];
    extensionPoints: Record<string, RegisteredExtension[]>;
    fields: Record<string, ExtensionFieldDef[]>;
    stats: ExtensionStats | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    getFieldsForModel: (model: string) => ExtensionFieldDef[];
    getExtensionsForSlot: (slot: string) => RegisteredExtension[];
}

const ExtensionContext = createContext<ExtensionContextType | null>(null);

/**
 * Extension Provider that fetches and manages extension data
 */
export function ExtensionDataProvider({ children }: { children: ReactNode }) {
    const [extensions, setExtensions] = useState<ExtensionManifest[]>([]);
    const [extensionPoints, setExtensionPoints] = useState<Record<string, RegisteredExtension[]>>({});
    const [fields, setFields] = useState<Record<string, ExtensionFieldDef[]>>({});
    const [stats, setStats] = useState<ExtensionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExtensions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [extResponse, epsResponse, fieldsResponse] = await Promise.all([
                fetch('/api/extensions'),
                fetch('/api/extensions/extension-points'),
                fetch('/api/extensions/fields'),
            ]);

            if (!extResponse.ok || !epsResponse.ok || !fieldsResponse.ok) {
                throw new Error('Failed to fetch extension data');
            }

            const extData = await extResponse.json();
            const epsData = await epsResponse.json();
            const fieldsData = await fieldsResponse.json();

            setExtensions(extData.data || []);
            setStats(extData.meta || null);
            setExtensionPoints(epsData.data || {});
            setFields(fieldsData.data || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Failed to load extensions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExtensions();
    }, [fetchExtensions]);

    const getFieldsForModel = useCallback((model: string): ExtensionFieldDef[] => {
        return fields[model] || [];
    }, [fields]);

    const getExtensionsForSlot = useCallback((slot: string): RegisteredExtension[] => {
        return extensionPoints[slot] || [];
    }, [extensionPoints]);

    const value: ExtensionContextType = {
        extensions,
        extensionPoints,
        fields,
        stats,
        loading,
        error,
        refresh: fetchExtensions,
        getFieldsForModel,
        getExtensionsForSlot,
    };

    return React.createElement(ExtensionContext.Provider, { value }, children);
}

/**
 * Hook to access extension data
 */
export function useExtensionData(): ExtensionContextType {
    const context = useContext(ExtensionContext);
    if (!context) {
        // Return defaults if not in provider
        return {
            extensions: [],
            extensionPoints: {},
            fields: {},
            stats: null,
            loading: false,
            error: null,
            refresh: async () => {},
            getFieldsForModel: () => [],
            getExtensionsForSlot: () => [],
        };
    }
    return context;
}

/**
 * Hook to get extensions for a specific slot
 */
export function useSlotExtensions(slot: string): {
    extensions: RegisteredExtension[];
    loading: boolean;
} {
    const { getExtensionsForSlot, loading } = useExtensionData();
    return {
        extensions: getExtensionsForSlot(slot),
        loading,
    };
}

/**
 * Hook to get custom fields for a model
 */
export function useModelFields(model: string): {
    fields: ExtensionFieldDef[];
    loading: boolean;
} {
    const { getFieldsForModel, loading } = useExtensionData();
    return {
        fields: getFieldsForModel(model),
        loading,
    };
}

/**
 * Hook to get a single extension by ID
 */
export function useExtension(extensionId: string): ExtensionManifest | undefined {
    const { extensions } = useExtensionData();
    return extensions.find(e => e.id === extensionId);
}

/**
 * Hook to get extension statistics
 */
export function useExtensionStats(): ExtensionStats | null {
    const { stats } = useExtensionData();
    return stats;
}
