import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Get a category by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "article";

        if (type === "article") {
            const category = await prisma.articleCategory.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                    _count: { select: { articles: true } }
                }
            });

            if (!category) {
                return notFoundResponse("Category not found");
            }

            return successResponse({
                ...category,
                articleCount: category._count.articles
            });
        } else {
            const category = await prisma.productCategory.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                    _count: { select: { products: true } }
                }
            });

            if (!category) {
                return notFoundResponse("Category not found");
            }

            return successResponse({
                ...category,
                productCount: category._count.products
            });
        }
    } catch (error) {
        console.error("Get category error:", error);
        return serverErrorResponse("Failed to fetch category");
    }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { type, name, slug, description, image, parentId, sortOrder } = body;

        if (!type) {
            return errorResponse("Type is required");
        }

        if (type === "article") {
            // Check if category exists
            const existing = await prisma.articleCategory.findUnique({
                where: { id }
            });
            if (!existing) {
                return notFoundResponse("Category not found");
            }

            // Check for slug conflict (if changing slug)
            if (slug && slug !== existing.slug) {
                const slugConflict = await prisma.articleCategory.findUnique({
                    where: { slug }
                });
                if (slugConflict) {
                    return errorResponse("Category with this slug already exists");
                }
            }

            // Prevent setting parent to self or descendants
            if (parentId === id) {
                return errorResponse("Category cannot be its own parent");
            }

            const category = await prisma.articleCategory.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(description !== undefined && { description }),
                    ...(image !== undefined && { image }),
                    ...(parentId !== undefined && { parentId }),
                    ...(sortOrder !== undefined && { sortOrder }),
                }
            });

            return successResponse(category, "Category updated successfully");
        } else {
            // Product category
            const existing = await prisma.productCategory.findUnique({
                where: { id }
            });
            if (!existing) {
                return notFoundResponse("Category not found");
            }

            if (slug && slug !== existing.slug) {
                const slugConflict = await prisma.productCategory.findUnique({
                    where: { slug }
                });
                if (slugConflict) {
                    return errorResponse("Category with this slug already exists");
                }
            }

            if (parentId === id) {
                return errorResponse("Category cannot be its own parent");
            }

            const category = await prisma.productCategory.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(description !== undefined && { description }),
                    ...(image !== undefined && { image }),
                    ...(parentId !== undefined && { parentId }),
                    ...(sortOrder !== undefined && { sortOrder }),
                }
            });

            return successResponse(category, "Category updated successfully");
        }
    } catch (error) {
        console.error("Update category error:", error);
        return serverErrorResponse("Failed to update category");
    }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "article";

        if (type === "article") {
            // Check if category exists
            const existing = await prisma.articleCategory.findUnique({
                where: { id },
                include: {
                    _count: { select: { articles: true, children: true } }
                }
            });

            if (!existing) {
                return notFoundResponse("Category not found");
            }

            // Check if category has articles
            if (existing._count.articles > 0) {
                return errorResponse(
                    `Cannot delete: category has ${existing._count.articles} articles. Move or delete them first.`
                );
            }

            // Check if category has children
            if (existing._count.children > 0) {
                return errorResponse(
                    `Cannot delete: category has ${existing._count.children} subcategories. Delete them first.`
                );
            }

            await prisma.articleCategory.delete({
                where: { id }
            });

            return successResponse(null, "Category deleted successfully");
        } else {
            // Product category
            const existing = await prisma.productCategory.findUnique({
                where: { id },
                include: {
                    _count: { select: { products: true, children: true } }
                }
            });

            if (!existing) {
                return notFoundResponse("Category not found");
            }

            if (existing._count.products > 0) {
                return errorResponse(
                    `Cannot delete: category has ${existing._count.products} products. Move or delete them first.`
                );
            }

            if (existing._count.children > 0) {
                return errorResponse(
                    `Cannot delete: category has ${existing._count.children} subcategories. Delete them first.`
                );
            }

            await prisma.productCategory.delete({
                where: { id }
            });

            return successResponse(null, "Category deleted successfully");
        }
    } catch (error) {
        console.error("Delete category error:", error);
        return serverErrorResponse("Failed to delete category");
    }
}
