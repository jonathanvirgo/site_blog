import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/crawler/sources/[id] - Get single source
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const source = await prisma.crawlSource.findUnique({
            where: { id },
            include: {
                jobs: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        url: true,
                        status: true,
                        createdAt: true,
                        processedAt: true,
                    },
                },
            },
        });

        if (!source) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ source });
    } catch (error) {
        console.error("Get crawl source error:", error);
        return NextResponse.json(
            { error: "Failed to fetch crawl source" },
            { status: 500 }
        );
    }
}

// PUT /api/crawler/sources/[id] - Update source
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || userRole !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin only" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Check if source exists
        const existing = await prisma.crawlSource.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 }
            );
        }

        const source = await prisma.crawlSource.update({
            where: { id },
            data: {
                name: body.name ?? existing.name,
                baseUrl: body.baseUrl ?? existing.baseUrl,
                crawlType: body.crawlType ?? existing.crawlType,
                selectors: body.selectors ?? existing.selectors,
                transforms: body.transforms !== undefined ? body.transforms : existing.transforms,
                removeElements: body.removeElements !== undefined ? body.removeElements : existing.removeElements,
                seoConfig: body.seoConfig !== undefined ? body.seoConfig : existing.seoConfig,
                imageConfig: body.imageConfig !== undefined ? body.imageConfig : existing.imageConfig,
                paginationConfig: body.paginationConfig !== undefined ? body.paginationConfig : existing.paginationConfig,
                requestDelayMs: body.requestDelayMs ?? existing.requestDelayMs,
                requestHeaders: body.requestHeaders !== undefined ? body.requestHeaders : existing.requestHeaders,
                isActive: body.isActive ?? existing.isActive,
                // Category & list page settings
                defaultCategoryId: body.defaultCategoryId !== undefined ? body.defaultCategoryId : existing.defaultCategoryId,
                defaultStatus: body.defaultStatus ?? existing.defaultStatus,
                listPageEnabled: body.listPageEnabled ?? existing.listPageEnabled,
                categoryMappings: body.categoryMappings !== undefined ? body.categoryMappings : existing.categoryMappings,
                listItemSelector: body.listItemSelector !== undefined ? body.listItemSelector : existing.listItemSelector,
                listLinkSelector: body.listLinkSelector !== undefined ? body.listLinkSelector : existing.listLinkSelector,
                listImageSelector: body.listImageSelector !== undefined ? body.listImageSelector : existing.listImageSelector,
                listTitleSelector: body.listTitleSelector !== undefined ? body.listTitleSelector : existing.listTitleSelector,
                listMaxPages: body.listMaxPages ?? existing.listMaxPages,
            },
        });

        return NextResponse.json({ message: "Cập nhật nguồn thành công", source });
    } catch (error) {
        console.error("Update crawl source error:", error);
        return NextResponse.json(
            { error: "Failed to update crawl source" },
            { status: 500 }
        );
    }
}

// DELETE /api/crawler/sources/[id] - Delete source
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || userRole !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin only" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Check if source exists
        const existing = await prisma.crawlSource.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 }
            );
        }

        await prisma.crawlSource.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Đã xóa nguồn crawl" });
    } catch (error) {
        console.error("Delete crawl source error:", error);
        return NextResponse.json(
            { error: "Failed to delete crawl source" },
            { status: 500 }
        );
    }
}
