import React, { ReactNode } from 'react';
import { usePermissions, useHasGroup, useModelAccess } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';

interface RequireGroupProps {
    group: string;
    children: ReactNode;
    fallback?: ReactNode;
    showLoading?: boolean;
}

/**
 * Only render children if user has the specified group
 */
export function RequireGroup({ 
    group, 
    children, 
    fallback = null,
    showLoading = false,
}: RequireGroupProps) {
    const { hasGroup, isLoading } = usePermissions();

    if (isLoading && showLoading) {
        return <Skeleton className="h-8 w-24" />;
    }

    if (!hasGroup(group)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface RequireAnyGroupProps {
    groups: string[];
    children: ReactNode;
    fallback?: ReactNode;
    showLoading?: boolean;
}

/**
 * Only render children if user has any of the specified groups
 */
export function RequireAnyGroup({ 
    groups, 
    children, 
    fallback = null,
    showLoading = false,
}: RequireAnyGroupProps) {
    const { hasAnyGroup, isLoading } = usePermissions();

    if (isLoading && showLoading) {
        return <Skeleton className="h-8 w-24" />;
    }

    if (!hasAnyGroup(groups)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface RequireAccessProps {
    model: string;
    operation: 'read' | 'write' | 'create' | 'delete';
    children: ReactNode;
    fallback?: ReactNode;
    showLoading?: boolean;
}

/**
 * Only render children if user has access to the model operation
 */
export function RequireAccess({ 
    model, 
    operation, 
    children, 
    fallback = null,
    showLoading = false,
}: RequireAccessProps) {
    const { checkAccess, isLoading } = usePermissions();

    if (isLoading && showLoading) {
        return <Skeleton className="h-8 w-24" />;
    }

    if (!checkAccess(model, operation)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface CanCreateProps {
    model: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Shorthand for RequireAccess with create operation
 */
export function CanCreate({ model, children, fallback = null }: CanCreateProps) {
    return (
        <RequireAccess model={model} operation="create" fallback={fallback}>
            {children}
        </RequireAccess>
    );
}

interface CanEditProps {
    model: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Shorthand for RequireAccess with write operation
 */
export function CanEdit({ model, children, fallback = null }: CanEditProps) {
    return (
        <RequireAccess model={model} operation="write" fallback={fallback}>
            {children}
        </RequireAccess>
    );
}

interface CanDeleteProps {
    model: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Shorthand for RequireAccess with delete operation
 */
export function CanDelete({ model, children, fallback = null }: CanDeleteProps) {
    return (
        <RequireAccess model={model} operation="delete" fallback={fallback}>
            {children}
        </RequireAccess>
    );
}

interface PermissionGateProps {
    groups?: string[];
    anyGroups?: string[];
    model?: string;
    operation?: 'read' | 'write' | 'create' | 'delete';
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Flexible permission gate that can check groups and/or model access
 */
export function PermissionGate({
    groups,
    anyGroups,
    model,
    operation = 'read',
    children,
    fallback = null,
}: PermissionGateProps) {
    const { hasAllGroups, hasAnyGroup, checkAccess, isLoading } = usePermissions();

    if (isLoading) {
        return null;
    }

    // Check all required groups
    if (groups && groups.length > 0 && !hasAllGroups(groups)) {
        return <>{fallback}</>;
    }

    // Check any of the groups
    if (anyGroups && anyGroups.length > 0 && !hasAnyGroup(anyGroups)) {
        return <>{fallback}</>;
    }

    // Check model access
    if (model && !checkAccess(model, operation)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface NoAccessMessageProps {
    title?: string;
    message?: string;
    className?: string;
}

/**
 * Message shown when user doesn't have access
 */
export function NoAccessMessage({
    title = 'Access Denied',
    message = "You don't have permission to view this content.",
    className = '',
}: NoAccessMessageProps) {
    return (
        <div className={`text-center py-12 ${className}`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg 
                    className="w-8 h-8 text-destructive" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

/**
 * HOC to wrap a component with permission checking
 */
export function withPermission<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: {
        group?: string;
        groups?: string[];
        model?: string;
        operation?: 'read' | 'write' | 'create' | 'delete';
    }
) {
    return function PermissionWrappedComponent(props: P) {
        const { hasGroup, hasAllGroups, checkAccess, isLoading } = usePermissions();

        if (isLoading) {
            return <Skeleton className="h-32 w-full" />;
        }

        if (options.group && !hasGroup(options.group)) {
            return <NoAccessMessage />;
        }

        if (options.groups && !hasAllGroups(options.groups)) {
            return <NoAccessMessage />;
        }

        if (options.model && !checkAccess(options.model, options.operation || 'read')) {
            return <NoAccessMessage />;
        }

        return <WrappedComponent {...props} />;
    };
}
