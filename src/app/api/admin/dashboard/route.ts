import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get dashboard statistics
export async function GET() {
    try {
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get current counts
        const [
            articleCount,
            productCount,
            orderCount,
            userCount,
            // Last month counts for comparison
            articlesLastMonth,
            productsLastMonth,
            ordersLastMonth,
            usersLastMonth,
            // This month counts
            articlesThisMonth,
            productsThisMonth,
            ordersThisMonth,
            usersThisMonth,
            // Revenue
            revenueThisMonth,
            revenueLastMonth,
            // Recent orders
            recentOrders,
            // Top articles
            topArticles,
        ] = await Promise.all([
            // Total counts
            prisma.article.count({ where: { deletedAt: null } }),
            prisma.product.count(),
            prisma.order.count(),
            prisma.user.count(),

            // Last month counts
            prisma.article.count({
                where: {
                    createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
                    deletedAt: null
                }
            }),
            prisma.product.count({
                where: { createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } }
            }),
            prisma.order.count({
                where: { createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } }
            }),
            prisma.user.count({
                where: { createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } }
            }),

            // This month counts
            prisma.article.count({
                where: {
                    createdAt: { gte: firstDayThisMonth },
                    deletedAt: null
                }
            }),
            prisma.product.count({
                where: { createdAt: { gte: firstDayThisMonth } }
            }),
            prisma.order.count({
                where: { createdAt: { gte: firstDayThisMonth } }
            }),
            prisma.user.count({
                where: { createdAt: { gte: firstDayThisMonth } }
            }),

            // Revenue this month
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: firstDayThisMonth },
                    status: { not: "cancelled" }
                },
                _sum: { totalAmount: true }
            }),

            // Revenue last month
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
                    status: { not: "cancelled" }
                },
                _sum: { totalAmount: true }
            }),

            // Recent orders (last 5)
            prisma.order.findMany({
                select: {
                    id: true,
                    orderNumber: true,
                    shippingName: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),

            // Top articles by views
            prisma.article.findMany({
                where: {
                    status: "published",
                    deletedAt: null
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    viewCount: true,
                },
                orderBy: { viewCount: "desc" },
                take: 5,
            }),
        ]);

        // Calculate percentage changes
        const calculateChange = (thisMonth: number, lastMonth: number): string => {
            if (lastMonth === 0) return thisMonth > 0 ? "+100%" : "0%";
            const change = ((thisMonth - lastMonth) / lastMonth) * 100;
            return `${change >= 0 ? "+" : ""}${Math.round(change)}%`;
        };

        const stats = {
            articles: {
                total: articleCount,
                change: calculateChange(articlesThisMonth, articlesLastMonth),
            },
            products: {
                total: productCount,
                change: calculateChange(productsThisMonth, productsLastMonth),
            },
            orders: {
                total: orderCount,
                change: calculateChange(ordersThisMonth, ordersLastMonth),
            },
            users: {
                total: userCount,
                change: calculateChange(usersThisMonth, usersLastMonth),
            },
            revenue: {
                thisMonth: revenueThisMonth._sum.totalAmount || 0,
                lastMonth: revenueLastMonth._sum.totalAmount || 0,
                change: calculateChange(
                    Number(revenueThisMonth._sum.totalAmount || 0),
                    Number(revenueLastMonth._sum.totalAmount || 0)
                ),
            },
        };

        // Format recent orders
        const formattedOrders = recentOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.shippingName,
            total: Number(order.totalAmount),
            status: order.status,
            createdAt: order.createdAt.toISOString(),
        }));

        // Format top articles
        const formattedArticles = topArticles.map(article => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            views: article.viewCount,
        }));

        return NextResponse.json({
            success: true,
            data: {
                stats,
                recentOrders: formattedOrders,
                topArticles: formattedArticles,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
