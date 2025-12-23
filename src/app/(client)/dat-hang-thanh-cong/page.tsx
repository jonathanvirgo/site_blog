"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock order data
const orderData = {
    orderNumber: "ORD-2024-001",
    status: "pending",
    totalAmount: 1078000,
    paymentMethod: "cod",
    shippingName: "Nguyễn Văn A",
    shippingPhone: "0901234567",
    shippingAddress: "123 Đường ABC, Phường 1, Quận 1, TP. Hồ Chí Minh",
    items: [
        {
            id: "1",
            name: "Vitamin C 1000mg Natural Plus",
            variant: "60 viên",
            price: 299000,
            quantity: 2,
        },
        {
            id: "2",
            name: "Omega 3 Fish Oil Premium",
            variant: "90 viên",
            price: 450000,
            quantity: 1,
        },
    ],
    estimatedDelivery: "3-5 ngày làm việc",
};

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order") || orderData.orderNumber;
    const [copied, setCopied] = useState(false);

    const copyOrderNumber = () => {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="py-16">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Đặt hàng thành công!</h1>
                    <p className="text-muted-foreground">
                        Cảm ơn bạn đã tin tưởng và mua hàng tại HealthNews
                    </p>
                </div>

                {/* Order Number */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                                <p className="text-2xl font-bold font-mono">{orderId}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Đã sao chép
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Sao chép
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Info */}
                <Card className="mb-6">
                    <CardContent className="p-6 space-y-4">
                        {/* Shipping */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Thông tin giao hàng
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p className="text-foreground font-medium">{orderData.shippingName}</p>
                                <p>{orderData.shippingPhone}</p>
                                <p>{orderData.shippingAddress}</p>
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                ⏱️ Thời gian giao hàng dự kiến: <strong>{orderData.estimatedDelivery}</strong>
                            </div>
                        </div>

                        <Separator />

                        {/* Items */}
                        <div>
                            <h3 className="font-semibold mb-3">Sản phẩm đã đặt</h3>
                            <div className="space-y-3">
                                {orderData.items.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.variant} × {item.quantity}
                                            </p>
                                        </div>
                                        <p className="font-medium">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Payment */}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Phương thức thanh toán</span>
                            <span className="font-medium">
                                {orderData.paymentMethod === "cod"
                                    ? "Thanh toán khi nhận hàng"
                                    : orderData.paymentMethod.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex justify-between text-lg font-bold">
                            <span>Tổng cộng</span>
                            <span className="text-primary">{formatPrice(orderData.totalAmount)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/" className="flex-1">
                        <Button variant="outline" className="w-full">
                            Về trang chủ
                        </Button>
                    </Link>
                    <Link href="/san-pham" className="flex-1">
                        <Button className="w-full">
                            Tiếp tục mua sắm
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Additional Info */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Một email xác nhận đã được gửi đến địa chỉ của bạn.
                    <br />
                    Nếu có thắc mắc, vui lòng liên hệ hotline: <strong>1900 1234</strong>
                </p>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
