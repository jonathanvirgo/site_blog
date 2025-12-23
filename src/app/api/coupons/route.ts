import { NextRequest } from "next/server";
import { successResponse, serverErrorResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

// GET /api/coupons - List all coupons
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const isActive = searchParams.get("active"); // "true" | "false" | null

        const coupons = await prisma.coupon.findMany({
            where: {
                ...(search && {
                    code: { contains: search, mode: "insensitive" }
                }),
                ...(isActive === "true" && { isActive: true }),
                ...(isActive === "false" && { isActive: false }),
            },
            include: {
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const formattedCoupons = coupons.map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: Number(coupon.value),
            minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            startsAt: coupon.startsAt,
            expiresAt: coupon.expiresAt,
            isActive: coupon.isActive,
            createdAt: coupon.createdAt,
            orderCount: coupon._count.orders
        }));

        return successResponse(formattedCoupons);
    } catch (error) {
        console.error("Get coupons error:", error);
        return serverErrorResponse("Failed to fetch coupons");
    }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: NextRequest) {
    try {
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
            isActive = true
        } = body;

        if (!code || !type || value === undefined) {
            return errorResponse("Code, type, and value are required");
        }

        if (type !== "percentage" && type !== "fixed") {
            return errorResponse("Type must be 'percentage' or 'fixed'");
        }

        // Check for existing code
        const existing = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });
        if (existing) {
            return errorResponse("Coupon with this code already exists");
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                type: type as "percentage" | "fixed",
                value,
                minOrder: minOrder || null,
                maxDiscount: maxDiscount || null,
                usageLimit: usageLimit || null,
                startsAt: startsAt ? new Date(startsAt) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive
            }
        });

        return successResponse({
            ...coupon,
            value: Number(coupon.value),
            minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        }, "Coupon created successfully");
    } catch (error) {
        console.error("Create coupon error:", error);
        return serverErrorResponse("Failed to create coupon");
    }
}
