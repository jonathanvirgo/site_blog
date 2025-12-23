import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/trash - Get all trashed items
export async function GET() {
    try {
        const [articles, products] = await Promise.all([
            prisma.article.findMany({
                where: { deletedAt: { not: null } },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    featuredImage: true,
                    deletedAt: true,
                    author: { select: { fullName: true } },
                },
                orderBy: { deletedAt: "desc" },
            }),
            prisma.product.findMany({
                where: { deletedAt: { not: null } },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: true,
                    deletedAt: true,
                },
                orderBy: { deletedAt: "desc" },
            }),
        ]);

        return NextResponse.json({
            articles,
            products,
            totalArticles: articles.length,
            totalProducts: products.length,
        });
    } catch (error) {
        console.error("Get trash error:", error);
        return NextResponse.json(
            { error: "Failed to fetch trash" },
            { status: 500 }
        );
    }
}

// DELETE /api/trash - Empty trash (delete all permanently)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // 'articles' | 'products' | 'all'

        let deletedArticles = 0;
        let deletedProducts = 0;

        if (type === "articles" || type === "all") {
            const result = await prisma.article.deleteMany({
                where: { deletedAt: { not: null } },
            });
            deletedArticles = result.count;
        }

        if (type === "products" || type === "all") {
            // Delete related records first
            const trashedProducts = await prisma.product.findMany({
                where: { deletedAt: { not: null } },
                select: { id: true },
            });

            const productIds = trashedProducts.map((p: { id: string }) => p.id);

            await prisma.productTag.deleteMany({ where: { productId: { in: productIds } } });
            await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
            await prisma.productAttribute.deleteMany({ where: { productId: { in: productIds } } });

            const result = await prisma.product.deleteMany({
                where: { deletedAt: { not: null } },
            });
            deletedProducts = result.count;
        }

        return NextResponse.json({
            message: "Đã xóa vĩnh viễn thùng rác",
            deletedArticles,
            deletedProducts,
        });
    } catch (error) {
        console.error("Empty trash error:", error);
        return NextResponse.json(
            { error: "Failed to empty trash" },
            { status: 500 }
        );
    }
}
