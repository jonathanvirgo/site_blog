import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Send, Shield, Truck, RotateCcw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
    company: [
        { name: "Giới thiệu", href: "/gioi-thieu" },
        { name: "Liên hệ", href: "/lien-he" },
        { name: "Tuyển dụng", href: "/tuyen-dung" },
        { name: "Tin tức", href: "/tin-tuc" },
    ],
    support: [
        { name: "Hướng dẫn mua hàng", href: "/huong-dan" },
        { name: "Chính sách đổi trả", href: "/chinh-sach-doi-tra" },
        { name: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
        { name: "Điều khoản sử dụng", href: "/dieu-khoan" },
    ],
    categories: [
        { name: "Sức khỏe", href: "/chuyen-muc/suc-khoe" },
        { name: "Dinh dưỡng", href: "/chuyen-muc/dinh-duong" },
        { name: "Làm đẹp", href: "/chuyen-muc/lam-dep" },
        { name: "Đời sống", href: "/chuyen-muc/doi-song" },
    ],
};

const trustBadges = [
    { icon: Truck, label: "Giao hàng nhanh" },
    { icon: RotateCcw, label: "Đổi trả 30 ngày" },
    { icon: Shield, label: "Bảo mật 100%" },
    { icon: CreditCard, label: "Thanh toán an toàn" },
];

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", hoverClass: "hover:bg-blue-600" },
    { icon: Instagram, href: "#", label: "Instagram", hoverClass: "hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500" },
    { icon: Youtube, href: "#", label: "Youtube", hoverClass: "hover:bg-red-600" },
];

export function Footer() {
    return (
        <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-white mt-16">
            {/* Trust Badges */}
            <div className="border-b border-white/10">
                <div className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trustBadges.map((badge) => (
                            <div key={badge.label} className="flex items-center gap-3 justify-center md:justify-start group cursor-default">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                    <badge.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-white/80">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand & Newsletter */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-all">
                                <span className="text-white font-bold text-2xl">H</span>
                            </div>
                            <div>
                                <span className="font-bold text-xl block">HealthNews</span>
                                <span className="text-xs text-white/60">Tin sức khỏe & Mua sắm</span>
                            </div>
                        </Link>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Cung cấp thông tin sức khỏe đáng tin cậy và các sản phẩm chăm sóc sức khỏe chất lượng cao. Đồng hành cùng bạn trên hành trình sống khỏe.
                        </p>

                        {/* Newsletter */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                Đăng ký nhận tin
                            </h4>
                            <p className="text-sm text-white/60 mb-3">Nhận bài viết mới và ưu đãi độc quyền</p>
                            <form className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="Email của bạn..."
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/30"
                                />
                                <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 shrink-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className={`h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-all duration-300 ${social.hoverClass} hover:scale-110 hover:text-white`}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold mb-4 text-white">Về chúng tôi</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-white/70 hover:text-primary transition-colors text-sm inline-flex items-center gap-1 group"
                                    >
                                        <span className="w-0 h-0.5 bg-primary group-hover:w-2 transition-all duration-300"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold mb-4 text-white">Hỗ trợ</h3>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-white/70 hover:text-primary transition-colors text-sm inline-flex items-center gap-1 group"
                                    >
                                        <span className="w-0 h-0.5 bg-primary group-hover:w-2 transition-all duration-300"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold mb-4 text-white">Liên hệ</h3>
                        <ul className="space-y-4 text-sm text-white/70">
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium text-white">1900 1234</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <span>contact@healthnews.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-white/50">
                            © 2024 HealthNews. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-white/50">
                            <Link href="/chinh-sach-bao-mat" className="hover:text-primary transition-colors">
                                Chính sách bảo mật
                            </Link>
                            <span>•</span>
                            <Link href="/dieu-khoan" className="hover:text-primary transition-colors">
                                Điều khoản
                            </Link>
                            <span>•</span>
                            <Link href="/sitemap" className="hover:text-primary transition-colors">
                                Sitemap
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
