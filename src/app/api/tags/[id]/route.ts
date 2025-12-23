import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tags/[id] - Get a tag by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        articles: true,
                        products: true
                    }
                }
            }
        });

        if (!tag) {
            return notFoundResponse("Tag not found");
        }

        return successResponse({
            ...tag,
            articleCount: tag._count.articles,
            productCount: tag._count.products
        });
    } catch (error) {
        console.error("Get tag error:", error);
        return serverErrorResponse("Failed to fetch tag");
    }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, slug, type } = body;

        // Check if tag exists
        const existing = await prisma.tag.findUnique({
            where: { id }
        });
        if (!existing) {
            return notFoundResponse("Tag not found");
        }

        // Check for slug conflict
        if (slug && slug !== existing.slug) {
            const slugConflict = await prisma.tag.findUnique({
                where: { slug }
            });
            if (slugConflict) {
                return errorResponse("Tag with this slug already exists");
            }
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(slug !== undefined && { slug }),
                ...(type !== undefined && { type: type as "article" | "product" | "both" }),
            }
        });

        return successResponse(tag, "Tag updated successfully");
    } catch (error) {
        console.error("Update tag error:", error);
        return serverErrorResponse("Failed to update tag");
    }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if tag exists
        const existing = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true, products: true }
                }
            }
        });

        if (!existing) {
            return notFoundResponse("Tag not found");
        }

        // Delete the tag (cascade will remove article_tags and product_tags)
        await prisma.tag.delete({
            where: { id }
        });

        return successResponse(null, "Tag deleted successfully");
    } catch (error) {
        console.error("Delete tag error:", error);
        return serverErrorResponse("Failed to delete tag");
    }
}
