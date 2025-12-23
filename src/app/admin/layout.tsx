"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoading, isAuthenticated, user } = useAuth();

    // Don't show layout for login page
    const isLoginPage = pathname === "/admin/login";

    // Redirect to login if not authenticated (except on login page)
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isLoginPage) {
            router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [isLoading, isAuthenticated, isLoginPage, pathname, router]);

    // If on login page, just show children (login form) without sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show redirecting (redirect happens in useEffect)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Đang chuyển hướng đến trang đăng nhập...</p>
                </div>
            </div>
        );
    }

    // Check if user has admin/editor role
    if (!["admin", "editor"].includes(user?.role || "")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Không có quyền truy cập</h1>
                    <p className="text-muted-foreground">Bạn không có quyền truy cập trang quản trị.</p>
                </div>
            </div>
        );
    }

    // Authenticated with proper role - show full admin layout
    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />

            {/* Main Content */}
            <main className="lg:pl-64">
                {/* Mobile header spacer */}
                <div className="h-16 lg:hidden" />

                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AuthProvider>
    );
}
