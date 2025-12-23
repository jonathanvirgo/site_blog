import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CrawlType } from "@/generated/prisma";

// GET /api/crawler/sources - List all crawl sources
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get("active");
        const type = searchParams.get("type") as CrawlType | null;

        const where: Record<string, unknown> = {};

        if (active === "true") {
            where.isActive = true;
        } else if (active === "false") {
            where.isActive = false;
        }

        if (type && ["article", "product"].includes(type)) {
            where.crawlType = type;
        }

        const sources = await prisma.crawlSource.findMany({
            where,
            include: {
                _count: {
                    select: { jobs: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Add job statistics for each source
        const sourcesWithStats = await Promise.all(sources.map(async (source) => {
            const stats = await prisma.crawlJob.groupBy({
                by: ['status'],
                where: { sourceId: source.id },
                _count: { status: true }
            });

            const statusCounts = stats.reduce((acc, s) => {
                acc[s.status] = s._count.status;
                return acc;
            }, {} as Record<string, number>);

            const lastJob = await prisma.crawlJob.findFirst({
                where: { sourceId: source.id },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, status: true }
            });

            return {
                ...source,
                stats: {
                    totalJobs: source._count.jobs,
                    successful: statusCounts.success || 0,
                    failed: statusCounts.failed || 0,
                    pending: (statusCounts.queued || 0) + (statusCounts.processing || 0) + (statusCounts.pending_review || 0),
                },
                lastCrawl: lastJob?.createdAt || null,
                lastStatus: lastJob?.status || null,
            };
        }));

        return NextResponse.json({ sources: sourcesWithStats });
    } catch (error) {
        console.error("List crawl sources error:", error);
        return NextResponse.json(
            { error: "Failed to fetch crawl sources" },
            { status: 500 }
        );
    }
}

// POST /api/crawler/sources - Create new crawl source
export async function POST(request: NextRequest) {
    try {
        // Check admin auth
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || userRole !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin only" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.baseUrl || !body.selectors) {
            return NextResponse.json(
                { error: "Missing required fields: name, baseUrl, selectors" },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(body.baseUrl);
        } catch {
            return NextResponse.json(
                { error: "Invalid baseUrl format" },
                { status: 400 }
            );
        }

        const source = await prisma.crawlSource.create({
            data: {
                name: body.name,
                baseUrl: body.baseUrl,
                crawlType: body.crawlType || "article",
                selectors: body.selectors || {},
                transforms: body.transforms || null,
                removeElements: body.removeElements || null,
                seoConfig: body.seoConfig || null,
                imageConfig: body.imageConfig || null,
                paginationConfig: body.paginationConfig || null,
                requestDelayMs: body.requestDelayMs || 1000,
                requestHeaders: body.requestHeaders || null,
                isActive: body.isActive ?? true,
                // Category & list page settings
                defaultCategoryId: body.defaultCategoryId || null,
                defaultStatus: body.defaultStatus || "draft",
                listPageEnabled: body.listPageEnabled ?? false,
                categoryMappings: body.categoryMappings || null,
                listItemSelector: body.listItemSelector || null,
                listLinkSelector: body.listLinkSelector || null,
                listImageSelector: body.listImageSelector || null,
                listTitleSelector: body.listTitleSelector || null,
                listMaxPages: body.listMaxPages || 5,
            },
        });

        return NextResponse.json(
            { message: "Tạo nguồn crawl thành công", source },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create crawl source error:", error);
        return NextResponse.json(
            { error: "Failed to create crawl source" },
            { status: 500 }
        );
    }
}
