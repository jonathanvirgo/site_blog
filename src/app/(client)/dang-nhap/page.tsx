"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Heart, ShoppingBag, Newspaper, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartMergeDialog } from "@/components/client/cart-merge-dialog";
import { useCart } from "@/context/cart-context";

function LoginForm() {
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Cart merge state
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const [guestCartCount, setGuestCartCount] = useState(0);
    const [pendingRedirect, setPendingRedirect] = useState("");

    const checkGuestCart = async (): Promise<number> => {
        try {
            const res = await fetch("/api/cart/count");
            if (res.ok) {
                const data = await res.json();
                return data.count || 0;
            }
        } catch (e) {
            console.error("Failed to check guest cart:", e);
        }
        return 0;
    };

    const handleMerge = async () => {
        const res = await fetch("/api/cart/merge", { method: "POST" });
        if (!res.ok) {
            console.error("Failed to merge cart");
        }
    };

    const handleDiscard = async () => {
        const res = await fetch("/api/cart/merge", { method: "DELETE" });
        if (!res.ok) {
            console.error("Failed to discard cart");
        }
    };

    const handleMergeComplete = () => {
        setShowMergeDialog(false);
        window.location.href = pendingRedirect;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const guestCount = await checkGuestCart();

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Đăng nhập thất bại");
                return;
            }

            const dontAskMerge = localStorage.getItem("dontAskCartMerge") === "true";

            if (guestCount > 0 && !dontAskMerge) {
                setGuestCartCount(guestCount);
                setPendingRedirect(redirect);
                setShowMergeDialog(true);
            } else {
                window.location.href = redirect;
            }
        } catch {
            setError("Đã xảy ra lỗi, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Đăng nhập</CardTitle>
                    <CardDescription>
                        Nhập thông tin để truy cập tài khoản
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Đăng nhập
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Chưa có tài khoản?{" "}
                        <Link href="/dang-ky" className="text-primary underline hover:no-underline">
                            Đăng ký ngay
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <CartMergeDialog
                isOpen={showMergeDialog}
                onClose={handleMergeComplete}
                guestItemCount={guestCartCount}
                onMerge={handleMerge}
                onDiscard={handleDiscard}
            />
        </>
    );
}

const benefits = [
    {
        icon: ShoppingBag,
        title: "Mua sắm tiện lợi",
        description: "Theo dõi đơn hàng, lịch sử mua hàng và thanh toán nhanh chóng"
    },
    {
        icon: Heart,
        title: "Ưu đãi độc quyền",
        description: "Nhận thông báo khuyến mãi và mã giảm giá dành riêng cho thành viên"
    },
    {
        icon: Newspaper,
        title: "Nội dung cá nhân hóa",
        description: "Bài viết và sản phẩm được đề xuất theo sở thích của bạn"
    },
    {
        icon: CheckCircle,
        title: "Tích điểm thưởng",
        description: "Tích lũy điểm với mỗi đơn hàng để đổi quà hấp dẫn"
    }
];

export default function LoginPage() {
    return (
        <div className="py-8 md:py-12 lg:py-16">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Left side - Benefits */}
                    <div className="order-2 lg:order-1">
                        <div className="max-w-lg">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                Chào mừng bạn trở lại!
                            </h1>
                            <p className="text-muted-foreground text-lg mb-8">
                                Đăng nhập để trải nghiệm đầy đủ các tính năng và ưu đãi dành riêng cho thành viên.
                            </p>

                            <div className="space-y-6">
                                {benefits.map((benefit) => (
                                    <div key={benefit.title} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <benefit.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{benefit.title}</h3>
                                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Login Form */}
                    <div className="order-1 lg:order-2 flex justify-center">
                        <Suspense fallback={<div className="w-full max-w-md h-96 bg-muted animate-pulse rounded-lg" />}>
                            <LoginForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
