import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { articleSchema } from "@/lib/validations";

// GET /api/articles - List articles with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const featured = searchParams.get("featured");

        const where: Record<string, unknown> = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (featured === "true") {
            where.isFeatured = true;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { excerpt: { contains: search, mode: "insensitive" } },
            ];
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    featuredImage: true,
                    status: true,
                    isFeatured: true,
                    isNotable: true,
                    viewCount: true,
                    publishedAt: true,
                    createdAt: true,
                    author: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.article.count({ where }),
        ]);

        return NextResponse.json({
            articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("List articles error:", error);
        return NextResponse.json(
            { error: "Failed to fetch articles" },
            { status: 500 }
        );
    }
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
    try {
        // Get user from header (set by middleware)
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = articleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Generate slug if not provided
        if (!data.slug) {
            data.slug = data.title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .trim();
        }

        // Check slug uniqueness
        const existingSlug = await prisma.article.findUnique({
            where: { slug: data.slug },
        });

        if (existingSlug) {
            data.slug = `${data.slug}-${Date.now()}`;
        }

        // Create article
        const article = await prisma.article.create({
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                featuredImage: data.featuredImage,
                categoryId: data.categoryId,
                authorId: userId,
                status: data.status,
                isFeatured: data.isFeatured,
                isNotable: data.isNotable,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                publishedAt: data.status === "published" ? new Date() : null,
            },
            include: {
                author: {
                    select: { id: true, fullName: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        // Handle tags if provided
        if (data.tagIds && data.tagIds.length > 0) {
            await prisma.articleTag.createMany({
                data: data.tagIds.map((tagId: string) => ({
                    articleId: article.id,
                    tagId,
                })),
            });
        }

        return NextResponse.json(
            { message: "Tạo bài viết thành công", article },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create article error:", error);
        return NextResponse.json(
            { error: "Failed to create article" },
            { status: 500 }
        );
    }
}
