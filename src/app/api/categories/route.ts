import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse } from "@/lib/api-response";
import { getArticleCategories, getProductCategories, CachedCategory } from "@/lib/cache";
import prisma from "@/lib/prisma";

interface CategoryWithChildren extends CachedCategory {
    children?: CategoryWithChildren[];
}

// GET /api/categories - Get categories by type
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all"; // article | product | all

        let articleCategories: CachedCategory[] = [];
        let productCategories: CachedCategory[] = [];

        if (type === "article" || type === "all") {
            articleCategories = await getArticleCategories();
        }

        if (type === "product" || type === "all") {
            productCategories = await getProductCategories();
        }

        // Build hierarchical structure
        const buildTree = (
            categories: CachedCategory[],
            parentId: string | null = null
        ): CategoryWithChildren[] => {
            return categories
                .filter((cat) => cat.parentId === parentId)
                .map((cat) => ({
                    ...cat,
                    children: buildTree(categories, cat.id),
                }));
        };

        const data = {
            ...(type === "all" || type === "article"
                ? { articleCategories: buildTree(articleCategories) }
                : {}),
            ...(type === "all" || type === "product"
                ? { productCategories: buildTree(productCategories) }
                : {}),
        };

        return successResponse(data);
    } catch (error) {
        console.error("Get categories error:", error);
        return serverErrorResponse("Failed to fetch categories");
    }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, slug, description, image, parentId, sortOrder } = body;

        // Validate required fields
        if (!type || !name || !slug) {
            return errorResponse("Type, name, and slug are required");
        }

        if (type !== "article" && type !== "product") {
            return errorResponse("Type must be 'article' or 'product'");
        }

        if (type === "article") {
            // Check for existing slug
            const existing = await prisma.articleCategory.findUnique({
                where: { slug }
            });
            if (existing) {
                return errorResponse("Category with this slug already exists");
            }

            const category = await prisma.articleCategory.create({
                data: {
                    name,
                    slug,
                    description: description || null,
                    image: image || null,
                    parentId: parentId || null,
                    sortOrder: sortOrder || 0,
                }
            });

            return successResponse(category, "Category created successfully");
        } else {
            // Product category
            const existing = await prisma.productCategory.findUnique({
                where: { slug }
            });
            if (existing) {
                return errorResponse("Category with this slug already exists");
            }

            const category = await prisma.productCategory.create({
                data: {
                    name,
                    slug,
                    description: description || null,
                    image: image || null,
                    parentId: parentId || null,
                    sortOrder: sortOrder || 0,
                }
            });

            return successResponse(category, "Category created successfully");
        }
    } catch (error) {
        console.error("Create category error:", error);
        return serverErrorResponse("Failed to create category");
    }
}
