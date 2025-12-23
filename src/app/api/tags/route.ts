import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

// GET /api/tags - List all tags
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // article | product | both | null
        const search = searchParams.get("search") || "";

        const tags = await prisma.tag.findMany({
            where: {
                ...(type && { type: type as "article" | "product" | "both" }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { slug: { contains: search, mode: "insensitive" } }
                    ]
                })
            },
            include: {
                _count: {
                    select: {
                        articles: true,
                        products: true
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        const formattedTags = tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            type: tag.type,
            createdAt: tag.createdAt,
            articleCount: tag._count.articles,
            productCount: tag._count.products,
            totalUsage: tag._count.articles + tag._count.products
        }));

        return successResponse(formattedTags);
    } catch (error) {
        console.error("Get tags error:", error);
        return serverErrorResponse("Failed to fetch tags");
    }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, slug, type = "both" } = body;

        if (!name || !slug) {
            return errorResponse("Name and slug are required");
        }

        // Check for existing slug
        const existing = await prisma.tag.findUnique({
            where: { slug }
        });
        if (existing) {
            return errorResponse("Tag with this slug already exists");
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                slug,
                type: type as "article" | "product" | "both"
            }
        });

        return successResponse(tag, "Tag created successfully");
    } catch (error) {
        console.error("Create tag error:", error);
        return serverErrorResponse("Failed to create tag");
    }
}
