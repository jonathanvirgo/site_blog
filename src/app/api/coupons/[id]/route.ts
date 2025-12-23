import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/coupons/[id] - Get a coupon by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: { select: { orders: true } }
            }
        });

        if (!coupon) {
            return notFoundResponse("Coupon not found");
        }

        return successResponse({
            ...coupon,
            value: Number(coupon.value),
            minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            orderCount: coupon._count.orders
        });
    } catch (error) {
        console.error("Get coupon error:", error);
        return serverErrorResponse("Failed to fetch coupon");
    }
}

// PUT /api/coupons/[id] - Update a coupon
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            code,
            type,
            value,
            minOrder,
            maxDiscount,
            usageLimit,
            startsAt,
            expiresAt,
            isActive
        } = body;

        // Check if coupon exists
        const existing = await prisma.coupon.findUnique({
            where: { id }
        });
        if (!existing) {
            return notFoundResponse("Coupon not found");
        }

        // Check for code conflict
        if (code && code.toUpperCase() !== existing.code) {
            const codeConflict = await prisma.coupon.findUnique({
                where: { code: code.toUpperCase() }
            });
            if (codeConflict) {
                return errorResponse("Coupon with this code already exists");
            }
        }

        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                ...(code !== undefined && { code: code.toUpperCase() }),
                ...(type !== undefined && { type: type as "percentage" | "fixed" }),
                ...(value !== undefined && { value }),
                ...(minOrder !== undefined && { minOrder }),
                ...(maxDiscount !== undefined && { maxDiscount }),
                ...(usageLimit !== undefined && { usageLimit }),
                ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
                ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
                ...(isActive !== undefined && { isActive }),
            }
        });

        return successResponse({
            ...coupon,
            value: Number(coupon.value),
            minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        }, "Coupon updated successfully");
    } catch (error) {
        console.error("Update coupon error:", error);
        return serverErrorResponse("Failed to update coupon");
    }
}

// DELETE /api/coupons/[id] - Delete a coupon
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if coupon exists
        const existing = await prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: { select: { orders: true } }
            }
        });

        if (!existing) {
            return notFoundResponse("Coupon not found");
        }

        // Warn if coupon has been used
        if (existing._count.orders > 0) {
            // Soft delete by deactivating instead of deleting
            await prisma.coupon.update({
                where: { id },
                data: { isActive: false }
            });
            return successResponse(null, "Coupon deactivated (has order history)");
        }

        await prisma.coupon.delete({
            where: { id }
        });

        return successResponse(null, "Coupon deleted successfully");
    } catch (error) {
        console.error("Delete coupon error:", error);
        return serverErrorResponse("Failed to delete coupon");
    }
}
