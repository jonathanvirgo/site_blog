import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    fetchPage,
    extractArticle,
    extractProduct,
    normalizeUrl,
    type CrawlSourceConfig
} from "@/lib/crawler";

// Helper to generate slug from Vietnamese title
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .slice(0, 100);
}

// Check if slug exists (throw error, don't auto-suffix)
async function checkSlugExists(type: "article" | "product", slug: string): Promise<boolean> {
    const exists = type === "article"
        ? await prisma.article.findUnique({ where: { slug } })
        : await prisma.product.findUnique({ where: { slug } });
    return !!exists;
}

interface BatchCrawlRequest {
    sourceId: string;
    urls: string[];
    categoryId: string;
    status: string; // draft | published | active
    type: "article" | "product";
}

interface CrawlResultItem {
    url: string;
    status: "success" | "failed" | "duplicate" | "slug_conflict";
    error?: string;
    itemId?: string;
    slug?: string;
    title?: string;
}

// POST /api/crawler/batch - Batch crawl with auto-approve
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body: BatchCrawlRequest = await request.json();

        // Validate required fields
        if (!body.sourceId || !body.urls || body.urls.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields: sourceId, urls" },
                { status: 400 }
            );
        }

        if (!body.categoryId) {
            return NextResponse.json(
                { error: "Category is required for batch crawl" },
                { status: 400 }
            );
        }

        // Get source configuration
        const source = await prisma.crawlSource.findUnique({
            where: { id: body.sourceId },
        });

        if (!source) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 }
            );
        }

        const type = body.type || source.crawlType;
        const status = body.status || "draft";

        // Build config from source
        const config: CrawlSourceConfig = {
            selectors: source.selectors as unknown as CrawlSourceConfig["selectors"],
            transforms: source.transforms as unknown as CrawlSourceConfig["transforms"],
            removeElements: source.removeElements as unknown as string[],
            seoConfig: source.seoConfig as unknown as CrawlSourceConfig["seoConfig"],
            imageConfig: source.imageConfig as unknown as CrawlSourceConfig["imageConfig"],
            requestHeaders: source.requestHeaders as unknown as Record<string, string>,
            requestDelayMs: source.requestDelayMs,
        };

        const results: CrawlResultItem[] = [];

        // Process each URL
        for (const url of body.urls) {
            const trimmedUrl = url.trim();
            if (!trimmedUrl) continue;

            try {
                const normalizedUrl = normalizeUrl(trimmedUrl);

                // Check for duplicate by sourceUrl
                if (type === "article") {
                    const existing = await prisma.article.findFirst({
                        where: { sourceUrl: normalizedUrl },
                    });
                    if (existing) {
                        results.push({
                            url: trimmedUrl,
                            status: "duplicate",
                            error: "Bài viết đã tồn tại với URL này",
                            itemId: existing.id,
                        });
                        continue;
                    }
                } else {
                    const existing = await prisma.product.findFirst({
                        where: { sourceUrl: normalizedUrl },
                    });
                    if (existing) {
                        results.push({
                            url: trimmedUrl,
                            status: "duplicate",
                            error: "Sản phẩm đã tồn tại với URL này",
                            itemId: existing.id,
                        });
                        continue;
                    }
                }

                // Fetch and extract content
                const html = await fetchPage(trimmedUrl, config.requestHeaders);
                const baseUrl = new URL(trimmedUrl).origin;

                let extractedData: Record<string, unknown>;
                let title: string;

                if (type === "article") {
                    const selectors = config.selectors?.article;
                    if (!selectors) {
                        throw new Error("No article selectors configured");
                    }
                    const articleData = extractArticle(html, selectors, config, baseUrl);
                    extractedData = articleData as unknown as Record<string, unknown>;
                    title = articleData.title;
                } else {
                    const selectors = config.selectors?.product;
                    if (!selectors) {
                        throw new Error("No product selectors configured");
                    }
                    const productData = extractProduct(html, selectors, config, baseUrl);
                    extractedData = productData as unknown as Record<string, unknown>;
                    title = productData.name;
                }

                if (!title) {
                    results.push({
                        url: trimmedUrl,
                        status: "failed",
                        error: "Không tìm thấy tiêu đề",
                    });
                    continue;
                }

                // Generate and check slug
                const slug = generateSlug(title);
                const slugExists = await checkSlugExists(type, slug);

                if (slugExists) {
                    results.push({
                        url: trimmedUrl,
                        status: "slug_conflict",
                        error: `Slug "${slug}" đã tồn tại`,
                        slug,
                        title,
                    });
                    continue;
                }

                // Create article/product
                let createdItem: { id: string };

                if (type === "article") {
                    const articleData = extractedData as {
                        title: string;
                        content: string;
                        excerpt?: string;
                        featuredImage?: string;
                        metaTitle?: string;
                        metaDescription?: string;
                        images?: string[];
                    };

                    // Featured image priority:
                    // 1. body.listImageUrl (from category page - passed per URL if available)
                    // 2. articleData.featuredImage (from detail selectors)
                    // 3. First image in content
                    let featuredImage = articleData.featuredImage || null;
                    if (!featuredImage && articleData.images && articleData.images.length > 0) {
                        featuredImage = articleData.images[0];
                    }

                    createdItem = await prisma.article.create({
                        data: {
                            title: articleData.title,
                            slug,
                            excerpt: articleData.excerpt || null,
                            content: articleData.content,
                            featuredImage,
                            authorId: userId,
                            categoryId: body.categoryId,
                            status: status as "draft" | "published",
                            metaTitle: articleData.metaTitle || articleData.title.slice(0, 60),
                            metaDescription: articleData.metaDescription || articleData.excerpt?.slice(0, 160) || null,
                            sourceUrl: normalizedUrl,
                            publishedAt: status === "published" ? new Date() : null,
                        },
                        select: { id: true },
                    });
                } else {
                    const productData = extractedData as {
                        name: string;
                        description?: string;
                        price?: number | null;
                        originalPrice?: number | null;
                        images?: string[];
                        sku?: string;
                        metaTitle?: string;
                        metaDescription?: string;
                    };

                    createdItem = await prisma.product.create({
                        data: {
                            name: productData.name,
                            slug,
                            description: productData.description || null,
                            images: JSON.stringify(productData.images || []),
                            categoryId: body.categoryId,
                            status: status as "draft" | "active",
                            metaTitle: productData.metaTitle || productData.name.slice(0, 60),
                            metaDescription: productData.metaDescription || productData.description?.slice(0, 160) || null,
                            sourceUrl: normalizedUrl,
                        },
                        select: { id: true },
                    });

                    // Create variant if price exists
                    if (productData.price) {
                        await prisma.productVariant.create({
                            data: {
                                productId: createdItem.id,
                                sku: productData.sku || `SKU-${Date.now()}`,
                                price: productData.price,
                                salePrice: productData.originalPrice || null,
                                stockQuantity: 0,
                            },
                        });
                    }
                }

                results.push({
                    url: trimmedUrl,
                    status: "success",
                    itemId: createdItem.id,
                    slug,
                    title,
                });

                // Delay between requests
                if (config.requestDelayMs && config.requestDelayMs > 0) {
                    await new Promise(r => setTimeout(r, config.requestDelayMs));
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                results.push({
                    url: trimmedUrl,
                    status: "failed",
                    error: errorMessage,
                });
            }
        }

        const successCount = results.filter(r => r.status === "success").length;
        const failedCount = results.filter(r => r.status === "failed").length;
        const duplicateCount = results.filter(r => r.status === "duplicate").length;
        const slugConflictCount = results.filter(r => r.status === "slug_conflict").length;

        return NextResponse.json({
            message: `Đã xử lý ${results.length} URLs: ${successCount} thành công, ${failedCount} thất bại, ${duplicateCount} trùng lặp, ${slugConflictCount} trùng slug`,
            success: successCount,
            failed: failedCount,
            duplicate: duplicateCount,
            slugConflict: slugConflictCount,
            results,
        });

    } catch (error) {
        console.error("Batch crawl error:", error);
        return NextResponse.json(
            { error: "Failed to process batch crawl" },
            { status: 500 }
        );
    }
}
