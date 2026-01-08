"use client";

import { useState } from "react";
import Link from "next/link";
import {
    User,
    Package,
    Heart,
    Settings,
    LogOut,
    ChevronRight,
    Clock,
    MapPin,
    Phone,
    Mail,
    Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock user data
const mockUser = {
    id: "1",
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    avatarUrl: null,
    createdAt: "2024-01-15",
};

// Mock orders
const mockOrders = [
    {
        id: "ORD-20241215-001",
        createdAt: "2024-12-15T10:30:00Z",
        status: "delivered",
        statusLabel: "Đã giao",
        totalAmount: 728000,
        itemCount: 3,
    },
    {
        id: "ORD-20241210-002",
        createdAt: "2024-12-10T14:20:00Z",
        status: "shipping",
        statusLabel: "Đang giao",
        totalAmount: 450000,
        itemCount: 2,
    },
    {
        id: "ORD-20241205-003",
        createdAt: "2024-12-05T09:15:00Z",
        status: "pending",
        statusLabel: "Chờ xác nhận",
        totalAmount: 199000,
        itemCount: 1,
    },
];

// Mock wishlist
const mockWishlist = [
    {
        id: "p1",
        name: "Vitamin C 1000mg",
        slug: "vitamin-c-1000mg",
        price: 199000,
        originalPrice: 299000,
        image: "/api/placeholder/100/100",
        inStock: true,
    },
    {
        id: "p2",
        name: "Omega 3 Fish Oil Premium",
        slug: "omega-3-premium",
        price: 450000,
        originalPrice: 450000,
        image: "/api/placeholder/100/100",
        inStock: true,
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-blue-100 text-blue-800",
    shipping: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

export default function AccountPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist">("profile");

    const user = mockUser;
    const orders = mockOrders;
    const wishlist = mockWishlist;

    const navItems = [
        { key: "profile", label: "Thông tin cá nhân", icon: User },
        { key: "orders", label: "Đơn hàng của tôi", icon: Package },
        { key: "wishlist", label: "Sản phẩm yêu thích", icon: Heart },
    ];

    return (
        <main className="min-h-screen bg-secondary/30 py-8 md:py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6 text-foreground animate-fade-in">Tài khoản của tôi</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                            {/* User Avatar */}
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {user.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{user.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key as typeof activeTab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.key
                                            ? "bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md"
                                            : "hover:bg-secondary text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                                <hr className="my-2 border-border/50" />
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                                    <Settings className="h-5 w-5" />
                                    <span>Cài đặt</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors">
                                    <LogOut className="h-5 w-5" />
                                    <span>Đăng xuất</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">Thông tin cá nhân</h2>
                                    <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary hover:text-white">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-secondary/50">
                                            <label className="text-sm text-muted-foreground">Họ và tên</label>
                                            <p className="font-medium flex items-center gap-2 mt-1 text-foreground">
                                                <User className="h-4 w-4 text-primary" />
                                                {user.fullName}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/50">
                                            <label className="text-sm text-muted-foreground">Email</label>
                                            <p className="font-medium flex items-center gap-2 mt-1 text-foreground">
                                                <Mail className="h-4 w-4 text-primary" />
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/50">
                                            <label className="text-sm text-muted-foreground">Số điện thoại</label>
                                            <p className="font-medium flex items-center gap-2 mt-1 text-foreground">
                                                <Phone className="h-4 w-4 text-primary" />
                                                {user.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-secondary/50">
                                            <label className="text-sm text-muted-foreground">Ngày tham gia</label>
                                            <p className="font-medium flex items-center gap-2 mt-1 text-foreground">
                                                <Clock className="h-4 w-4 text-primary" />
                                                {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/50">
                                            <label className="text-sm text-muted-foreground">Địa chỉ mặc định</label>
                                            <p className="font-medium flex items-center gap-2 mt-1 text-foreground">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                Chưa cập nhật
                                            </p>
                                            <Button variant="link" className="p-0 h-auto text-sm text-primary">
                                                Thêm địa chỉ
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-6 border-border/50" />

                                <div>
                                    <h3 className="font-semibold mb-4 text-foreground">Bảo mật</h3>
                                    <Button variant="outline" className="border-primary/50">Đổi mật khẩu</Button>
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === "orders" && (
                            <div className="space-y-4">
                                <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-6 text-foreground">Đơn hàng của tôi</h2>

                                    {orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                                <Package className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground">Bạn chưa có đơn hàng nào</p>
                                            <Button className="mt-4 bg-gradient-to-r from-primary to-cyan-500" asChild>
                                                <Link href="/san-pham">Mua sắm ngay</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div
                                                    key={order.id}
                                                    className="border border-border/50 rounded-xl p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <p className="font-semibold text-foreground">{order.id}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDate(order.createdAt)}
                                                            </p>
                                                        </div>
                                                        <Badge className={statusColors[order.status]}>
                                                            {order.statusLabel}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-muted-foreground">
                                                            {order.itemCount} sản phẩm
                                                        </p>
                                                        <div className="flex items-center gap-4">
                                                            <p className="font-bold text-lg text-primary">
                                                                {formatPrice(order.totalAmount)}
                                                            </p>
                                                            <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary hover:text-white" asChild>
                                                                <Link href={`/tai-khoan/don-hang/${order.id}`}>
                                                                    Chi tiết
                                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === "wishlist" && (
                            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                                <h2 className="text-xl font-bold mb-6 text-foreground">Sản phẩm yêu thích</h2>

                                {wishlist.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                            <Heart className="h-10 w-10 text-rose-400" />
                                        </div>
                                        <p className="text-muted-foreground">Chưa có sản phẩm yêu thích</p>
                                        <Button className="mt-4 bg-gradient-to-r from-primary to-cyan-500" asChild>
                                            <Link href="/san-pham">Khám phá sản phẩm</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {wishlist.map((product) => (
                                            <div
                                                key={product.id}
                                                className="border border-border/50 rounded-xl p-4 group hover:shadow-md transition-shadow"
                                            >
                                                <Link href={`/san-pham/${product.slug}`}>
                                                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-muted mb-3 group-hover:scale-105 transition-transform" />
                                                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    {product.price < product.originalPrice ? (
                                                        <>
                                                            <span className="text-rose-500 font-bold">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs line-through">
                                                                {formatPrice(product.originalPrice)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90">
                                                        Thêm giỏ
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="border-rose-200">
                                                        <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
