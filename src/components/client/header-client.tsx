"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
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
    const menuItems = initialMenuItems;
    const { itemCount } = useCart();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-background border-b">
            {/* Top Bar */}
            <div className="bg-primary text-primary-foreground text-sm py-1">
                <div className="container mx-auto px-4 text-center">
                    🎉 Miễn phí vận chuyển cho đơn hàng từ 500.000đ
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72">
                            <nav className="flex flex-col gap-4 mt-8">
                                {menuItems.map((item) => (
                                    <div key={item.id}>
                                        {item.children && item.children.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="font-medium">{item.title}</p>
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.url}
                                                        className="block pl-4 text-muted-foreground hover:text-primary"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <Link
                                                href={item.url}
                                                className="font-medium hover:text-primary"
                                            >
                                                {item.title}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xl">H</span>
                        </div>
                        <span className="hidden sm:block font-bold text-xl">HealthNews</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {menuItems.map((item) => (
                            item.children && item.children.length > 0 ? (
                                <div key={item.id} className="relative group">
                                    <button className="flex items-center gap-1 font-medium hover:text-primary transition">
                                        {item.title}
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className="bg-card border rounded-lg shadow-lg py-2 min-w-[180px]">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={child.url}
                                                    className="block px-4 py-2 hover:bg-muted transition"
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
                                    className="font-medium hover:text-primary transition"
                                >
                                    {item.title}
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        {isSearchOpen ? (
                            <div className="absolute inset-x-0 top-full bg-background border-b p-4 lg:static lg:border-none lg:p-0">
                                <form onSubmit={handleSearch} className="container mx-auto flex items-center gap-2">
                                    <Input
                                        placeholder="Tìm kiếm bài viết, sản phẩm..."
                                        className="flex-1"
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button type="submit" variant="default" size="icon">
                                        <Search className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsSearchOpen(false)}
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
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        )}

                        {/* Cart */}
                        <Link href="/gio-hang">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                                        {itemCount > 99 ? "99+" : itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* User */}
                        <Link href="/dang-nhap">
                            <Button variant="ghost" size="icon">
                                <User className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
