import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { sendDeletionNotificationEmail } from "@/lib/email";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const product = await prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                variants: {
                    orderBy: { sortOrder: "asc" },
                },
                tags: {
                    include: {
                        tag: { select: { id: true, name: true, slug: true } },
                    },
                },
                attributes: {
                    include: {
                        values: true,
                    },
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Get product error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const currentProduct = await prisma.product.findFirst({
            where: { id, deletedAt: null },
            select: { images: true },
        });

        if (!currentProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Find removed images and delete from Cloudinary
        const oldImages = parseImages(currentProduct.images);
        const newImages = body.images || [];

        for (const oldImg of oldImages) {
            if (!newImages.includes(oldImg)) {
                const publicId = extractPublicIdFromUrl(oldImg);
                if (publicId) {
                    await deleteImage(publicId);
                }
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description,
                shortDescription: body.shortDescription,
                images: body.images || [],
                categoryId: body.categoryId,
                status: body.status,
                isFeatured: body.isFeatured,
                hasVariants: body.hasVariants,
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription,
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                variants: true,
            },
        });

        if (body.tagIds) {
            await prisma.productTag.deleteMany({ where: { productId: id } });

            if (body.tagIds.length > 0) {
                await prisma.productTag.createMany({
                    data: body.tagIds.map((tagId: string) => ({
                        productId: id,
                        tagId,
                    })),
                });
            }
        }

        return NextResponse.json({
            message: "Cập nhật sản phẩm thành công",
            product,
        });
    } catch (error) {
        console.error("Update product error:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Soft delete product (move to trash)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get("permanent") === "true";

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                images: true,
                deletedAt: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        if (permanent) {
            // Permanent delete
            await prisma.productTag.deleteMany({ where: { productId: id } });
            await prisma.productVariant.deleteMany({ where: { productId: id } });
            await prisma.productAttribute.deleteMany({ where: { productId: id } });
            await prisma.wishlist.deleteMany({ where: { productId: id } });
            await prisma.product.delete({ where: { id } });

            // Delete all images from Cloudinary
            const images = parseImages(product.images);
            let deletedCount = 0;

            for (const imageUrl of images) {
                const publicId = extractPublicIdFromUrl(imageUrl);
                if (publicId) {
                    const success = await deleteImage(publicId);
                    if (success) deletedCount++;
                }
            }

            return NextResponse.json({
                message: "Xóa vĩnh viễn thành công",
                deletedImages: deletedCount,
            });
        } else {
            // Soft delete
            await prisma.product.update({
                where: { id },
                data: { deletedAt: new Date() },
            });

            // Send email notification to admin (async, don't wait)
            const productImages = parseImages(product.images);
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            sendDeletionNotificationEmail({
                items: [{
                    id: product.id,
                    name: product.name,
                    type: "product",
                    image: productImages[0] || undefined,
                }],
                deletedBy: "Admin",
                trashUrl: `${baseUrl}/admin/trash`,
            }).catch((err) => console.error("Failed to send deletion email:", err));

            return NextResponse.json({
                message: "Đã chuyển vào thùng rác",
            });
        }
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}


// PATCH /api/products/[id] - Restore product from trash
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const product = await prisma.product.findFirst({
            where: { id, deletedAt: { not: null } },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found in trash" },
                { status: 404 }
            );
        }

        await prisma.product.update({
            where: { id },
            data: { deletedAt: null },
        });

        return NextResponse.json({
            message: "Khôi phục sản phẩm thành công",
        });
    } catch (error) {
        console.error("Restore product error:", error);
        return NextResponse.json(
            { error: "Failed to restore product" },
            { status: 500 }
        );
    }
}

function parseImages(images: unknown): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
        try { return JSON.parse(images); }
        catch { return []; }
    }
    return [];
}

function extractPublicIdFromUrl(url: string): string | null {
    try {
        const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        return matches ? matches[1] : null;
    } catch {
        return null;
    }
}
