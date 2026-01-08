"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus, ShieldCheck, Gift, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (formData.password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự");
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            setError("Mật khẩu phải có ít nhất 1 chữ hoa");
            return;
        }

        if (!/[0-9]/.test(formData.password)) {
            setError("Mật khẩu phải có ít nhất 1 số");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName || undefined,
                    phone: formData.phone || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.details) {
                    const messages = data.details.map((d: { message: string }) => d.message);
                    setError(messages.join(", "));
                } else {
                    setError(data.error || "Đăng ký thất bại");
                }
                return;
            }

            router.push(redirect);
            router.refresh();
        } catch {
            setError("Đã xảy ra lỗi, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-500">Đăng ký tài khoản</CardTitle>
                <CardDescription>
                    Tạo tài khoản mới để mua hàng
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0901234567"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
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
                        <p className="text-xs text-muted-foreground">
                            Ít nhất 8 ký tự, 1 chữ hoa và 1 số
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng ký
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    Đã có tài khoản?{" "}
                    <Link href="/dang-nhap" className="text-primary font-medium hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

const benefits = [
    {
        icon: UserPlus,
        title: "Đăng ký miễn phí",
        description: "Tạo tài khoản hoàn toàn miễn phí, không mất phí duy trì"
    },
    {
        icon: Gift,
        title: "Quà tặng thành viên mới",
        description: "Nhận ngay voucher giảm giá cho đơn hàng đầu tiên"
    },
    {
        icon: Zap,
        title: "Thanh toán nhanh chóng",
        description: "Lưu thông tin giao hàng để thanh toán siêu tốc"
    },
    {
        icon: ShieldCheck,
        title: "Bảo mật thông tin",
        description: "Dữ liệu của bạn được mã hóa và bảo vệ an toàn"
    }
];

export default function RegisterPage() {
    return (
        <div className="py-8 md:py-16">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Left side - Benefits */}
                    <div className="order-2 lg:order-1 animate-fade-in">
                        <div className="max-w-lg">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                                Tham gia cùng chúng tôi!
                            </h1>
                            <p className="text-muted-foreground text-lg mb-8">
                                Đăng ký thành viên để nhận nhiều ưu đãi hấp dẫn và trải nghiệm mua sắm tuyệt vời nhất.
                            </p>

                            <div className="space-y-5">
                                {benefits.map((benefit, index) => (
                                    <div key={benefit.title} className={`flex gap-4 animate-fade-in-up delay-${(index + 1) * 100}`}>
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center shadow-sm">
                                            <benefit.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1 text-foreground">{benefit.title}</h3>
                                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Register Form */}
                    <div className="order-1 lg:order-2 flex justify-center animate-scale-in">
                        <Suspense fallback={<div className="w-full max-w-md h-[500px] bg-muted animate-pulse rounded-xl" />}>
                            <RegisterForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
