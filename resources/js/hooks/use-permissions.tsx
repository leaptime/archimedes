import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { createContext, useContext, ReactNode, useMemo } from 'react';

interface UserPermissions {
    groups: string[];
    access: Record<string, {
        read: boolean;
        write: boolean;
        create: boolean;
        delete: boolean;
    }>;
    is_super_admin: boolean;
}

interface PermissionContextValue {
    permissions: UserPermissions | null;
    isLoading: boolean;
    hasGroup: (group: string) => boolean;
    hasAnyGroup: (groups: string[]) => boolean;
    hasAllGroups: (groups: string[]) => boolean;
    canRead: (model: string) => boolean;
    canWrite: (model: string) => boolean;
    canCreate: (model: string) => boolean;
    canDelete: (model: string) => boolean;
    checkAccess: (model: string, operation: 'read' | 'write' | 'create' | 'delete') => boolean;
    refetch: () => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

async function fetchMyPermissions(): Promise<UserPermissions> {
    const response = await axios.get('/api/permissions/me');
    return response.data.data;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: permissions, isLoading, refetch } = useQuery({
        queryKey: ['my-permissions'],
        queryFn: fetchMyPermissions,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    const value = useMemo<PermissionContextValue>(() => ({
        permissions: permissions ?? null,
        isLoading,
        
        hasGroup: (group: string) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.groups.includes(group);
        },
        
        hasAnyGroup: (groups: string[]) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return groups.some(g => permissions.groups.includes(g));
        },
        
        hasAllGroups: (groups: string[]) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return groups.every(g => permissions.groups.includes(g));
        },
        
        canRead: (model: string) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.access[model]?.read ?? false;
        },
        
        canWrite: (model: string) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.access[model]?.write ?? false;
        },
        
        canCreate: (model: string) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.access[model]?.create ?? false;
        },
        
        canDelete: (model: string) => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.access[model]?.delete ?? false;
        },
        
        checkAccess: (model: string, operation: 'read' | 'write' | 'create' | 'delete') => {
            if (!permissions) return false;
            if (permissions.is_super_admin) return true;
            return permissions.access[model]?.[operation] ?? false;
        },
        
        refetch: () => {
            queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
        },
    }), [permissions, isLoading, queryClient]);

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions(): PermissionContextValue {
    const context = useContext(PermissionContext);
    if (!context) {
        // Return a default context if not wrapped in provider
        return {
            permissions: null,
            isLoading: true,
            hasGroup: () => false,
            hasAnyGroup: () => false,
            hasAllGroups: () => false,
            canRead: () => false,
            canWrite: () => false,
            canCreate: () => false,
            canDelete: () => false,
            checkAccess: () => false,
            refetch: () => {},
        };
    }
    return context;
}

// Convenience hook for checking a single group
export function useHasGroup(group: string): boolean {
    const { hasGroup } = usePermissions();
    return hasGroup(group);
}

// Convenience hook for checking model access
export function useModelAccess(model: string) {
    const { canRead, canWrite, canCreate, canDelete, isLoading } = usePermissions();
    
    return {
        isLoading,
        canRead: canRead(model),
        canWrite: canWrite(model),
        canCreate: canCreate(model),
        canDelete: canDelete(model),
    };
}

// Hook for checking permission and conditionally rendering
export function useRequirePermission(
    model: string,
    operation: 'read' | 'write' | 'create' | 'delete'
): { allowed: boolean; isLoading: boolean } {
    const { checkAccess, isLoading } = usePermissions();
    return {
        allowed: checkAccess(model, operation),
        isLoading,
    };
}

// API hooks for permission management (admin)
export function usePermissionGroups() {
    return useQuery({
        queryKey: ['permission-groups'],
        queryFn: async () => {
            const response = await axios.get('/api/permissions/groups');
            return response.data.data;
        },
    });
}

export function useAccessRules() {
    return useQuery({
        queryKey: ['access-rules'],
        queryFn: async () => {
            const response = await axios.get('/api/permissions/access');
            return response.data.data;
        },
    });
}

export function useRecordRules() {
    return useQuery({
        queryKey: ['record-rules'],
        queryFn: async () => {
            const response = await axios.get('/api/permissions/rules');
            return response.data.data;
        },
    });
}

export function useModelPermissionMatrix(model: string) {
    return useQuery({
        queryKey: ['permission-matrix', model],
        queryFn: async () => {
            const response = await axios.get(`/api/permissions/model/${encodeURIComponent(model)}`);
            return response.data.data;
        },
        enabled: !!model,
    });
}

export function useReloadPermissions() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/permissions/reload');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
            queryClient.invalidateQueries({ queryKey: ['access-rules'] });
            queryClient.invalidateQueries({ queryKey: ['record-rules'] });
            queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
        },
    });
}

export function useAssignGroups() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ userId, groups }: { userId: number; groups: string[] }) => {
            const response = await axios.post('/api/permissions/assign-groups', {
                user_id: userId,
                groups,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
        },
    });
}
