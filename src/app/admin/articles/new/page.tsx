"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Settings, Loader2, ImagePlus, X, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/media-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TiptapEditor from "@/components/editor/tiptap-editor";

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
}

export default function NewArticlePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("draft");
    const [categoryId, setCategoryId] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isNotable, setIsNotable] = useState(false);
    const [featuredImage, setFeaturedImage] = useState("");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    // Fetch categories
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories?type=article");
                if (res.ok) {
                    const data = await res.json();
                    // Flatten hierarchical categories
                    const flatCategories: Category[] = [];
                    const flatten = (cats: Category[], prefix = "") => {
                        cats.forEach(cat => {
                            flatCategories.push({
                                id: cat.id,
                                name: prefix + cat.name,
                                slug: cat.slug
                            });
                            if (cat.children?.length) flatten(cat.children, prefix + "— ");
                        });
                    };
                    flatten(data.data?.articleCategories || []);
                    setCategories(flatCategories);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        }
        fetchCategories();
    }, []);

    // Auto-generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!slug || slug === generateSlug(title)) {
            setSlug(generateSlug(value));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "articles");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setFeaturedImage(data.data?.url || data.url);
            } else {
                toast.error("Upload thất bại");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Có lỗi xảy ra khi upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (publishNow: boolean) => {
        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề");
            return;
        }
        if (!content.trim()) {
            toast.error("Vui lòng nhập nội dung");
            return;
        }

        setSaving(true);
        try {
            const articleData = {
                title,
                slug: slug || generateSlug(title),
                excerpt,
                content,
                status: publishNow ? "published" : status,
                categoryId: categoryId || null,
                isFeatured,
                isNotable,
                featuredImage: featuredImage || null,
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
            };

            const res = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articleData),
            });

            if (res.ok) {
                const data = await res.json();
                const newArticle = data.data;
                toast.success("Đã tạo bài viết thành công!");
                router.push(`/admin/articles/${newArticle.id}/edit`);
            } else {
                const error = await res.json();
                toast.error(error.message || "Lưu bài viết thất bại");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/articles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Tạo bài viết mới</h1>
                        <p className="text-muted-foreground">
                            Viết và xuất bản bài viết của bạn
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Lưu nháp
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Eye className="mr-2 h-4 w-4" />
                        )}
                        Xuất bản
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Tiêu đề *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Nhập tiêu đề bài viết..."
                            className="text-lg"
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <div className="flex gap-2">
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="url-bai-viet"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setSlug(generateSlug(title))}
                            >
                                Tạo tự động
                            </Button>
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <Label htmlFor="excerpt">Mô tả ngắn</Label>
                        <Textarea
                            id="excerpt"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Mô tả ngắn gọn về bài viết..."
                            rows={3}
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <Label>Nội dung *</Label>
                        <TiptapEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Bắt đầu viết nội dung bài viết..."
                            className="min-h-[500px]"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Featured Image */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Ảnh đại diện</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {featuredImage ? (
                                <div className="relative">
                                    <img
                                        src={featuredImage}
                                        alt="Featured"
                                        className="w-full aspect-video object-cover rounded-lg"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setShowMediaPicker(true)}
                                        >
                                            <FolderOpen className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setFeaturedImage("")}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full h-20 flex flex-col gap-2"
                                        onClick={() => setShowMediaPicker(true)}
                                    >
                                        <FolderOpen className="h-6 w-6" />
                                        <span className="text-sm">Chọn từ thư viện</span>
                                    </Button>
                                    <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                        {uploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    Hoặc upload mới
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Media Picker Dialog */}
                    <MediaPicker
                        open={showMediaPicker}
                        onOpenChange={setShowMediaPicker}
                        onSelect={(url) => setFeaturedImage(url)}
                    />

                    {/* Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Trạng thái</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {["draft", "published", "archived"].map((s) => (
                                    <Badge
                                        key={s}
                                        variant={status === s ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => setStatus(s)}
                                    >
                                        {s === "draft" && "Nháp"}
                                        {s === "published" && "Xuất bản"}
                                        {s === "archived" && "Lưu trữ"}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Chuyên mục</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn chuyên mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Featured */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Hiển thị đặc biệt</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <div>
                                    <p className="font-medium">Bài viết nổi bật</p>
                                    <p className="text-sm text-muted-foreground">
                                        Hiển thị ở Featured Grid
                                    </p>
                                </div>
                            </label>
                            <Separator />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isNotable}
                                    onChange={(e) => setIsNotable(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <div>
                                    <p className="font-medium">Bài viết đáng chú ý</p>
                                    <p className="text-sm text-muted-foreground">
                                        Hiển thị ở Notable section
                                    </p>
                                </div>
                            </label>
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                SEO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input
                                    id="metaTitle"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder="Tiêu đề SEO"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaDesc">Meta Description</Label>
                                <Textarea
                                    id="metaDesc"
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder="Mô tả SEO (155-160 ký tự)"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
