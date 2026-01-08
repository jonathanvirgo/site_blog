"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
    Gift,
    Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";

interface MenuItem {
    id: string;
    title: string;
    url: string;
    children?: MenuItem[];
}

interface HeaderClientProps {
    initialMenuItems: MenuItem[];
}

export function HeaderClient({ initialMenuItems }: HeaderClientProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const menuItems = initialMenuItems;
    const { itemCount } = useCart();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <header className="sticky top-0 z-50">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-primary via-cyan-600 to-primary text-primary-foreground text-sm py-2">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center gap-2">
                        <Gift className="h-4 w-4 animate-pulse-subtle" />
                        <span className="font-medium">Miễn phí vận chuyển cho đơn hàng từ 500.000đ</span>
                        <span className="hidden sm:inline text-white/70">|</span>
                        <span className="hidden sm:flex items-center gap-1 text-white/90">
                            <Heart className="h-3 w-3" /> Ưu đãi thành viên
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className={`bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${isScrolled ? "shadow-lg" : ""
                }`}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 bg-background/95 backdrop-blur-xl">
                                <div className="flex items-center gap-3 mb-8 pt-4">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg">
                                        <span className="text-primary-foreground font-bold text-2xl">H</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xl block">HealthNews</span>
                                        <span className="text-xs text-muted-foreground">Sức khỏe & Mua sắm</span>
                                    </div>
                                </div>
                                <nav className="flex flex-col gap-2">
                                    {menuItems.map((item) => (
                                        <div key={item.id}>
                                            {item.children && item.children.length > 0 ? (
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground px-3 py-2">{item.title}</p>
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.id}
                                                            href={child.url}
                                                            className="block px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                        >
                                                            {child.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Link
                                                    href={item.url}
                                                    className="block px-3 py-2.5 rounded-lg font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                                >
                                                    {item.title}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <Link href="/dang-nhap">
                                        <Button className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg">
                                            <User className="h-4 w-4 mr-2" />
                                            Đăng nhập
                                        </Button>
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                                <span className="text-primary-foreground font-bold text-xl">H</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">HealthNews</span>
                                <span className="block text-xs text-muted-foreground">Tin sức khỏe & Mua sắm</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {menuItems.map((item) => (
                                item.children && item.children.length > 0 ? (
                                    <div key={item.id} className="relative group">
                                        <button className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-200">
                                            {item.title}
                                            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                                        </button>
                                        <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                                            <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl py-2 min-w-[200px] overflow-hidden">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.url}
                                                        className="block px-4 py-2.5 text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        className="px-4 py-2 rounded-lg font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                                    >
                                        {item.title}
                                    </Link>
                                )
                            ))}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1">
                            {/* Search */}
                            {isSearchOpen ? (
                                <div className="absolute inset-x-0 top-full bg-background/95 backdrop-blur-lg border-b shadow-lg p-4 lg:static lg:border-none lg:shadow-none lg:p-0 lg:bg-transparent animate-fade-in">
                                    <form onSubmit={handleSearch} className="container mx-auto flex items-center gap-2 lg:w-auto">
                                        <div className="relative flex-1 lg:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Tìm kiếm bài viết, sản phẩm..."
                                                className="pl-10 bg-secondary/50 border-primary/20 focus:border-primary focus:ring-primary/30"
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 shadow-md">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsSearchOpen(false)}
                                            className="hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="hover:bg-primary/10 hover:text-primary"
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                            )}

                            {/* Cart */}
                            <Link href="/gio-hang">
                                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary group">
                                    <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full px-1 shadow-md animate-scale-in">
                                            {itemCount > 99 ? "99+" : itemCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            {/* User - Desktop */}
                            <div className="hidden sm:block">
                                <Link href="/dang-nhap">
                                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary group">
                                        <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    </Button>
                                </Link>
                            </div>

                            {/* User - Mobile (smaller) */}
                            <div className="sm:hidden">
                                <Link href="/dang-nhap">
                                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                                        <User className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
