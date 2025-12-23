import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const offset = parseInt(searchParams.get("offset") || "0");
        const limit = parseInt(searchParams.get("limit") || "10");
        const excludeIdsParam = searchParams.get("excludeIds") || "";
        const excludeIds = excludeIdsParam ? excludeIdsParam.split(",").filter(Boolean) : [];

        const articles = await prisma.article.findMany({
            where: {
                status: "published",
                deletedAt: null,
                ...(excludeIds.length > 0 && {
                    id: {
                        notIn: excludeIds,
                    },
                }),
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                featuredImage: true,
                publishedAt: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                publishedAt: "desc",
            },
            skip: offset,
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: articles,
            pagination: {
                offset,
                limit,
                hasMore: articles.length === limit,
            },
        });
    } catch (error) {
        console.error("Error fetching latest articles:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch articles" },
            { status: 500 }
        );
    }
}
