import React, { Suspense, ReactNode, createContext, useContext, useState, useCallback, useMemo } from 'react';

// Extension component type
interface ExtensionComponent {
    component: React.ComponentType<any>;
    module: string;
    priority: number;
}

// Extension registry context
interface ExtensionContextType {
    extensions: Record<string, ExtensionComponent[]>;
    registerExtension: (slot: string, component: React.ComponentType<any>, options?: { module?: string; priority?: number }) => void;
    unregisterExtension: (slot: string, module: string) => void;
    getExtensions: (slot: string) => ExtensionComponent[];
}

const ExtensionContext = createContext<ExtensionContextType | null>(null);

/**
 * Extension Provider - wraps the app to provide extension registration
 */
export function ExtensionProvider({ children }: { children: ReactNode }) {
    const [extensions, setExtensions] = useState<Record<string, ExtensionComponent[]>>({});

    const registerExtension = useCallback((
        slot: string,
        component: React.ComponentType<any>,
        options?: { module?: string; priority?: number }
    ) => {
        setExtensions(prev => {
            const existing = prev[slot] || [];
            const newExt: ExtensionComponent = {
                component,
                module: options?.module || 'unknown',
                priority: options?.priority || 10,
            };
            // Add and sort by priority
            const updated = [...existing, newExt].sort((a, b) => a.priority - b.priority);
            return { ...prev, [slot]: updated };
        });
    }, []);

    const unregisterExtension = useCallback((slot: string, module: string) => {
        setExtensions(prev => {
            const existing = prev[slot] || [];
            return { ...prev, [slot]: existing.filter(e => e.module !== module) };
        });
    }, []);

    const getExtensions = useCallback((slot: string) => {
        return extensions[slot] || [];
    }, [extensions]);

    const value = useMemo(() => ({
        extensions,
        registerExtension,
        unregisterExtension,
        getExtensions,
    }), [extensions, registerExtension, unregisterExtension, getExtensions]);

    return (
        <ExtensionContext.Provider value={value}>
            {children}
        </ExtensionContext.Provider>
    );
}

/**
 * Hook to access extensions
 */
export function useExtensions(slot: string): ExtensionComponent[] {
    const context = useContext(ExtensionContext);
    if (!context) {
        // Return empty array if not in provider (graceful degradation)
        return [];
    }
    return context.getExtensions(slot);
}

/**
 * Hook to check if slot has extensions
 */
export function useHasExtensions(slot: string): boolean {
    const extensions = useExtensions(slot);
    return extensions.length > 0;
}

/**
 * Hook to register an extension
 */
export function useRegisterExtension(
    slot: string,
    component: React.ComponentType<any>,
    options?: { module?: string; priority?: number }
) {
    const context = useContext(ExtensionContext);
    
    React.useEffect(() => {
        if (context) {
            context.registerExtension(slot, component, options);
            return () => context.unregisterExtension(slot, options?.module || 'unknown');
        }
    }, [slot, component, options, context]);
}

// ============================================================================
// EXTENSION POINT COMPONENTS
// ============================================================================

interface ExtensionPointProps {
    /** Unique name for this extension point (e.g., "contacts.form.after-email") */
    name: string;
    /** Context data passed to all extensions */
    context?: Record<string, any>;
    /** Content to render before extensions */
    children?: ReactNode;
    /** Wrapper element for extensions */
    wrapper?: React.ComponentType<{ children: ReactNode }>;
    /** Fallback while extensions are loading */
    fallback?: ReactNode;
    /** Whether to render children even if no extensions */
    renderChildrenAlways?: boolean;
    /** Class name for the extension container */
    className?: string;
}

/**
 * Extension Point Component
 * 
 * Renders a slot where modules can inject components.
 * 
 * @example
 * // In a form component:
 * <ExtensionPoint 
 *   name="contacts.form.after-email" 
 *   context={{ contact, formData, setFormData }} 
 * />
 */
export function ExtensionPoint({
    name,
    context = {},
    children,
    wrapper: Wrapper,
    fallback = null,
    renderChildrenAlways = true,
    className,
}: ExtensionPointProps) {
    const extensions = useExtensions(name);
    const hasExtensions = extensions.length > 0;

    // If no extensions and no children to render
    if (!hasExtensions && !children) {
        return null;
    }

    // If no extensions but we have children
    if (!hasExtensions && children && renderChildrenAlways) {
        return <>{children}</>;
    }

    const content = (
        <>
            {renderChildrenAlways && children}
            {extensions.map((extension, index) => {
                const ExtComponent = extension.component;
                return (
                    <Suspense key={`${name}-${extension.module}-${index}`} fallback={fallback}>
                        <ExtComponent {...context} />
                    </Suspense>
                );
            })}
        </>
    );

    if (Wrapper) {
        return <Wrapper>{content}</Wrapper>;
    }

    if (className) {
        return <div className={className}>{content}</div>;
    }

    return content;
}

/**
 * Conditional Extension Point - only renders container if extensions exist
 */
export function ConditionalExtensionPoint(props: ExtensionPointProps) {
    const hasExtensions = useHasExtensions(props.name);
    
    if (!hasExtensions && !props.children) {
        return null;
    }

    return <ExtensionPoint {...props} />;
}

/**
 * Extension Slot for forms - provides form-specific context
 */
interface FormExtensionSlotProps<T> {
    name: string;
    data: T;
    setData: (data: T | ((prev: T) => T)) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    className?: string;
}

export function FormExtensionSlot<T extends Record<string, any>>({
    name,
    data,
    setData,
    errors = {},
    disabled = false,
    className,
}: FormExtensionSlotProps<T>) {
    return (
        <ExtensionPoint
            name={name}
            context={{ data, setData, errors, disabled }}
            className={className}
        />
    );
}

/**
 * Extension Slot for detail views - provides entity context
 */
interface DetailExtensionSlotProps<T> {
    name: string;
    entity: T;
    onRefresh?: () => void;
    className?: string;
}

export function DetailExtensionSlot<T>({
    name,
    entity,
    onRefresh,
    className,
}: DetailExtensionSlotProps<T>) {
    return (
        <ExtensionPoint
            name={name}
            context={{ entity, onRefresh }}
            className={className}
        />
    );
}

/**
 * Extension Slot for lists - provides list context
 */
interface ListExtensionSlotProps<T> {
    name: string;
    items: T[];
    selectedItems?: T[];
    onRefresh?: () => void;
    className?: string;
}

export function ListExtensionSlot<T>({
    name,
    items,
    selectedItems = [],
    onRefresh,
    className,
}: ListExtensionSlotProps<T>) {
    return (
        <ExtensionPoint
            name={name}
            context={{ items, selectedItems, onRefresh }}
            className={className}
        />
    );
}
