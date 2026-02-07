import React, { Suspense, ReactNode, Component, ErrorInfo } from 'react';
import { useSlotExtensions } from './provider';
import { useFormContext } from './form-context';
import { SlotContext, ExtensionComponent } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface ExtensionSlotProps {
    /** Unique name for this slot (e.g., "contacts.form.after-email") */
    name: string;
    /** Additional context passed to extensions */
    context?: Partial<SlotContext>;
    /** Content to render before extensions */
    children?: ReactNode;
    /** Wrapper element for extensions */
    wrapper?: React.ComponentType<{ children: ReactNode }>;
    /** Fallback while extensions are loading */
    fallback?: ReactNode;
    /** Error fallback */
    errorFallback?: ReactNode;
    /** Class name for container */
    className?: string;
    /** Only render if extensions exist */
    conditional?: boolean;
}

/**
 * Extension Slot Component
 * 
 * The unified way to render extension points. Automatically:
 * - Loads both static (bundled) and dynamic (API) extensions
 * - Provides form context if inside a FormProvider
 * - Handles loading and error states
 * - Sorts by priority
 * 
 * @example
 * // Basic usage
 * <ExtensionSlot name="contacts.detail.sidebar" context={{ entity: contact }} />
 * 
 * @example
 * // Inside a form (auto-receives form context)
 * <FormProvider data={data} onDataChange={setData}>
 *   <ExtensionSlot name="contacts.form.after-email" />
 * </FormProvider>
 * 
 * @example
 * // With wrapper and default children
 * <ExtensionSlot 
 *   name="contacts.actions" 
 *   wrapper={({ children }) => <div className="flex gap-2">{children}</div>}
 * >
 *   <Button>Default Action</Button>
 * </ExtensionSlot>
 */
export function ExtensionSlot({
    name,
    context = {},
    children,
    wrapper: Wrapper,
    fallback,
    errorFallback,
    className,
    conditional = false,
}: ExtensionSlotProps) {
    const { extensions, loading, hasExtensions } = useSlotExtensions(name);
    const formContext = useFormContext();

    // Conditional rendering
    if (conditional && !hasExtensions && !children) {
        return null;
    }

    // Show loading state
    if (loading && !hasExtensions) {
        if (fallback) return <>{fallback}</>;
        if (children) return <>{children}</>;
        return null;
    }

    // No extensions and no children
    if (!hasExtensions && !children) {
        return null;
    }

    // Build context for extensions
    const slotContext: SlotContext = {
        ...context,
        // Add form context if available
        ...(formContext && {
            data: formContext.data,
            setData: formContext.setData,
            errors: formContext.errors,
            disabled: formContext.disabled,
            readonly: formContext.readonly,
        }),
    };

    const content = (
        <>
            {children}
            {extensions.map((ext) => (
                <ExtensionRenderer
                    key={ext.id}
                    extension={ext}
                    context={slotContext}
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

    return <>{content}</>;
}

/**
 * Form Extension Slot - Explicitly typed for form context
 */
interface FormExtensionSlotProps<T extends Record<string, unknown>> {
    name: string;
    data: T;
    setData: (data: T | ((prev: T) => T)) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    className?: string;
}

export function FormExtensionSlot<T extends Record<string, unknown>>({
    name,
    data,
    setData,
    errors = {},
    disabled = false,
    className,
}: FormExtensionSlotProps<T>) {
    return (
        <ExtensionSlot
            name={name}
            context={{ 
                data, 
                setData: setData as (data: Record<string, unknown>) => void,
                errors, 
                disabled 
            }}
            className={className}
        />
    );
}

/**
 * Detail Extension Slot - For entity detail pages
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
        <ExtensionSlot
            name={name}
            context={{ entity, onRefresh }}
            className={className}
        />
    );
}

/**
 * List Extension Slot - For list/table views
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
        <ExtensionSlot
            name={name}
            context={{ items, selectedItems, onRefresh }}
            className={className}
        />
    );
}

/**
 * Renders a single extension with error boundary
 */
interface ExtensionRendererProps {
    extension: ExtensionComponent;
    context: SlotContext;
    fallback: ReactNode;
    errorFallback?: ReactNode;
}

function ExtensionRenderer({ 
    extension, 
    context, 
    fallback, 
    errorFallback 
}: ExtensionRendererProps) {
    const ExtComponent = extension.component;

    return (
        <ExtensionErrorBoundary 
            extensionId={extension.id}
            fallback={errorFallback}
        >
            <Suspense fallback={fallback}>
                <ExtComponent {...context} />
            </Suspense>
        </ExtensionErrorBoundary>
    );
}

/**
 * Default loading skeleton for extensions
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
 * Error boundary for extensions
 */
interface ExtensionErrorBoundaryProps {
    children: ReactNode;
    extensionId: string;
    fallback?: ReactNode;
}

interface ExtensionErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ExtensionErrorBoundary extends Component<
    ExtensionErrorBoundaryProps,
    ExtensionErrorBoundaryState
> {
    constructor(props: ExtensionErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ExtensionErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[Extension Error] ${this.props.extensionId}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return <>{this.props.fallback}</>;
            }

            // Only show error in development
            if (process.env.NODE_ENV === 'development') {
                return (
                    <div className="p-2 border border-destructive/50 rounded bg-destructive/10 text-sm">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Extension Error
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {this.props.extensionId}: {this.state.error?.message}
                        </p>
                    </div>
                );
            }

            return null;
        }

        return this.props.children;
    }
}
