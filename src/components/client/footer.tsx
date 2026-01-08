import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
    company: [
        { name: "Giới thiệu", href: "/gioi-thieu" },
        { name: "Liên hệ", href: "/lien-he" },
        { name: "Tuyển dụng", href: "/tuyen-dung" },
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

export function Footer() {
    return (
        <footer className="bg-muted/50 border-t">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-xl">H</span>
                            </div>
                            <span className="font-bold text-xl">HealthNews</span>
                        </Link>
                        <p className="text-muted-foreground text-sm">
                            Cung cấp thông tin sức khỏe đáng tin cậy và các sản phẩm chăm sóc sức khỏe chất lượng cao.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition"
                            >
                                <Youtube className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Về chúng tôi</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-primary transition text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Hỗ trợ</h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-primary transition text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold mb-4">Liên hệ</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                                <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>1900 1234</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>contact@healthnews.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                    <p>© 2024 HealthNews. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
