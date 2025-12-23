"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Package,
    ShoppingCart,
    Tags,
    Ticket,
    MapPin,
    Image,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    Folder,
    Trash2,
    Users,
    List,
    Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Bài viết",
        href: "/admin/articles",
        icon: FileText,
    },
    {
        title: "Sản phẩm",
        href: "/admin/products",
        icon: Package,
    },
    {
        title: "Đơn hàng",
        href: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Danh mục",
        href: "/admin/categories",
        icon: Folder,
    },
    {
        title: "Tags",
        href: "/admin/tags",
        icon: Tags,
    },
    {
        title: "Mã giảm giá",
        href: "/admin/coupons",
        icon: Ticket,
    },
    {
        title: "Địa điểm",
        href: "/admin/locations",
        icon: MapPin,
    },
    {
        title: "Người dùng",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Menu",
        href: "/admin/menus",
        icon: List,
    },
    {
        title: "Media",
        href: "/admin/media",
        icon: Image,
    },
    {
        title: "Crawler",
        href: "/admin/crawler",
        icon: Settings,
    },
    {
        title: "Thùng rác",
        href: "/admin/trash",
        icon: Trash2,
    },
    {
        title: "Cài đặt",
        href: "/admin/settings",
        icon: Settings,
    },
];


function NavContent({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <nav className={cn("flex flex-col gap-1", className)}>
            {menuItems.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 px-3",
                                isActive && "bg-primary/10 text-primary font-medium"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Button>
                    </Link>
                );
            })}
        </nav>
    );
}

function UserSection() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/admin/login");
    };

    const handleSettings = () => {
        router.push("/admin/profile");
    };

    // Get initials for avatar fallback
    const getInitials = (name: string | null) => {
        if (!name) return "AD";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="p-3 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="border-t p-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatarUrl || undefined} />
                            <AvatarFallback>{getInitials(user?.fullName || null)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium truncate">
                                {user?.fullName || "Admin"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.email || "admin@site.com"}
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleSettings}>
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Đăng xuất
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function AdminSidebar() {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r">
                {/* Logo */}
                <div className="flex h-16 items-center px-6 border-b">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold">A</span>
                        </div>
                        <span className="font-semibold text-lg">Admin Panel</span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3">
                    <NavContent />
                </div>

                {/* User Section */}
                <UserSection />
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center px-4 gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <div className="flex h-16 items-center px-6 border-b">
                            <Link href="/admin" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                    <span className="text-primary-foreground font-bold">A</span>
                                </div>
                                <span className="font-semibold text-lg">Admin Panel</span>
                            </Link>
                        </div>
                        <div className="py-4 px-3">
                            <NavContent />
                        </div>
                    </SheetContent>
                </Sheet>

                <span className="font-semibold">Admin Panel</span>
            </header>
        </>
    );
}
