import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { notifyNewOrder, notifyServerError } from "@/lib/telegram";

// GET /api/orders - List orders with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const paymentStatus = searchParams.get("paymentStatus");
        const search = searchParams.get("search");

        // Build where clause
        const conditions: object[] = [];

        if (status && status !== "all") {
            conditions.push({ status });
        }

        if (paymentStatus && paymentStatus !== "all") {
            conditions.push({ paymentStatus });
        }

        if (search) {
            conditions.push({
                OR: [
                    { orderNumber: { contains: search, mode: "insensitive" } },
                    { shippingName: { contains: search, mode: "insensitive" } },
                    { shippingPhone: { contains: search } },
                ],
            });
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNumber: true,
                    totalAmount: true,
                    discountAmount: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    shippingName: true,
                    shippingPhone: true,
                    createdAt: true,
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                    items: {
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders: orders.map((o) => ({
                ...o,
                itemCount: o.items.length,
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("List orders error:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            userId,
            items, // Array of { variantId, quantity, price }
            shippingAddress,
            paymentMethod,
            couponCode,
            notes,
        } = body;

        // Validate required fields
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "Giỏ hàng trống" },
                { status: 400 }
            );
        }

        if (!shippingAddress) {
            return NextResponse.json(
                { error: "Vui lòng nhập địa chỉ giao hàng" },
                { status: 400 }
            );
        }

        // Calculate totals
        let subtotal = 0;
        const orderItemsData: Array<{
            variantId: string;
            quantity: number;
            productPrice: number;
            subtotal: number;
            productName: string;
            variantName: string;
        }> = [];

        for (const item of items) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: { select: { name: true, images: true } } },
            });

            if (!variant) {
                return NextResponse.json(
                    { error: `Sản phẩm không tồn tại: ${item.variantId}` },
                    { status: 400 }
                );
            }

            if (variant.stockQuantity < item.quantity) {
                return NextResponse.json(
                    { error: `Sản phẩm "${variant.product.name}" không đủ số lượng` },
                    { status: 400 }
                );
            }

            const price = variant.salePrice || variant.price;
            subtotal += Number(price) * item.quantity;

            orderItemsData.push({
                variantId: item.variantId,
                quantity: item.quantity,
                productPrice: Number(price),
                subtotal: Number(price) * item.quantity,
                productName: variant.product.name,
                variantName: variant.sku,
            });
        }

        // Apply coupon if provided
        let discountAmount = 0;
        let couponId: string | null = null;

        if (couponCode) {
            const coupon = await prisma.coupon.findFirst({
                where: {
                    code: couponCode,
                    isActive: true,
                    startsAt: { lte: new Date() },
                    expiresAt: { gte: new Date() },
                },
            });

            if (coupon) {
                if (coupon.type === "percentage") {
                    discountAmount = (subtotal * Number(coupon.value)) / 100;
                    if (coupon.maxDiscount) {
                        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
                    }
                } else {
                    discountAmount = Number(coupon.value);
                }
                couponId = coupon.id;
            }
        }

        const shippingFee = 30000; // Fixed shipping fee
        const totalAmount = subtotal - discountAmount + shippingFee;

        // Generate order number
        const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}`;

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId: userId || null,
                    totalAmount,
                    discountAmount,
                    status: "pending",
                    paymentMethod: paymentMethod || "cod",
                    paymentStatus: "pending",
                    shippingName: shippingAddress.fullName,
                    shippingPhone: shippingAddress.phone,
                    shippingAddress: `${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}`,
                    note: notes,
                    items: {
                        create: orderItemsData.map(item => ({
                            variantId: item.variantId,
                            quantity: item.quantity,
                            productPrice: item.productPrice,
                            subtotal: item.subtotal,
                            productName: item.productName,
                            variantName: item.variantName,
                        })),
                    },
                },
                include: {
                    items: true,
                    user: { select: { email: true, fullName: true } },
                },
            });

            // Update stock
            for (const item of items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockQuantity: { decrement: item.quantity },
                    },
                });
            }

            // Apply coupon usage
            if (couponId) {
                await tx.orderCoupon.create({
                    data: {
                        orderId: newOrder.id,
                        couponId,
                        discountApplied: discountAmount,
                    },
                });

                await tx.coupon.update({
                    where: { id: couponId },
                    data: { usedCount: { increment: 1 } },
                });
            }

            return newOrder;
        });

        // Send email notification to customer (async, don't wait)
        const customerEmail = order.user?.email || body.customerEmail;
        if (customerEmail) {
            sendOrderConfirmationEmail({
                id: order.id,
                customerEmail,
                customerName: order.shippingName,
                items: orderItemsData.map((item) => ({
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.productPrice,
                })),
                subtotal,
                shippingFee,
                discount: discountAmount,
                totalAmount,
                shippingAddress: {
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    ward: shippingAddress.ward || "",
                    district: shippingAddress.district || "",
                    city: shippingAddress.city || "",
                },
                paymentMethod: paymentMethod || "cod",
            }).catch((err) => console.error("Email send error:", err));
        }

        // Send Telegram notification to admin (async)
        notifyNewOrder({
            id: order.orderNumber,
            customerName: order.shippingName,
            customerPhone: order.shippingPhone,
            totalAmount,
            itemCount: orderItemsData.length,
        }).catch((err) => console.error("Telegram send error:", err));

        return NextResponse.json(
            {
                message: "Đặt hàng thành công",
                order: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create order error:", error);

        // Notify admin about server error
        notifyServerError({
            endpoint: "/api/orders",
            method: "POST",
            statusCode: 500,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        }).catch(() => { });

        return NextResponse.json(
            { error: "Đã có lỗi xảy ra khi đặt hàng" },
            { status: 500 }
        );
    }
}
