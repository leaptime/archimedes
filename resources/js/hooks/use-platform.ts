import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Partner, Organization, PartnerPayout } from './use-partner';

// Types
export interface PlatformStats {
    total_partners: number;
    active_partners: number;
    total_organizations_via_partners: number;
    total_commission_this_month: number;
    pending_payouts_amount: number;
    by_type: Record<string, number>;
}

export interface OrganizationStats {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    by_type: Record<string, number>;
    by_plan: Record<string, number>;
    total_users: number;
    new_this_month: number;
}

export interface PartnerWithStats extends Partner {
    organizations_count?: number;
    stats?: {
        total_organizations: number;
        active_organizations: number;
        total_users: number;
        monthly_revenue: number;
        monthly_commission: number;
        pending_payout: number;
    };
}

export interface OrganizationWithStats extends Organization {
    users_count?: number;
    partner?: Partner;
    stats?: {
        users_count: number;
        storage_used: string;
        storage_limit: string;
        storage_percentage: number;
        active_modules: string[];
        monthly_cost: number;
        yearly_cost: number;
    };
}

// API functions
const platformApi = {
    // Partners
    getPartners: (params?: { status?: string; type?: string; search?: string; page?: number }) =>
        api.get<{ data: PartnerWithStats[]; meta: any }>('/platform/partners', { params }),
    
    getPartner: (id: number) =>
        api.get<{ partner: PartnerWithStats; stats: any }>(`/platform/partners/${id}`),
    
    createPartner: (data: {
        name: string;
        type: string;
        email: string;
        admin_name: string;
        admin_email: string;
        [key: string]: any;
    }) => api.post<{ partner: Partner; admin: any }>('/platform/partners', data),
    
    updatePartner: (id: number, data: Partial<Partner>) =>
        api.patch<{ partner: Partner }>(`/platform/partners/${id}`, data),
    
    deletePartner: (id: number) =>
        api.delete(`/platform/partners/${id}`),
    
    getPartnerStats: () =>
        api.get<PlatformStats>('/platform/partners/stats'),
    
    getPartnerPayouts: (partnerId: number, params?: { page?: number }) =>
        api.get<{ data: PartnerPayout[]; meta: any }>(`/platform/partners/${partnerId}/payouts`, { params }),
    
    createPayout: (partnerId: number) =>
        api.post<{ payout: PartnerPayout }>(`/platform/partners/${partnerId}/payouts`),
    
    completePayout: (partnerId: number, payoutId: number, data?: { payment_reference?: string }) =>
        api.post<{ payout: PartnerPayout }>(`/platform/partners/${partnerId}/payouts/${payoutId}/complete`, data),
    
    // Organizations
    getOrganizations: (params?: { status?: string; type?: string; partner_id?: number; plan?: string; search?: string; page?: number }) =>
        api.get<{ data: OrganizationWithStats[]; meta: any }>('/platform/organizations', { params }),
    
    getOrganization: (id: number) =>
        api.get<{ organization: OrganizationWithStats; stats: any }>(`/platform/organizations/${id}`),
    
    createOrganization: (data: {
        name: string;
        type: string;
        email: string;
        owner_name: string;
        owner_email: string;
        partner_id?: number;
        [key: string]: any;
    }) => api.post<{ organization: Organization; owner: any }>('/platform/organizations', data),
    
    updateOrganization: (id: number, data: Partial<Organization>) =>
        api.patch<{ organization: Organization }>(`/platform/organizations/${id}`, data),
    
    deleteOrganization: (id: number) =>
        api.delete(`/platform/organizations/${id}`),
    
    getOrganizationStats: () =>
        api.get<OrganizationStats>('/platform/organizations/stats'),
};

// Hooks - Partners
export function usePlatformPartners(params?: { status?: string; type?: string; search?: string; page?: number }) {
    return useQuery({
        queryKey: ['platform', 'partners', params],
        queryFn: () => platformApi.getPartners(params),
    });
}

export function usePlatformPartner(id: number) {
    return useQuery({
        queryKey: ['platform', 'partners', id],
        queryFn: () => platformApi.getPartner(id),
        enabled: !!id,
    });
}

export function useCreatePartner() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: platformApi.createPartner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners'] });
        },
    });
}

export function useUpdatePartner() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Partner> }) =>
            platformApi.updatePartner(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners'] });
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners', id] });
        },
    });
}

export function useDeletePartner() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: number) => platformApi.deletePartner(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners'] });
        },
    });
}

export function usePlatformPartnerStats() {
    return useQuery({
        queryKey: ['platform', 'partners', 'stats'],
        queryFn: () => platformApi.getPartnerStats(),
    });
}

export function usePartnerPayouts(partnerId: number, params?: { page?: number }) {
    return useQuery({
        queryKey: ['platform', 'partners', partnerId, 'payouts', params],
        queryFn: () => platformApi.getPartnerPayouts(partnerId, params),
        enabled: !!partnerId,
    });
}

export function useCreatePayout() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (partnerId: number) => platformApi.createPayout(partnerId),
        onSuccess: (_, partnerId) => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners', partnerId] });
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners', partnerId, 'payouts'] });
        },
    });
}

export function useCompletePayout() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ partnerId, payoutId, data }: { partnerId: number; payoutId: number; data?: { payment_reference?: string } }) =>
            platformApi.completePayout(partnerId, payoutId, data),
        onSuccess: (_, { partnerId }) => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'partners', partnerId, 'payouts'] });
        },
    });
}

// Hooks - Organizations
export function usePlatformOrganizations(params?: { status?: string; type?: string; partner_id?: number; plan?: string; search?: string; page?: number }) {
    return useQuery({
        queryKey: ['platform', 'organizations', params],
        queryFn: () => platformApi.getOrganizations(params),
    });
}

export function usePlatformOrganization(id: number) {
    return useQuery({
        queryKey: ['platform', 'organizations', id],
        queryFn: () => platformApi.getOrganization(id),
        enabled: !!id,
    });
}

export function useCreatePlatformOrganization() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: platformApi.createOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
        },
    });
}

export function useUpdatePlatformOrganization() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Organization> }) =>
            platformApi.updateOrganization(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
            queryClient.invalidateQueries({ queryKey: ['platform', 'organizations', id] });
        },
    });
}

export function useDeletePlatformOrganization() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: number) => platformApi.deleteOrganization(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
        },
    });
}

export function usePlatformOrganizationStats() {
    return useQuery({
        queryKey: ['platform', 'organizations', 'stats'],
        queryFn: () => platformApi.getOrganizationStats(),
    });
}
