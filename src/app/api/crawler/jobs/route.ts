import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CrawlType, CrawlStatus } from "@/generated/prisma";

// GET /api/crawler/jobs - List crawl jobs with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") as CrawlStatus | null;
        const type = searchParams.get("type") as CrawlType | null;
        const sourceId = searchParams.get("sourceId");

        const where: Record<string, unknown> = {};

        if (status && ["queued", "processing", "success", "failed", "duplicate", "pending_review"].includes(status)) {
            where.status = status;
        }

        if (type && ["article", "product"].includes(type)) {
            where.type = type;
        }

        if (sourceId) {
            where.sourceId = sourceId;
        }

        const [jobs, total] = await Promise.all([
            prisma.crawlJob.findMany({
                where,
                include: {
                    source: {
                        select: { id: true, name: true },
                    },
                    user: {
                        select: { id: true, fullName: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.crawlJob.count({ where }),
        ]);

        return NextResponse.json({
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("List crawl jobs error:", error);
        return NextResponse.json(
            { error: "Failed to fetch crawl jobs" },
            { status: 500 }
        );
    }
}

// POST /api/crawler/jobs - Create new crawl job(s)
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

        const body = await request.json();

        // Single URL or batch
        const urls: string[] = body.urls || (body.url ? [body.url] : []);

        if (urls.length === 0) {
            return NextResponse.json(
                { error: "At least one URL is required" },
                { status: 400 }
            );
        }

        if (urls.length > 50) {
            return NextResponse.json(
                { error: "Maximum 50 URLs per batch" },
                { status: 400 }
            );
        }

        const type: CrawlType = body.type || "article";
        const sourceId = body.sourceId || null;

        // Validate URLs
        const validUrls: string[] = [];
        const invalidUrls: string[] = [];

        for (const url of urls) {
            try {
                const parsed = new URL(url);
                // Block internal URLs
                if (["localhost", "127.0.0.1", "0.0.0.0"].some(h => parsed.hostname.includes(h))) {
                    invalidUrls.push(url);
                } else {
                    validUrls.push(url);
                }
            } catch {
                invalidUrls.push(url);
            }
        }

        if (validUrls.length === 0) {
            return NextResponse.json(
                { error: "No valid URLs provided", invalidUrls },
                { status: 400 }
            );
        }

        // Check for duplicates
        const existingJobs = await prisma.crawlJob.findMany({
            where: {
                url: { in: validUrls },
                status: { in: ["queued", "processing", "success", "pending_review"] },
            },
            select: { url: true },
        });

        const existingUrls = new Set(existingJobs.map(j => j.url));
        const newUrls = validUrls.filter(url => !existingUrls.has(url));

        if (newUrls.length === 0) {
            return NextResponse.json({
                message: "Tất cả URL đã được crawl trước đó",
                created: 0,
                duplicates: validUrls.length,
                jobs: [],
            });
        }

        // Create jobs
        const jobs = await prisma.crawlJob.createManyAndReturn({
            data: newUrls.map(url => ({
                url,
                type,
                sourceId,
                status: "queued",
                createdBy: userId,
            })),
        });

        return NextResponse.json({
            message: `Đã thêm ${jobs.length} URL vào hàng đợi`,
            created: jobs.length,
            duplicates: validUrls.length - newUrls.length,
            invalid: invalidUrls.length,
            jobs: jobs.map(j => ({ id: j.id, url: j.url, status: j.status })),
        }, { status: 201 });
    } catch (error) {
        console.error("Create crawl jobs error:", error);
        return NextResponse.json(
            { error: "Failed to create crawl jobs" },
            { status: 500 }
        );
    }
}
