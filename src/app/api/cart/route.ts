import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cart - Get cart items
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const sessionId = request.cookies.get("session_id")?.value;

        if (!userId && !sessionId) {
            return NextResponse.json({ items: [], total: 0 });
        }

        const cart = await prisma.cart.findFirst({
            where: userId ? { userId } : { sessionId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: { name: true, slug: true, images: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            return NextResponse.json({ items: [], total: 0 });
        }

        const items = cart.items.map((item) => ({
            id: item.id,
            productId: item.variant.product.slug,
            name: item.variant.product.name,
            image: (item.variant.product.images as string[])?.[0] || null,
            variantId: item.variantId,
            sku: item.variant.sku,
            price: Number(item.variant.salePrice || item.variant.price),
            quantity: item.quantity,
            stock: item.variant.stockQuantity,
        }));

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return NextResponse.json({ items, total });
    } catch (error) {
        console.error("Get cart error:", error);
        return NextResponse.json({ error: "Failed to get cart" }, { status: 500 });
    }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        let sessionId = request.cookies.get("session_id")?.value;

        const body = await request.json();
        const { variantId, quantity = 1 } = body;

        if (!variantId) {
            return NextResponse.json({ error: "Variant ID required" }, { status: 400 });
        }

        // Get or create cart
        let cart = await prisma.cart.findFirst({
            where: userId ? { userId } : sessionId ? { sessionId } : undefined,
        });

        if (!cart) {
            // Create new session ID if needed
            if (!sessionId) {
                sessionId = crypto.randomUUID();
            }

            cart = await prisma.cart.create({
                data: {
                    userId: userId || null,
                    sessionId: userId ? null : sessionId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });
        }

        // Check if item already exists
        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, variantId },
        });

        if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            // Add new item
            await prisma.cartItem.create({
                data: { cartId: cart.id, variantId, quantity },
            });
        }
        // Get updated cart count
        const updatedCart = await prisma.cart.findFirst({
            where: { id: cart.id },
            include: { items: { select: { quantity: true } } },
        });
        const itemCount = updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

        const response = NextResponse.json({
            message: "Đã thêm vào giỏ hàng",
            itemCount, // Return count for badge update
        });

        // Set session cookie if new (Vercel optimized)
        if (!userId && sessionId) {
            response.cookies.set("session_id", sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
            });
        }

        return response;
    } catch (error) {
        console.error("Add to cart error:", error);
        return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
    }
}

// PUT /api/cart - Update item quantity
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemId, quantity } = body;

        if (!itemId || quantity === undefined) {
            return NextResponse.json(
                { error: "Item ID and quantity required" },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            // Remove item
            await prisma.cartItem.delete({ where: { id: itemId } });
            return NextResponse.json({ message: "Đã xóa sản phẩm" });
        }

        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });

        return NextResponse.json({ message: "Đã cập nhật số lượng" });
    } catch (error) {
        console.error("Update cart error:", error);
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");

        if (!itemId) {
            return NextResponse.json({ error: "Item ID required" }, { status: 400 });
        }

        await prisma.cartItem.delete({ where: { id: itemId } });

        return NextResponse.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    } catch (error) {
        console.error("Remove from cart error:", error);
        return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
    }
}
