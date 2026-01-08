"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CreditCard,
    Truck,
    Wallet,
    Loader2,
    Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        slug: string;
        images: string[];
    };
    variant: {
        id: string;
        sku: string;
        price: number;
        salePrice: number | null;
        stockQuantity: number;
    };
}

interface Province {
    id: string;
    name: string;
}

interface District {
    id: string;
    name: string;
    provinceId: string;
}

interface Ward {
    id: string;
    name: string;
    districtId: string;
}

const paymentMethods = [
    { id: "cod", name: "Thanh toán khi nhận hàng (COD)", icon: Truck },
    { id: "vnpay", name: "VNPay", icon: CreditCard },
    { id: "momo", name: "Ví MoMo", icon: Wallet },
    { id: "zalopay", name: "ZaloPay", icon: Wallet },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

export default function CheckoutPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        provinceId: "",
        districtId: "",
        wardId: "",
        address: "",
        note: "",
        paymentMethod: "cod",
    });

    // Fetch cart items
    useEffect(() => {
        async function fetchCart() {
            try {
                const res = await fetch("/api/cart");
                if (res.ok) {
                    const data = await res.json();
                    const items = data.data?.items || data.items || [];
                    setCartItems(items);

                    // Redirect to cart if empty
                    if (items.length === 0) {
                        router.push("/gio-hang");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch cart:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCart();
    }, [router]);

    // Fetch provinces (locations)
    useEffect(() => {
        async function fetchProvinces() {
            try {
                const res = await fetch("/api/locations?type=province");
                if (res.ok) {
                    const data = await res.json();
                    setProvinces(data.data || data || []);
                }
            } catch (error) {
                console.error("Failed to fetch provinces:", error);
                // Fallback to manual provinces
                setProvinces([
                    { id: "hcm", name: "TP. Hồ Chí Minh" },
                    { id: "hn", name: "Hà Nội" },
                    { id: "dn", name: "Đà Nẵng" },
                ]);
            }
        }
        fetchProvinces();
    }, []);

    // Fetch districts when province changes
    useEffect(() => {
        if (!formData.provinceId) {
            setDistricts([]);
            return;
        }

        async function fetchDistricts() {
            try {
                const res = await fetch(`/api/locations?type=district&provinceId=${formData.provinceId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDistricts(data.data || data || []);
                }
            } catch (error) {
                console.error("Failed to fetch districts:", error);
                // Fallback
                setDistricts([
                    { id: "q1", name: "Quận 1", provinceId: formData.provinceId },
                    { id: "q2", name: "Quận 2", provinceId: formData.provinceId },
                    { id: "q3", name: "Quận 3", provinceId: formData.provinceId },
                ]);
            }
        }
        fetchDistricts();
    }, [formData.provinceId]);

    // Fetch wards when district changes
    useEffect(() => {
        if (!formData.districtId) {
            setWards([]);
            return;
        }

        async function fetchWards() {
            try {
                const res = await fetch(`/api/locations?type=ward&districtId=${formData.districtId}`);
                if (res.ok) {
                    const data = await res.json();
                    setWards(data.data || data || []);
                }
            } catch (error) {
                console.error("Failed to fetch wards:", error);
                // Fallback
                setWards([
                    { id: "p1", name: "Phường 1", districtId: formData.districtId },
                    { id: "p2", name: "Phường 2", districtId: formData.districtId },
                    { id: "p3", name: "Phường 3", districtId: formData.districtId },
                ]);
            }
        }
        fetchWards();
    }, [formData.districtId]);

    const updateForm = (field: string, value: string) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            // Clear dependent fields
            if (field === "provinceId") {
                updated.districtId = "";
                updated.wardId = "";
            }
            if (field === "districtId") {
                updated.wardId = "";
            }
            return updated;
        });
    };

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.variant.salePrice || item.variant.price;
        return sum + price * item.quantity;
    }, 0);
    const shipping = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal + shipping;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Prepare order data
            const orderData = {
                shippingAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    provinceId: formData.provinceId,
                    districtId: formData.districtId,
                    wardId: formData.wardId,
                    address: formData.address,
                },
                paymentMethod: formData.paymentMethod,
                note: formData.note,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.variant.salePrice || item.variant.price,
                })),
                subtotal,
                shippingFee: shipping,
                total,
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (res.ok) {
                const data = await res.json();
                const orderId = data.data?.id || data.id || "ORD-" + Date.now();

                // Clear cart
                await fetch("/api/cart", { method: "DELETE" });

                // Redirect to success page
                router.push(`/dat-hang-thanh-cong?order=${orderId}`);
            } else {
                const error = await res.json();
                alert(error.message || "Đặt hàng thất bại. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Order submission error:", error);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-16 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return null; // Will redirect
    }

    return (
        <div className="py-8 md:py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 animate-fade-in">
                    <Link href="/gio-hang">
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Thanh toán</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Info */}
                            <Card className="border border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <span className="p-2 rounded-xl bg-primary/10">
                                            <Truck className="h-5 w-5 text-primary" />
                                        </span>
                                        Thông tin giao hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Họ và tên *</Label>
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => updateForm("fullName", e.target.value)}
                                                placeholder="Nguyễn Văn A"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Số điện thoại *</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => updateForm("phone", e.target.value)}
                                                placeholder="0901234567"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateForm("email", e.target.value)}
                                            placeholder="email@example.com"
                                        />
                                    </div>

                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tỉnh/Thành phố *</Label>
                                            <Select
                                                value={formData.provinceId}
                                                onValueChange={(v) => updateForm("provinceId", v)}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tỉnh/thành" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((province) => (
                                                        <SelectItem key={province.id} value={province.id}>
                                                            {province.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quận/Huyện *</Label>
                                            <Select
                                                value={formData.districtId}
                                                onValueChange={(v) => updateForm("districtId", v)}
                                                required
                                                disabled={!formData.provinceId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn quận/huyện" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {districts.map((district) => (
                                                        <SelectItem key={district.id} value={district.id}>
                                                            {district.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phường/Xã *</Label>
                                            <Select
                                                value={formData.wardId}
                                                onValueChange={(v) => updateForm("wardId", v)}
                                                required
                                                disabled={!formData.districtId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn phường/xã" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {wards.map((ward) => (
                                                        <SelectItem key={ward.id} value={ward.id}>
                                                            {ward.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Địa chỉ cụ thể *</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => updateForm("address", e.target.value)}
                                            placeholder="Số nhà, tên đường..."
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="note">Ghi chú</Label>
                                        <Textarea
                                            id="note"
                                            value={formData.note}
                                            onChange={(e) => updateForm("note", e.target.value)}
                                            placeholder="Ghi chú cho đơn hàng (tuỳ chọn)"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card className="border border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <span className="p-2 rounded-xl bg-primary/10">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                        </span>
                                        Phương thức thanh toán
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {paymentMethods.map((method) => {
                                            const Icon = method.icon;
                                            const isSelected = formData.paymentMethod === method.id;
                                            return (
                                                <label
                                                    key={method.id}
                                                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isSelected
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border/50 hover:bg-secondary/50 hover:border-primary/30"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value={method.id}
                                                        checked={isSelected}
                                                        onChange={() => updateForm("paymentMethod", method.id)}
                                                        className="h-4 w-4 accent-primary"
                                                    />
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-secondary/50'}`}>
                                                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <span className="font-medium">{method.name}</span>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-primary ml-auto" />
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <Card className="sticky top-24 border border-border/50 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Đơn hàng của bạn</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Items */}
                                    {cartItems.map((item) => {
                                        const price = item.variant.salePrice || item.variant.price;
                                        return (
                                            <div key={item.id} className="flex justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium line-clamp-1">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.variant.sku} × {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-medium">
                                                    {formatPrice(price * item.quantity)}
                                                </p>
                                            </div>
                                        );
                                    })}

                                    <Separator className="bg-border/50" />

                                    {/* Summary */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tạm tính</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phí vận chuyển</span>
                                            <span className={shipping === 0 ? "text-accent font-medium" : ""}>
                                                {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/50" />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">{formatPrice(total)}</span>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            "Đặt hàng"
                                        )}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        Bằng việc đặt hàng, bạn đồng ý với{" "}
                                        <Link href="/dieu-khoan" className="text-primary hover:underline">
                                            Điều khoản sử dụng
                                        </Link>
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
