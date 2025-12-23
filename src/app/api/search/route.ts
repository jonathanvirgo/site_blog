import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

// GET /api/search - Mixed search for articles and products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q");
        const type = searchParams.get("type") || "all"; // all | articles | products
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const category = searchParams.get("category");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sort = searchParams.get("sort") || "relevance"; // relevance | newest | price_asc | price_desc

        if (!q || q.trim().length < 2) {
            return errorResponse("Search query must be at least 2 characters", 400);
        }

        const searchQuery = q.trim();
        const skip = (page - 1) * limit;

        let articles: unknown[] = [];
        let products: unknown[] = [];
        let totalArticles = 0;
        let totalProducts = 0;

        // Search articles
        if (type === "all" || type === "articles") {
            const articleWhere: Record<string, unknown> = {
                status: "published",
                deletedAt: null,
                OR: [
                    { title: { contains: searchQuery, mode: "insensitive" } },
                    { excerpt: { contains: searchQuery, mode: "insensitive" } },
                    { content: { contains: searchQuery, mode: "insensitive" } },
                ],
            };

            if (category) {
                articleWhere.category = { slug: category };
            }

            const articleOrderBy: Record<string, string> = {};
            if (sort === "newest") {
                articleOrderBy.publishedAt = "desc";
            } else {
                articleOrderBy.viewCount = "desc"; // relevance = most viewed
            }

            const [articlesResult, articleCount] = await Promise.all([
                prisma.article.findMany({
                    where: articleWhere,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        excerpt: true,
                        featuredImage: true,
                        publishedAt: true,
                        viewCount: true,
                        category: {
                            select: { id: true, name: true, slug: true },
                        },
                        author: {
                            select: { id: true, fullName: true },
                        },
                    },
                    orderBy: articleOrderBy,
                    skip: type === "articles" ? skip : 0,
                    take: type === "articles" ? limit : 5,
                }),
                prisma.article.count({ where: articleWhere }),
            ]);

            articles = articlesResult.map((a) => ({ ...a, type: "article" }));
            totalArticles = articleCount;
        }

        // Search products
        if (type === "all" || type === "products") {
            const productWhere: Record<string, unknown> = {
                status: "active",
                deletedAt: null,
                OR: [
                    { name: { contains: searchQuery, mode: "insensitive" } },
                    { description: { contains: searchQuery, mode: "insensitive" } },
                    { shortDescription: { contains: searchQuery, mode: "insensitive" } },
                ],
            };

            if (category) {
                productWhere.category = { slug: category };
            }

            // Price filter - need to filter via variants
            const variantFilter: Record<string, unknown> = {};
            if (minPrice) {
                variantFilter.price = { gte: parseFloat(minPrice) };
            }
            if (maxPrice) {
                variantFilter.price = { ...variantFilter.price as object, lte: parseFloat(maxPrice) };
            }

            if (Object.keys(variantFilter).length > 0) {
                productWhere.variants = { some: variantFilter };
            }

            const productOrderBy: Record<string, unknown>[] = [];
            if (sort === "newest") {
                productOrderBy.push({ createdAt: "desc" });
            } else if (sort === "price_asc") {
                // Sort by default variant price - handled in post-processing
            } else if (sort === "price_desc") {
                // Sort by default variant price - handled in post-processing
            } else {
                productOrderBy.push({ isFeatured: "desc" });
            }

            const [productsResult, productCount] = await Promise.all([
                prisma.product.findMany({
                    where: productWhere,
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        shortDescription: true,
                        images: true,
                        isFeatured: true,
                        category: {
                            select: { id: true, name: true, slug: true },
                        },
                        variants: {
                            where: { isDefault: true },
                            select: {
                                id: true,
                                price: true,
                                salePrice: true,
                                stockQuantity: true,
                            },
                            take: 1,
                        },
                    },
                    orderBy: productOrderBy.length > 0 ? productOrderBy : undefined,
                    skip: type === "products" ? skip : 0,
                    take: type === "products" ? limit : 5,
                }),
                prisma.product.count({ where: productWhere }),
            ]);

            // Transform products
            products = productsResult.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                shortDescription: p.shortDescription,
                image: (p.images as string[])?.[0] || null,
                price: p.variants[0] ? Number(p.variants[0].salePrice || p.variants[0].price) : 0,
                originalPrice: p.variants[0] ? Number(p.variants[0].price) : 0,
                inStock: p.variants[0] ? p.variants[0].stockQuantity > 0 : false,
                category: p.category,
                type: "product",
            }));

            // Sort by price if requested
            if (sort === "price_asc") {
                products.sort((a, b) => (a as { price: number }).price - (b as { price: number }).price);
            } else if (sort === "price_desc") {
                products.sort((a, b) => (b as { price: number }).price - (a as { price: number }).price);
            }

            totalProducts = productCount;
        }

        return successResponse({
            articles,
            products,
            totalArticles,
            totalProducts,
            pagination: {
                page,
                limit,
                total: type === "articles" ? totalArticles : type === "products" ? totalProducts : totalArticles + totalProducts,
            },
        });
    } catch (error) {
        console.error("Search error:", error);
        return serverErrorResponse("Failed to perform search");
    }
}
