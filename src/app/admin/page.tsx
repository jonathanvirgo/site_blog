"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    Package,
    ShoppingCart,
    Users,
    TrendingUp,
    TrendingDown,
    Eye,
    Cloud,
    Mail,
    Database,
    HardDrive,
    RefreshCw,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UsageMetric {
    used: number;
    limit: number;
    unit: string;
}

interface SystemUsage {
    cloudinary: {
        storage: UsageMetric;
        bandwidth: UsageMetric;
        transformations: UsageMetric;
    } | null;
    resend: {
        emails: UsageMetric;
    } | null;
    redis: {
        memory: UsageMetric;
    } | null;
    database: {
        size: UsageMetric;
    } | null;
    lastUpdated: string;
}

interface DashboardStats {
    articles: { total: number; change: string };
    products: { total: number; change: string };
    orders: { total: number; change: string };
    users: { total: number; change: string };
    revenue: { thisMonth: number; lastMonth: number; change: string };
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
}

interface TopArticle {
    id: string;
    title: string;
    slug: string;
    views: number;
}

interface DashboardData {
    stats: DashboardStats;
    recentOrders: RecentOrder[];
    topArticles: TopArticle[];
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function getUsageColor(percentage: number): string {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
}

function getUsageBgColor(percentage: number): string {
    if (percentage >= 80) return "bg-red-100 dark:bg-red-900/20";
    if (percentage >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-green-100 dark:bg-green-900/20";
}

function UsageCard({
    title,
    icon: Icon,
    used,
    limit,
    unit,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    used: number | undefined;
    limit: number | undefined;
    unit: string;
}) {
    if (used === undefined || limit === undefined) {
        return (
            <Card className="opacity-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Không có dữ liệu</p>
                </CardContent>
            </Card>
        );
    }

    const percentage = Math.min(Math.round((used / limit) * 100), 100);
    const isBytes = unit === "bytes";

    return (
        <Card className={getUsageBgColor(percentage)}>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{title}</span>
                    </div>
                    {percentage >= 80 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full ${getUsageColor(percentage)} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{percentage}%</span>
                    <span className="text-xs text-muted-foreground">
                        {isBytes ? formatBytes(used) : used.toLocaleString()} / {isBytes ? formatBytes(limit) : limit.toLocaleString()}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [systemUsage, setSystemUsage] = useState<SystemUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/dashboard");
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        }
    };

    const fetchUsage = async () => {
        try {
            const res = await fetch("/api/admin/system-usage");
            if (res.ok) {
                const data = await res.json();
                setSystemUsage(data);
            }
        } catch (error) {
            console.error("Failed to fetch system usage:", error);
        }
    };

    useEffect(() => {
        Promise.all([fetchDashboard(), fetchUsage()]).finally(() => {
            setLoading(false);
        });
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchDashboard(), fetchUsage()]);
        setRefreshing(false);
    };

    const lastUpdated = systemUsage?.lastUpdated
        ? new Date(systemUsage.lastUpdated).toLocaleString("vi-VN")
        : null;

    const stats = dashboardData?.stats;
    const recentOrders = dashboardData?.recentOrders || [];
    const topArticles = dashboardData?.topArticles || [];

    // Stats cards data
    const statsCards = [
        {
            title: "Tổng bài viết",
            value: stats?.articles.total || 0,
            change: stats?.articles.change || "0%",
            icon: FileText,
        },
        {
            title: "Sản phẩm",
            value: stats?.products.total || 0,
            change: stats?.products.change || "0%",
            icon: Package,
        },
        {
            title: "Đơn hàng",
            value: stats?.orders.total || 0,
            change: stats?.orders.change || "0%",
            icon: ShoppingCart,
        },
        {
            title: "Người dùng",
            value: stats?.users.total || 0,
            change: stats?.users.change || "0%",
            icon: Users,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Tổng quan hoạt động của hệ thống
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => {
                    const isPositive = stat.change.startsWith("+");
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                                <p className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"
                                    }`}>
                                    {isPositive ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {stat.change} so với tháng trước
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* System Usage */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Tài nguyên hệ thống
                    </h2>
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                            Cập nhật: {lastUpdated}
                        </span>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <UsageCard
                        title="Cloudinary Storage"
                        icon={Cloud}
                        used={systemUsage?.cloudinary?.storage?.used}
                        limit={systemUsage?.cloudinary?.storage?.limit}
                        unit="bytes"
                    />
                    <UsageCard
                        title="Email (Resend)"
                        icon={Mail}
                        used={systemUsage?.resend?.emails?.used}
                        limit={systemUsage?.resend?.emails?.limit}
                        unit="emails/month"
                    />
                    <UsageCard
                        title="Redis Memory"
                        icon={Database}
                        used={systemUsage?.redis?.memory?.used}
                        limit={systemUsage?.redis?.memory?.limit}
                        unit="bytes"
                    />
                    <UsageCard
                        title="Database (Supabase)"
                        icon={HardDrive}
                        used={systemUsage?.database?.size?.used}
                        limit={systemUsage?.database?.size?.limit}
                        unit="bytes"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Recent Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Đơn hàng gần đây
                        </CardTitle>
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm">Xem tất cả</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Chưa có đơn hàng nào
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{order.orderNumber}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.customer}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatPrice(order.total)}</p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Articles */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Bài viết xem nhiều
                        </CardTitle>
                        <Link href="/admin/articles">
                            <Button variant="ghost" size="sm">Xem tất cả</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {topArticles.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Chưa có bài viết nào
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {topArticles.map((article, i) => (
                                    <div
                                        key={article.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <Link
                                                href={`/bai-viet/${article.slug}`}
                                                className="font-medium line-clamp-1 hover:text-primary"
                                            >
                                                {article.title}
                                            </Link>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {article.views.toLocaleString()} views
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
