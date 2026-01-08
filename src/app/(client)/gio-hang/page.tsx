"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CartItem {
    id: string;
    productId: string;
    name: string;
    image: string | null;
    variantId: string;
    sku: string;
    price: number;
    quantity: number;
    stock: number;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);

    // Fetch cart items
    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setCartItems(data.data?.items || data.items || []);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        setUpdating(itemId);
        try {
            const res = await fetch(`/api/cart`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, quantity: newQuantity })
            });

            if (res.ok) {
                setCartItems(items =>
                    items.map(item =>
                        item.id === itemId
                            ? { ...item, quantity: newQuantity }
                            : item
                    )
                );
            }
        } catch (error) {
            console.error("Failed to update quantity:", error);
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (itemId: string) => {
        setUpdating(itemId);
        try {
            const res = await fetch(`/api/cart?itemId=${itemId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setCartItems(items => items.filter(item => item.id !== itemId));
            }
        } catch (error) {
            console.error("Failed to remove item:", error);
        } finally {
            setUpdating(null);
        }
    };

    const applyCoupon = async () => {
        try {
            // For now, just do local validation
            // TODO: Call /api/coupons/validate when available
            if (couponCode.toUpperCase() === "SALE10") {
                setAppliedCoupon(couponCode);
                setDiscount(subtotal * 0.1);
            } else {
                alert("Mã giảm giá không hợp lệ");
            }
        } catch (error) {
            console.error("Failed to apply coupon:", error);
        }
    };

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);
    const shipping = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal - discount + shipping;

    if (loading) {
        return (
            <div className="py-12 lg:py-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="py-12 lg:py-16">
                <div className="container mx-auto px-4 text-center">
                    <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
                    <p className="text-muted-foreground mb-8">
                        Chưa có sản phẩm nào trong giỏ hàng
                    </p>
                    <Link href="/san-pham">
                        <Button size="lg">
                            Tiếp tục mua sắm
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6 lg:py-10">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Giỏ hàng ({cartItems.length})</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => {
                            const isUpdating = updating === item.id;

                            return (
                                <Card key={item.id} className={isUpdating ? "opacity-50" : ""}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/san-pham/${item.productId}`}
                                                    className="font-medium hover:text-primary line-clamp-2"
                                                >
                                                    {item.name}
                                                </Link>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {item.sku}
                                                </p>
                                                <p className="font-bold text-primary mt-2">
                                                    {formatPrice(item.price)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col items-end gap-2">
                                                {/* Quantity */}
                                                <div className="flex items-center border rounded-lg">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || isUpdating}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-10 text-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock || isUpdating}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Subtotal */}
                                                <p className="font-semibold">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>

                                                {/* Remove */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={isUpdating}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Continue Shopping */}
                        <div className="pt-4">
                            <Link href="/san-pham">
                                <Button variant="outline">
                                    ← Tiếp tục mua sắm
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card className="sticky top-24">
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>

                                {/* Coupon */}
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Mã giảm giá"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={!!appliedCoupon}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={applyCoupon}
                                        disabled={!couponCode || !!appliedCoupon}
                                    >
                                        Áp dụng
                                    </Button>
                                </div>

                                {appliedCoupon && (
                                    <div className="flex items-center justify-between p-2 bg-green-50 text-green-700 rounded-lg mb-4 text-sm">
                                        <span>Mã: {appliedCoupon}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-green-700"
                                            onClick={() => {
                                                setAppliedCoupon(null);
                                                setDiscount(0);
                                                setCouponCode("");
                                            }}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                )}

                                <Separator className="my-4" />

                                {/* Summary */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tạm tính</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phí vận chuyển</span>
                                        <span className={shipping === 0 ? "text-green-600" : ""}>
                                            {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                                        </span>
                                    </div>

                                    {shipping > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Miễn phí vận chuyển cho đơn từ 500.000đ
                                        </p>
                                    )}

                                    <Separator />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <Link href="/thanh-toan" className="block mt-6">
                                    <Button size="lg" className="w-full">
                                        Tiến hành thanh toán
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>

                                {/* Benefits */}
                                <div className="mt-6 pt-4 border-t space-y-2 text-sm text-muted-foreground">
                                    <p>✓ Giao hàng miễn phí từ 500.000đ</p>
                                    <p>✓ Đổi trả trong 30 ngày</p>
                                    <p>✓ Thanh toán an toàn</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
