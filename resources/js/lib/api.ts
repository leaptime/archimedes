import axios, { AxiosError, AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Get CSRF cookie before making requests
export async function getCsrfCookie(): Promise<void> {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Handle 419 (CSRF token mismatch) by refreshing token and retrying
        if (error.response?.status === 419) {
            await getCsrfCookie();
            return api.request(error.config!);
        }

        // Handle 401 (Unauthenticated)
        if (error.response?.status === 401) {
            // Redirect to login if not on auth pages
            if (!window.location.pathname.startsWith('/login') && 
                !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    errors?: Record<string, string[]>;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

export function getApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        return {
            message: axiosError.response?.data?.message || error.message,
            errors: axiosError.response?.data?.errors,
        };
    }
    return { message: 'An unexpected error occurred' };
}

export default api;
