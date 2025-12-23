"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

// User type from database
export interface User {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: "admin" | "editor" | "customer";
    avatarUrl: string | null;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Fetch current user on mount
    const refreshUser = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Auto-refresh token when access_token expires
    useEffect(() => {
        if (!user) return;

        // Refresh token every 14 minutes (access token expires in 15 min)
        const intervalId = setInterval(async () => {
            try {
                const res = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                });

                if (!res.ok) {
                    setUser(null);
                    router.push("/login");
                }
            } catch {
                // Ignore refresh errors
            }
        }, 14 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user, router]);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || "Đăng nhập thất bại" };
            }

            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: "Đã xảy ra lỗi, vui lòng thử lại" };
        }
    };

    const register = async (registerData: RegisterData) => {
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData),
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || "Đăng ký thất bại" };
            }

            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: "Đã xảy ra lỗi, vui lòng thử lại" };
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // Continue with logout even if API fails
        } finally {
            setUser(null);
            router.push("/login");
            router.refresh();
        }
    };

    const contextValue: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Helper hook to require authentication
export function useRequireAuth(requiredRole?: "admin" | "editor" | "customer") {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        }

        if (!isLoading && isAuthenticated && requiredRole) {
            const roleHierarchy = { admin: 3, editor: 2, customer: 1 };
            const userRoleLevel = roleHierarchy[user?.role || "customer"];
            const requiredRoleLevel = roleHierarchy[requiredRole];

            if (userRoleLevel < requiredRoleLevel) {
                router.push("/");
            }
        }
    }, [isLoading, isAuthenticated, user, requiredRole, router]);

    return { user, isLoading, isAuthenticated };
}
