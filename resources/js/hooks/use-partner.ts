import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface Partner {
    id: number;
    name: string;
    code: string;
    legal_name: string | null;
    type: 'reseller' | 'affiliate' | 'distributor';
    status: 'active' | 'suspended' | 'terminated';
    email: string;
    phone: string | null;
    website: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string;
    commission_rate: number;
    minimum_payout: number;
    payout_method: 'bank_transfer' | 'paypal' | 'stripe';
    payout_details: Record<string, any> | null;
    currency: string;
    max_organizations: number | null;
    created_at: string;
}

export interface Organization {
    id: number;
    partner_id: number | null;
    name: string;
    code: string;
    legal_name: string | null;
    type: 'company' | 'nonprofit' | 'government' | 'education' | 'individual';
    status: 'trial' | 'active' | 'suspended' | 'cancelled';
    email: string;
    phone: string | null;
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    billing_cycle: 'monthly' | 'yearly';
    trial_ends_at: string | null;
    max_users: number;
    storage_used_bytes: number;
    storage_limit_bytes: number;
    timezone: string;
    currency: string;
    users_count?: number;
    created_at: string;
    owner?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface OrganizationModule {
    id: number;
    organization_id: number;
    module_id: string;
    is_active: boolean;
    activated_at: string;
    monthly_price: number;
    yearly_price: number;
}

export interface PartnerPayout {
    id: number;
    partner_id: number;
    reference: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amount: number;
    currency: string;
    period_start: string;
    period_end: string;
    breakdown: Array<{ organization: string; amount: number }>;
    paid_at: string | null;
    created_at: string;
}

export interface PartnerRevenue {
    id: number;
    partner_id: number;
    organization_id: number;
    type: 'subscription' | 'module' | 'users' | 'storage' | 'overage';
    description: string;
    gross_amount: number;
    commission_rate: number;
    commission_amount: number;
    currency: string;
    period_date: string;
    status: 'pending' | 'approved' | 'paid';
    organization?: {
        id: number;
        name: string;
        code: string;
    };
}

export interface DashboardStats {
    total_organizations: number;
    active_organizations: number;
    total_users: number;
    monthly_revenue: number;
    monthly_commission: number;
    pending_payout: number;
    commission_rate: number;
}

export interface DashboardData {
    partner: Pick<Partner, 'id' | 'name' | 'code' | 'status'>;
    stats: DashboardStats;
    recent_organizations: Organization[];
    revenue_by_month: Array<{ month: string; revenue: number; commission: number }>;
}

// API functions
const partnerApi = {
    getDashboard: () => api.get<DashboardData>('/partner/dashboard'),
    
    getProfile: () => api.get<{ partner: Partner }>('/partner/profile'),
    updateProfile: (data: Partial<Partner>) => api.patch<{ partner: Partner }>('/partner/profile', data),
    
    getOrganizations: (params?: { status?: string; type?: string; search?: string; page?: number }) =>
        api.get<{ data: Organization[]; meta: any }>('/partner/organizations', { params }),
    
    getOrganization: (id: number) => 
        api.get<{ organization: Organization; stats: any }>(`/partner/organizations/${id}`),
    
    createOrganization: (data: {
        name: string;
        type: string;
        email: string;
        owner_name: string;
        owner_email: string;
        [key: string]: any;
    }) => api.post<{ organization: Organization; owner: any }>('/partner/organizations', data),
    
    updateOrganization: (id: number, data: Partial<Organization>) =>
        api.patch<{ organization: Organization }>(`/partner/organizations/${id}`, data),
    
    enableModule: (orgId: number, data: { module_id: string; monthly_price: number; yearly_price: number }) =>
        api.post<{ module: OrganizationModule }>(`/partner/organizations/${orgId}/modules`, data),
    
    disableModule: (orgId: number, moduleId: string) =>
        api.delete(`/partner/organizations/${orgId}/modules/${moduleId}`),
    
    getPayouts: (params?: { page?: number }) =>
        api.get<{ data: PartnerPayout[]; meta: any }>('/partner/payouts', { params }),
    
    getRevenue: (params?: { year?: number; month?: number; status?: string; page?: number }) =>
        api.get<{ revenue: { data: PartnerRevenue[]; meta: any }; summary: { total_gross: number; total_commission: number } }>('/partner/revenue', { params }),
};

// Hooks
export function usePartnerDashboard() {
    return useQuery({
        queryKey: ['partner', 'dashboard'],
        queryFn: () => partnerApi.getDashboard(),
    });
}

export function usePartnerProfile() {
    return useQuery({
        queryKey: ['partner', 'profile'],
        queryFn: () => partnerApi.getProfile(),
    });
}

export function useUpdatePartnerProfile() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: Partial<Partner>) => partnerApi.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partner', 'profile'] });
        },
    });
}

export function usePartnerOrganizations(params?: { status?: string; type?: string; search?: string; page?: number }) {
    return useQuery({
        queryKey: ['partner', 'organizations', params],
        queryFn: () => partnerApi.getOrganizations(params),
    });
}

export function usePartnerOrganization(id: number) {
    return useQuery({
        queryKey: ['partner', 'organizations', id],
        queryFn: () => partnerApi.getOrganization(id),
        enabled: !!id,
    });
}

export function useCreateOrganization() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: partnerApi.createOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partner', 'organizations'] });
            queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] });
        },
    });
}

export function useUpdateOrganization() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Organization> }) =>
            partnerApi.updateOrganization(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['partner', 'organizations'] });
            queryClient.invalidateQueries({ queryKey: ['partner', 'organizations', id] });
        },
    });
}

export function useEnableModule() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orgId, data }: { orgId: number; data: { module_id: string; monthly_price: number; yearly_price: number } }) =>
            partnerApi.enableModule(orgId, data),
        onSuccess: (_, { orgId }) => {
            queryClient.invalidateQueries({ queryKey: ['partner', 'organizations', orgId] });
        },
    });
}

export function useDisableModule() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orgId, moduleId }: { orgId: number; moduleId: string }) =>
            partnerApi.disableModule(orgId, moduleId),
        onSuccess: (_, { orgId }) => {
            queryClient.invalidateQueries({ queryKey: ['partner', 'organizations', orgId] });
        },
    });
}

export function usePartnerPayouts(params?: { page?: number }) {
    return useQuery({
        queryKey: ['partner', 'payouts', params],
        queryFn: () => partnerApi.getPayouts(params),
    });
}

export function usePartnerRevenue(params?: { year?: number; month?: number; status?: string; page?: number }) {
    return useQuery({
        queryKey: ['partner', 'revenue', params],
        queryFn: () => partnerApi.getRevenue(params),
    });
}
