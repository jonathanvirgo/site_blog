import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// Helper to get userId from JWT cookie or header
async function getUserId(request: NextRequest): Promise<string | null> {
    // Try x-user-id header first (for middleware)
    const headerUserId = request.headers.get("x-user-id");
    if (headerUserId) return headerUserId;

    // Try JWT access_token cookie
    const token = request.cookies.get("access_token")?.value;
    if (token) {
        const payload = await verifyAccessToken(token);
        if (payload?.userId) return payload.userId;
    }

    return null;
}

// POST /api/cart/merge - Merge guest cart into user cart
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        const sessionId = request.cookies.get("session_id")?.value;

        if (!userId) {
            return NextResponse.json(
                { error: "User must be logged in to merge carts" },
                { status: 401 }
            );
        }

        if (!sessionId) {
            return NextResponse.json(
                { message: "No guest cart to merge", merged: 0 }
            );
        }

        // Find guest cart
        const guestCart = await prisma.cart.findFirst({
            where: { sessionId },
            include: { items: true },
        });

        if (!guestCart || guestCart.items.length === 0) {
            return NextResponse.json(
                { message: "No guest cart to merge", merged: 0 }
            );
        }

        // Find or create user cart
        let userCart = await prisma.cart.findFirst({
            where: { userId },
        });

        if (!userCart) {
            userCart = await prisma.cart.create({
                data: {
                    userId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
            });
        }

        // Merge items
        let mergedCount = 0;
        for (const guestItem of guestCart.items) {
            // Check if item already exists in user cart
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: userCart.id,
                    variantId: guestItem.variantId,
                },
            });

            if (existingItem) {
                // Sum quantities
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + guestItem.quantity },
                });
            } else {
                // Add new item to user cart
                await prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        variantId: guestItem.variantId,
                        quantity: guestItem.quantity,
                    },
                });
            }
            mergedCount += guestItem.quantity;
        }

        // Delete guest cart and items
        await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
        await prisma.cart.delete({ where: { id: guestCart.id } });

        // Get new total count
        const updatedCart = await prisma.cart.findFirst({
            where: { id: userCart.id },
            include: { items: { select: { quantity: true } } },
        });
        const itemCount = updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

        // Clear session cookie
        const response = NextResponse.json({
            message: "Đã gộp giỏ hàng thành công",
            merged: mergedCount,
            itemCount,
        });

        response.cookies.delete("session_id");

        return response;
    } catch (error) {
        console.error("Cart merge error:", error);
        return NextResponse.json(
            { error: "Failed to merge carts" },
            { status: 500 }
        );
    }
}

// DELETE /api/cart/merge - Discard guest cart (user chose not to merge)
export async function DELETE(request: NextRequest) {
    try {
        const sessionId = request.cookies.get("session_id")?.value;

        if (!sessionId) {
            return NextResponse.json({ message: "No guest cart to discard" });
        }

        // Find and delete guest cart
        const guestCart = await prisma.cart.findFirst({
            where: { sessionId },
        });

        if (guestCart) {
            await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
            await prisma.cart.delete({ where: { id: guestCart.id } });
        }

        // Clear session cookie
        const response = NextResponse.json({ message: "Đã bỏ qua giỏ hàng khách" });
        response.cookies.delete("session_id");

        return response;
    } catch (error) {
        console.error("Cart discard error:", error);
        return NextResponse.json(
            { error: "Failed to discard cart" },
            { status: 500 }
        );
    }
}
