import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Auth } from '@/types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Get CSRF token first
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            
            const response = await fetch('/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                await fetchUser();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const refresh = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to get CSRF token from cookies
function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
