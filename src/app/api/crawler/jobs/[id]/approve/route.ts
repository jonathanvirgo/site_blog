import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeUrl, type ExtractedArticle, type ExtractedProduct } from "@/lib/crawler";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/crawler/jobs/[id]/approve - Approve and create article/product
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Get job
        const job = await prisma.crawlJob.findUnique({
            where: { id },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        if (job.status !== "pending_review") {
            return NextResponse.json(
                { error: "Job is not pending review" },
                { status: 400 }
            );
        }

        if (!job.extractedData) {
            return NextResponse.json(
                { error: "No extracted data found" },
                { status: 400 }
            );
        }

        // Merge extracted data with any edits from the user
        const data = { ...(job.extractedData as Record<string, unknown>), ...body };
        const normalizedUrl = normalizeUrl(job.url);

        let createdItem: { id: string };

        if (job.type === "article") {
            const articleData = data as ExtractedArticle & {
                categoryId?: string;
                tagIds?: string[];
                status?: string;
            };

            // Generate slug
            const slug = generateSlug(articleData.title);
            const uniqueSlug = await ensureUniqueSlug("article", slug);

            // Create article
            createdItem = await prisma.article.create({
                data: {
                    title: articleData.title,
                    slug: uniqueSlug,
                    excerpt: articleData.excerpt || null,
                    content: articleData.content,
                    featuredImage: articleData.featuredImage || null,
                    authorId: userId,
                    categoryId: articleData.categoryId || null,
                    status: (articleData.status as "draft" | "published") || "draft",
                    metaTitle: articleData.metaTitle || articleData.title.slice(0, 60),
                    metaDescription: articleData.metaDescription || articleData.excerpt?.slice(0, 160) || null,
                    sourceUrl: normalizedUrl,
                    publishedAt: articleData.status === "published" ? new Date() : null,
                },
                select: { id: true },
            });

            // Handle tags if provided
            if (articleData.tagIds && articleData.tagIds.length > 0) {
                await prisma.articleTag.createMany({
                    data: articleData.tagIds.map((tagId: string) => ({
                        articleId: createdItem.id,
                        tagId,
                    })),
                });
            }

        } else {
            const productData = data as ExtractedProduct & {
                categoryId?: string;
                tagIds?: string[];
                status?: string;
            };

            // Generate slug
            const slug = generateSlug(productData.name);
            const uniqueSlug = await ensureUniqueSlug("product", slug);

            // Create product
            createdItem = await prisma.product.create({
                data: {
                    name: productData.name,
                    slug: uniqueSlug,
                    description: productData.description || null,
                    images: JSON.stringify(productData.images || []),
                    categoryId: productData.categoryId || null,
                    status: (productData.status as "draft" | "active") || "draft",
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

            // Handle tags if provided
            if (productData.tagIds && productData.tagIds.length > 0) {
                await prisma.productTag.createMany({
                    data: productData.tagIds.map((tagId: string) => ({
                        productId: createdItem.id,
                        tagId,
                    })),
                });
            }
        }

        // Update job status
        await prisma.crawlJob.update({
            where: { id },
            data: {
                status: "success",
                createdItemId: createdItem.id,
                createdItemType: job.type,
            },
        });

        return NextResponse.json({
            message: job.type === "article" ? "Đã tạo bài viết" : "Đã tạo sản phẩm",
            itemId: createdItem.id,
            type: job.type,
        });

    } catch (error) {
        console.error("Approve crawl job error:", error);
        return NextResponse.json(
            { error: "Failed to approve crawl job" },
            { status: 500 }
        );
    }
}

// Helper functions
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

async function ensureUniqueSlug(type: "article" | "product", baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 0;

    while (true) {
        const exists = type === "article"
            ? await prisma.article.findUnique({ where: { slug } })
            : await prisma.product.findUnique({ where: { slug } });

        if (!exists) return slug;

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}
