import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const featured = searchParams.get("featured");

        const where: Record<string, unknown> = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (featured === "true") {
            where.isFeatured = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { shortDescription: { contains: search, mode: "insensitive" } },
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    shortDescription: true,
                    images: true,
                    status: true,
                    isFeatured: true,
                    hasVariants: true,
                    createdAt: true,
                    category: {
                        select: { id: true, name: true, slug: true },
                    },
                    variants: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            salePrice: true,
                            stockQuantity: true,
                            isDefault: true,
                        },
                        where: { isDefault: true },
                        take: 1,
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("List products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product with variants
export async function POST(request: NextRequest) {
    try {
        const userRole = request.headers.get("x-user-role");
        if (!["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = productSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error },
                { status: 400 }
            );
        }

        const data = validation.data;
        const { variants, ...productData } = body;

        // Generate slug if not provided
        if (!productData.slug) {
            productData.slug = productData.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .trim();
        }

        // Create product with variants
        const product = await prisma.product.create({
            data: {
                name: productData.name,
                slug: productData.slug,
                description: productData.description,
                shortDescription: productData.shortDescription,
                images: productData.images || [],
                categoryId: productData.categoryId,
                status: productData.status,
                isFeatured: productData.isFeatured,
                hasVariants: productData.hasVariants,
                metaTitle: productData.metaTitle,
                metaDescription: productData.metaDescription,
                variants: {
                    create: variants?.map((v: Record<string, unknown>, i: number) => ({
                        sku: v.sku as string,
                        price: v.price as number,
                        salePrice: v.salePrice as number | undefined,
                        stockQuantity: v.stock as number || 0,
                        isDefault: i === 0,
                    })) || [{
                        sku: `${productData.slug}-DEFAULT`,
                        price: 0,
                        stockQuantity: 0,
                        isDefault: true,
                    }],
                },
            },
            include: {
                category: true,
                variants: true,
            },
        });

        return NextResponse.json(
            { message: "Tạo sản phẩm thành công", product },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create product error:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
