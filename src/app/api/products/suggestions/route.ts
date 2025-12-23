import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/products/suggestions - Get random product suggestions
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "6");
        const excludeProductId = searchParams.get("exclude");
        const excludeCategoryId = searchParams.get("excludeCategory");

        const skip = (page - 1) * limit;

        const products = await prisma.product.findMany({
            where: {
                id: excludeProductId ? { not: excludeProductId } : undefined,
                categoryId: excludeCategoryId ? { not: excludeCategoryId } : undefined,
                status: "active",
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                variants: {
                    where: { isDefault: true },
                    take: 1,
                    select: {
                        price: true,
                        salePrice: true,
                        isDefault: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" }
        });

        // Convert Decimal to number
        const formattedProducts = products.map(p => ({
            ...p,
            variants: p.variants.map(v => ({
                ...v,
                price: Number(v.price),
                salePrice: v.salePrice ? Number(v.salePrice) : null
            }))
        }));

        return NextResponse.json({
            products: formattedProducts,
            hasMore: products.length === limit
        });
    } catch (error) {
        console.error("Suggestions API error:", error);
        return NextResponse.json(
            { error: "Failed to load suggestions" },
            { status: 500 }
        );
    }
}
