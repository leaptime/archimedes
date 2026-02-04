import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, getCsrfCookie } from '@/lib/api';

// ============ TYPES ============
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthData {
    user: User;
    two_factor_enabled: boolean;
}

interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface LoginResponse {
    user?: User;
    two_factor: boolean;
}

interface TwoFactorCredentials {
    code?: string;
    recovery_code?: string;
}

// ============ HOOKS ============
// These hooks MUST only be called inside components rendered within QueryClientProvider

export function useUser() {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await api.get<ApiResponse<AuthData>>('/user');
            return response.data.data;
        },
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            await getCsrfCookie();
            const response = await api.post<ApiResponse<LoginResponse>>('/login', credentials);
            return response.data.data;
        },
        onSuccess: (data) => {
            if (!data.two_factor) {
                queryClient.invalidateQueries({ queryKey: ['user'] });
            }
        },
    });
}

export function useRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RegisterData) => {
            await getCsrfCookie();
            const response = await api.post<ApiResponse<{ user: User }>>('/register', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.post('/logout');
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

export function useTwoFactorChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: TwoFactorCredentials) => {
            const response = await api.post<ApiResponse<{ user: User }>>('/two-factor-challenge', credentials);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: async (email: string) => {
            await getCsrfCookie();
            const response = await api.post<ApiResponse>('/forgot-password', { email });
            return response.data;
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: async (data: {
            token: string;
            email: string;
            password: string;
            password_confirmation: string;
        }) => {
            await getCsrfCookie();
            const response = await api.post<ApiResponse>('/reset-password', data);
            return response.data;
        },
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name?: string; email?: string }) => {
            const response = await api.patch<ApiResponse<{ user: User }>>('/user/profile', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

export function useUpdatePassword() {
    return useMutation({
        mutationFn: async (data: {
            current_password: string;
            password: string;
            password_confirmation: string;
        }) => {
            const response = await api.patch<ApiResponse>('/user/password', data);
            return response.data;
        },
    });
}
