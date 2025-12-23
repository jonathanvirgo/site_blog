"use client";

import { useState, useEffect } from "react";
import {
    Save,
    Globe,
    Search,
    Share2,
    Mail,
    Loader2,
    CheckCircle,
    XCircle,
    Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailConfig {
    configured: boolean;
    fromEmail: string;
    adminEmail: string | null;
}

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    // Email config state
    const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
    const [testEmail, setTestEmail] = useState("");
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

    // General settings
    const [generalSettings, setGeneralSettings] = useState({
        siteName: "HealthNews",
        siteTagline: "Sức khỏe & Đời sống",
        siteUrl: "https://healthnews.vn",
        adminEmail: "admin@healthnews.vn",
        contactPhone: "1900 1234",
        contactAddress: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
    });

    // SEO settings
    const [seoSettings, setSeoSettings] = useState({
        metaTitle: "HealthNews - Tin tức Sức khỏe & Đời sống",
        metaDescription: "Cập nhật tin tức sức khỏe, dinh dưỡng, làm đẹp và mua sắm sản phẩm chăm sóc sức khỏe chất lượng.",
        metaKeywords: "sức khỏe, dinh dưỡng, vitamin, thực phẩm chức năng",
        googleAnalyticsId: "G-XXXXXXXXXX",
        enableSitemap: true,
        enableRobots: true,
    });

    // Social settings
    const [socialSettings, setSocialSettings] = useState({
        facebookUrl: "https://facebook.com/healthnews",
        instagramUrl: "https://instagram.com/healthnews",
        youtubeUrl: "https://youtube.com/healthnews",
        tiktokUrl: "",
        zaloUrl: "",
        facebookAppId: "",
        enableShareButtons: true,
    });

    // Load email config on mount
    useEffect(() => {
        fetch("/api/admin/email-config")
            .then((res) => res.json())
            .then((data) => setEmailConfig(data))
            .catch((err) => console.error("Failed to load email config:", err));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsSaving(false);
        toast.success("Đã lưu cài đặt!");
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) return;

        setIsSendingTest(true);
        setTestEmailResult(null);

        try {
            const res = await fetch("/api/admin/email-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setTestEmailResult({ success: true, message: "Email test đã được gửi thành công!" });
            } else {
                setTestEmailResult({ success: false, message: data.error || "Gửi email thất bại" });
            }
        } catch {
            setTestEmailResult({ success: false, message: "Lỗi kết nối server" });
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cài đặt</h1>
                    <p className="text-muted-foreground">Quản lý cài đặt hệ thống</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Lưu thay đổi
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general">
                        <Globe className="mr-2 h-4 w-4" />
                        Chung
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Search className="mr-2 h-4 w-4" />
                        SEO
                    </TabsTrigger>
                    <TabsTrigger value="social">
                        <Share2 className="mr-2 h-4 w-4" />
                        Mạng xã hội
                    </TabsTrigger>
                    <TabsTrigger value="email">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </TabsTrigger>
                </TabsList>

                {/* General */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                            <CardDescription>Cài đặt cơ bản của website</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tên website</Label>
                                    <Input
                                        value={generalSettings.siteName}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tagline</Label>
                                    <Input
                                        value={generalSettings.siteTagline}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, siteTagline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>URL website</Label>
                                <Input
                                    value={generalSettings.siteUrl}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                                />
                            </div>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email liên hệ</Label>
                                    <Input
                                        type="email"
                                        value={generalSettings.adminEmail}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hotline</Label>
                                    <Input
                                        value={generalSettings.contactPhone}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Địa chỉ</Label>
                                <Textarea
                                    value={generalSettings.contactAddress}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactAddress: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SEO */}
                <TabsContent value="seo" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt SEO</CardTitle>
                            <CardDescription>Tối ưu công cụ tìm kiếm</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Meta Title mặc định</Label>
                                <Input
                                    value={seoSettings.metaTitle}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">{seoSettings.metaTitle.length}/60 ký tự</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Description mặc định</Label>
                                <Textarea
                                    value={seoSettings.metaDescription}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">{seoSettings.metaDescription.length}/160 ký tự</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Keywords</Label>
                                <Input
                                    value={seoSettings.metaKeywords}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, metaKeywords: e.target.value })}
                                    placeholder="keyword1, keyword2, keyword3"
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Google Analytics ID</Label>
                                <Input
                                    value={seoSettings.googleAnalyticsId}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, googleAnalyticsId: e.target.value })}
                                    placeholder="G-XXXXXXXXXX"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Tạo Sitemap tự động</p>
                                    <p className="text-sm text-muted-foreground">Tự động tạo sitemap.xml</p>
                                </div>
                                <Switch
                                    checked={seoSettings.enableSitemap}
                                    onCheckedChange={(v) => setSeoSettings({ ...seoSettings, enableSitemap: v })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Robots.txt</p>
                                    <p className="text-sm text-muted-foreground">Cho phép công cụ tìm kiếm index</p>
                                </div>
                                <Switch
                                    checked={seoSettings.enableRobots}
                                    onCheckedChange={(v) => setSeoSettings({ ...seoSettings, enableRobots: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Social */}
                <TabsContent value="social" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mạng xã hội</CardTitle>
                            <CardDescription>Liên kết đến các trang mạng xã hội</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Facebook</Label>
                                    <Input
                                        value={socialSettings.facebookUrl}
                                        onChange={(e) => setSocialSettings({ ...socialSettings, facebookUrl: e.target.value })}
                                        placeholder="https://facebook.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram</Label>
                                    <Input
                                        value={socialSettings.instagramUrl}
                                        onChange={(e) => setSocialSettings({ ...socialSettings, instagramUrl: e.target.value })}
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>YouTube</Label>
                                    <Input
                                        value={socialSettings.youtubeUrl}
                                        onChange={(e) => setSocialSettings({ ...socialSettings, youtubeUrl: e.target.value })}
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>TikTok</Label>
                                    <Input
                                        value={socialSettings.tiktokUrl}
                                        onChange={(e) => setSocialSettings({ ...socialSettings, tiktokUrl: e.target.value })}
                                        placeholder="https://tiktok.com/..."
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Facebook App ID</Label>
                                <Input
                                    value={socialSettings.facebookAppId}
                                    onChange={(e) => setSocialSettings({ ...socialSettings, facebookAppId: e.target.value })}
                                    placeholder="Dùng cho Facebook sharing"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Nút chia sẻ</p>
                                    <p className="text-sm text-muted-foreground">Hiển thị nút share trên bài viết</p>
                                </div>
                                <Switch
                                    checked={socialSettings.enableShareButtons}
                                    onCheckedChange={(v) => setSocialSettings({ ...socialSettings, enableShareButtons: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email - Updated for Resend */}
                <TabsContent value="email" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Cài đặt Email
                                {emailConfig?.configured ? (
                                    <Badge variant="default" className="bg-green-500">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Đã cấu hình
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        Chưa cấu hình
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Sử dụng Resend API để gửi email transactional
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Status Info */}
                            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                                <h4 className="font-medium text-sm">Trạng thái cấu hình</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                                        <span className="text-muted-foreground">RESEND_API_KEY</span>
                                        {emailConfig?.configured ? (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Đã set
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-red-600 border-red-600">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Chưa set
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                                        <span className="text-muted-foreground">ADMIN_NOTIFICATION_EMAIL</span>
                                        {emailConfig?.adminEmail ? (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Đã set
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-red-600 border-red-600">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Chưa set
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {emailConfig?.fromEmail && (
                                    <p className="text-sm text-muted-foreground">
                                        📧 Email gửi: <code className="bg-muted px-2 py-0.5 rounded">{emailConfig.fromEmail}</code>
                                    </p>
                                )}
                                {emailConfig?.adminEmail && (
                                    <p className="text-sm text-muted-foreground">
                                        👤 Admin nhận thông báo: <code className="bg-muted px-2 py-0.5 rounded">{emailConfig.adminEmail}</code>
                                    </p>
                                )}
                            </div>

                            {/* Setup Instructions */}
                            {!emailConfig?.configured && (
                                <Alert>
                                    <Mail className="h-4 w-4" />
                                    <AlertDescription>
                                        <p className="font-medium mb-2">Hướng dẫn cấu hình:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-sm">
                                            <li>Đăng ký tài khoản tại <a href="https://resend.com" target="_blank" className="text-primary underline">resend.com</a></li>
                                            <li>Lấy API Key từ Dashboard → API Keys</li>
                                            <li>Thêm vào file <code className="bg-muted px-1 rounded">.env</code>:</li>
                                        </ol>
                                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                            {`RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
ADMIN_NOTIFICATION_EMAIL="admin@yourdomain.com"`}
                                        </pre>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Separator />

                            {/* Test Email */}
                            <div className="space-y-4">
                                <h4 className="font-medium">Gửi email test</h4>
                                <div className="flex gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Nhập email nhận test..."
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSendTestEmail}
                                        disabled={!testEmail || !emailConfig?.configured || isSendingTest}
                                    >
                                        {isSendingTest ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        Gửi test
                                    </Button>
                                </div>
                                {testEmailResult && (
                                    <Alert variant={testEmailResult.success ? "default" : "destructive"}>
                                        {testEmailResult.success ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                        <AlertDescription>{testEmailResult.message}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Email Features Info */}
                            <div className="rounded-lg border p-4 mt-4">
                                <h4 className="font-medium mb-3">📬 Tính năng email</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Gửi email xác nhận khi khách hàng đặt hàng
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Thông báo cho admin khi xóa sản phẩm/bài viết
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Template email đẹp, responsive
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
