import { createContext, useContext, ReactNode } from 'react';
import { useUser, User } from '@/hooks/use-auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    twoFactorEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data, isLoading, isError } = useUser();

    const value: AuthContextType = {
        user: data?.user ?? null,
        isLoading,
        isAuthenticated: !isError && !!data?.user,
        twoFactorEnabled: data?.two_factor_enabled ?? false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
