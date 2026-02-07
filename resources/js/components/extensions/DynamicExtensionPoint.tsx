import React, { Suspense, ReactNode, useState, useEffect, lazy } from 'react';
import { useSlotExtensions, RegisteredExtension } from '@/hooks/use-extensions';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>();

// Pre-registered extension components (bundled with the app)
// Extensions can register their components here during build
const registeredComponents: Record<string, React.ComponentType<any>> = {};

/**
 * Register a component for an extension
 * This is called during app initialization by extension bundles
 */
export function registerExtensionComponent(
    extensionId: string,
    componentPath: string,
    component: React.ComponentType<any>
) {
    const key = `${extensionId}:${componentPath}`;
    registeredComponents[key] = component;
    componentCache.set(key, component);
}

/**
 * Get a registered component
 */
function getRegisteredComponent(extensionId: string, componentPath: string): React.ComponentType<any> | null {
    const key = `${extensionId}:${componentPath}`;
    return registeredComponents[key] || componentCache.get(key) || null;
}

interface DynamicExtensionPointProps {
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
    /** Error boundary fallback */
    errorFallback?: ReactNode;
}

/**
 * Dynamic Extension Point Component
 * 
 * Loads and renders extension components from the API.
 * Components can be:
 * 1. Pre-registered during build (fast)
 * 2. Dynamically loaded via import() (slow, for SaaS)
 * 
 * @example
 * <DynamicExtensionPoint 
 *   name="contacts.form.after-email" 
 *   context={{ contact, formData, setFormData }} 
 * />
 */
export function DynamicExtensionPoint({
    name,
    context = {},
    children,
    wrapper: Wrapper,
    fallback,
    renderChildrenAlways = true,
    className,
    errorFallback,
}: DynamicExtensionPointProps) {
    const { extensions, loading } = useSlotExtensions(name);

    // Show loading state
    if (loading) {
        if (fallback) return <>{fallback}</>;
        return renderChildrenAlways ? <>{children}</> : null;
    }

    // No extensions registered
    if (extensions.length === 0) {
        return renderChildrenAlways ? <>{children}</> : null;
    }

    const content = (
        <>
            {renderChildrenAlways && children}
            {extensions.map((extension, index) => (
                <ExtensionComponentLoader
                    key={`${name}-${extension.extensionId}-${index}`}
                    extension={extension}
                    context={{ ...context, ...extension.props }}
                    fallback={fallback || <ExtensionSkeleton />}
                    errorFallback={errorFallback}
                />
            ))}
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

interface ExtensionComponentLoaderProps {
    extension: RegisteredExtension;
    context: Record<string, any>;
    fallback: ReactNode;
    errorFallback?: ReactNode;
}

/**
 * Loads and renders a single extension component
 */
function ExtensionComponentLoader({
    extension,
    context,
    fallback,
    errorFallback,
}: ExtensionComponentLoaderProps) {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Check if component is pre-registered
        const registered = getRegisteredComponent(extension.extensionId, extension.component);
        if (registered) {
            setComponent(() => registered);
            return;
        }

        // For now, if not pre-registered, show a placeholder
        // In a full implementation, this would dynamically import the component
        setError(new Error(`Component not registered: ${extension.extensionId}:${extension.component}`));
    }, [extension]);

    if (error) {
        if (errorFallback) {
            return <>{errorFallback}</>;
        }
        // In development, show error; in production, silently skip
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="p-2 border border-destructive/50 rounded bg-destructive/10 text-sm">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Extension Error
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {extension.extensionId}: {error.message}
                    </p>
                </div>
            );
        }
        return null;
    }

    if (!Component) {
        return <>{fallback}</>;
    }

    return (
        <ErrorBoundary fallback={errorFallback}>
            <Suspense fallback={fallback}>
                <Component {...context} />
            </Suspense>
        </ErrorBoundary>
    );
}

/**
 * Simple skeleton for loading extensions
 */
function ExtensionSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
}

/**
 * Simple error boundary for extensions
 */
class ErrorBoundary extends React.Component<
    { children: ReactNode; fallback?: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode; fallback?: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Extension error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return <>{this.props.fallback}</>;
            }
            return null;
        }
        return this.props.children;
    }
}

/**
 * Hook to check if a slot has any extensions
 */
export function useHasSlotExtensions(slot: string): boolean {
    const { extensions } = useSlotExtensions(slot);
    return extensions.length > 0;
}

/**
 * Conditional wrapper - only renders if slot has extensions
 */
export function ConditionalExtensionPoint(props: DynamicExtensionPointProps) {
    const { extensions, loading } = useSlotExtensions(props.name);
    
    if (loading) {
        return props.fallback ? <>{props.fallback}</> : null;
    }

    if (extensions.length === 0 && !props.children) {
        return null;
    }

    return <DynamicExtensionPoint {...props} />;
}
