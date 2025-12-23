import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { sendDeletionNotificationEmail } from "@/lib/email";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/articles/[id] - Get single article
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const article = await prisma.article.findFirst({
            where: { id, deletedAt: null },
            include: {
                author: {
                    select: { id: true, fullName: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                tags: {
                    include: {
                        tag: { select: { id: true, name: true, slug: true } },
                    },
                },
            },
        });

        if (!article) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error("Get article error:", error);
        return NextResponse.json(
            { error: "Failed to fetch article" },
            { status: 500 }
        );
    }
}

// PUT /api/articles/[id] - Update article
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Get current article to check for image change
        const currentArticle = await prisma.article.findFirst({
            where: { id, deletedAt: null },
            select: { featuredImage: true },
        });

        if (!currentArticle) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        // If image changed, delete old image from Cloudinary
        if (
            currentArticle.featuredImage &&
            body.featuredImage !== currentArticle.featuredImage
        ) {
            const oldPublicId = extractPublicIdFromUrl(currentArticle.featuredImage);
            if (oldPublicId) {
                await deleteImage(oldPublicId);
            }
        }

        const article = await prisma.article.update({
            where: { id },
            data: {
                title: body.title,
                slug: body.slug,
                excerpt: body.excerpt,
                content: body.content,
                featuredImage: body.featuredImage,
                categoryId: body.categoryId,
                status: body.status,
                isFeatured: body.isFeatured,
                isNotable: body.isNotable,
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription,
                publishedAt: body.status === "published" ? new Date() : null,
            },
            include: {
                author: { select: { id: true, fullName: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        // Update tags
        if (body.tagIds) {
            await prisma.articleTag.deleteMany({ where: { articleId: id } });

            if (body.tagIds.length > 0) {
                await prisma.articleTag.createMany({
                    data: body.tagIds.map((tagId: string) => ({
                        articleId: id,
                        tagId,
                    })),
                });
            }
        }

        return NextResponse.json({
            message: "Cập nhật bài viết thành công",
            article,
        });
    } catch (error) {
        console.error("Update article error:", error);
        return NextResponse.json(
            { error: "Failed to update article" },
            { status: 500 }
        );
    }
}

// DELETE /api/articles/[id] - Soft delete article (move to trash)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get("permanent") === "true";

        const article = await prisma.article.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                featuredImage: true,
                deletedAt: true,
                author: { select: { fullName: true } },
            },
        });

        if (!article) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        if (permanent) {
            // Permanent delete - remove from DB and Cloudinary
            await prisma.articleTag.deleteMany({ where: { articleId: id } });
            await prisma.article.delete({ where: { id } });

            // Delete image from Cloudinary
            if (article.featuredImage) {
                const publicId = extractPublicIdFromUrl(article.featuredImage);
                if (publicId) {
                    await deleteImage(publicId);
                }
            }

            return NextResponse.json({
                message: "Xóa vĩnh viễn thành công",
                deletedImage: !!article.featuredImage,
            });
        } else {
            // Soft delete - move to trash
            await prisma.article.update({
                where: { id },
                data: { deletedAt: new Date() },
            });

            // Send email notification to admin (async, don't wait)
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            sendDeletionNotificationEmail({
                items: [{
                    id: article.id,
                    name: article.title,
                    type: "article",
                    image: article.featuredImage || undefined,
                }],
                deletedBy: article.author?.fullName || "Admin",
                trashUrl: `${baseUrl}/admin/trash`,
            }).catch((err) => console.error("Failed to send deletion email:", err));

            return NextResponse.json({
                message: "Đã chuyển vào thùng rác",
            });
        }
    } catch (error) {
        console.error("Delete article error:", error);
        return NextResponse.json(
            { error: "Failed to delete article" },
            { status: 500 }
        );
    }
}


// PATCH /api/articles/[id] - Restore article from trash
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const article = await prisma.article.findFirst({
            where: { id, deletedAt: { not: null } },
        });

        if (!article) {
            return NextResponse.json(
                { error: "Article not found in trash" },
                { status: 404 }
            );
        }

        await prisma.article.update({
            where: { id },
            data: { deletedAt: null },
        });

        return NextResponse.json({
            message: "Khôi phục bài viết thành công",
        });
    } catch (error) {
        console.error("Restore article error:", error);
        return NextResponse.json(
            { error: "Failed to restore article" },
            { status: 500 }
        );
    }
}

function extractPublicIdFromUrl(url: string): string | null {
    try {
        const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        return matches ? matches[1] : null;
    } catch {
        return null;
    }
}
