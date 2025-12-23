import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cart/count - Get cart item count only (lightweight)
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const sessionId = request.cookies.get("session_id")?.value;

        if (!userId && !sessionId) {
            return NextResponse.json({ count: 0 });
        }

        const cart = await prisma.cart.findFirst({
            where: userId ? { userId } : { sessionId },
            include: {
                items: {
                    select: { quantity: true },
                },
            },
        });

        if (!cart) {
            return NextResponse.json({ count: 0 });
        }

        const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Get cart count error:", error);
        return NextResponse.json({ count: 0 });
    }
}
