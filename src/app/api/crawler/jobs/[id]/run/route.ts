import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    fetchPage,
    extractArticle,
    extractProduct,
    normalizeUrl,
    type CrawlSourceConfig
} from "@/lib/crawler";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/crawler/jobs/[id]/run - Run a single crawl job
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

        // Get job
        const job = await prisma.crawlJob.findUnique({
            where: { id },
            include: { source: true },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        if (job.status === "processing") {
            return NextResponse.json(
                { error: "Job is already processing" },
                { status: 400 }
            );
        }

        if (job.status === "success") {
            return NextResponse.json(
                { error: "Job already completed successfully" },
                { status: 400 }
            );
        }

        // Update status to processing
        await prisma.crawlJob.update({
            where: { id },
            data: { status: "processing", retryCount: job.retryCount + 1 },
        });

        try {
            // Check for duplicate in database
            const normalizedUrl = normalizeUrl(job.url);

            if (job.type === "article") {
                const existing = await prisma.article.findFirst({
                    where: { sourceUrl: normalizedUrl },
                });
                if (existing) {
                    await prisma.crawlJob.update({
                        where: { id },
                        data: {
                            status: "duplicate",
                            errorMessage: `Article already exists: ${existing.id}`,
                            processedAt: new Date(),
                        },
                    });
                    return NextResponse.json({
                        message: "URL đã được crawl trước đó",
                        status: "duplicate",
                        existingId: existing.id,
                    });
                }
            } else {
                const existing = await prisma.product.findFirst({
                    where: { sourceUrl: normalizedUrl },
                });
                if (existing) {
                    await prisma.crawlJob.update({
                        where: { id },
                        data: {
                            status: "duplicate",
                            errorMessage: `Product already exists: ${existing.id}`,
                            processedAt: new Date(),
                        },
                    });
                    return NextResponse.json({
                        message: "URL đã được crawl trước đó",
                        status: "duplicate",
                        existingId: existing.id,
                    });
                }
            }

            // Get config from source or use defaults
            const config: CrawlSourceConfig = job.source
                ? {
                    selectors: job.source.selectors as unknown as CrawlSourceConfig["selectors"],
                    transforms: job.source.transforms as unknown as CrawlSourceConfig["transforms"],
                    removeElements: job.source.removeElements as unknown as string[],
                    seoConfig: job.source.seoConfig as unknown as CrawlSourceConfig["seoConfig"],
                    imageConfig: job.source.imageConfig as unknown as CrawlSourceConfig["imageConfig"],
                    requestHeaders: job.source.requestHeaders as unknown as Record<string, string>,
                }
                : {
                    selectors: {
                        article: {
                            title: "h1",
                            content: "article, .article-content, .post-content, main",
                            excerpt: "meta[name='description']::attr(content)",
                            featuredImage: "meta[property='og:image']::attr(content)",
                        },
                        product: {
                            name: "h1",
                            price: ".price, [class*='price']",
                            description: ".description, .product-description",
                        },
                    },
                };

            // Fetch the page
            const html = await fetchPage(job.url, config.requestHeaders);

            // Extract content
            let extractedData: Record<string, unknown>;
            const baseUrl = new URL(job.url).origin;

            if (job.type === "article") {
                const selectors = config.selectors?.article;
                if (!selectors) {
                    throw new Error("No article selectors configured");
                }
                extractedData = extractArticle(html, selectors, config, baseUrl) as unknown as Record<string, unknown>;
            } else {
                const selectors = config.selectors?.product;
                if (!selectors) {
                    throw new Error("No product selectors configured");
                }
                extractedData = extractProduct(html, selectors, config, baseUrl) as unknown as Record<string, unknown>;
            }

            // Update job with extracted data
            await prisma.crawlJob.update({
                where: { id },
                data: {
                    status: "pending_review",
                    extractedData: extractedData as object,
                    processedAt: new Date(),
                    errorMessage: null,
                },
            });

            return NextResponse.json({
                message: "Crawl thành công - Đang chờ duyệt",
                status: "pending_review",
                data: extractedData,
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            await prisma.crawlJob.update({
                where: { id },
                data: {
                    status: "failed",
                    errorMessage,
                    processedAt: new Date(),
                },
            });

            return NextResponse.json({
                message: "Crawl thất bại",
                status: "failed",
                error: errorMessage,
            }, { status: 422 });
        }

    } catch (error) {
        console.error("Run crawl job error:", error);
        return NextResponse.json(
            { error: "Failed to run crawl job" },
            { status: 500 }
        );
    }
}
