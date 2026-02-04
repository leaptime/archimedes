import { QueryClient } from '@tanstack/react-query';

// Single QueryClient instance - exported for use in main.tsx
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
