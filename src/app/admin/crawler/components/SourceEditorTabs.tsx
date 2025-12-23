"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SourceMainTab } from "./SourceMainTab";
import { SourceCategoryTab } from "./SourceCategoryTab";
import { SourceDetailTab } from "./SourceDetailTab";
import type { CrawlSourceFormData, Category } from "../types";

interface SourceEditorTabsProps {
    sourceId?: string; // undefined for new, id for edit
    initialData?: CrawlSourceFormData;
}

const defaultFormData: CrawlSourceFormData = {
    name: "",
    baseUrl: "",
    crawlType: "article",
    isActive: true,
    requestDelayMs: 2000,
    requestTimeout: 30000,
    requestHeaders: {},
    seoConfig: {
        enabled: true,
        metaTitle: "meta[property='og:title']::attr(content), title",
        metaDescription: "meta[name='description']::attr(content)",
        ogImage: "meta[property='og:image']::attr(content)",
    },
    listPageEnabled: false,
    categoryMappings: [],
    listItemSelector: "",
    listLinkSelector: "",
    listImageSelector: "",
    listTitleSelector: "",
    paginationConfig: {
        type: "next_button",
        nextSelector: ".pagination .next",
        maxPages: 5,
    },
    selectors: {
        article: {
            title: "h1",
            content: "article",
            excerpt: "",
            featuredImage: "meta[property='og:image']::attr(content)",
            useFrontContentImageAsFeatured: true,
            contentImages: [],
            author: "",
            publishDate: "",
            fieldConfigs: {},
        },
        product: {
            name: "h1",
            shortDescription: "",
            description: "",
            price: "",
            originalPrice: "",
            variantPrice: "",
            images: [],
            sku: "",
            fieldConfigs: {},
        },
    },
};

export function SourceEditorTabs({ sourceId, initialData }: SourceEditorTabsProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("main");
    const [formData, setFormData] = useState<CrawlSourceFormData>(
        initialData || defaultFormData
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isEditing = !!sourceId;

    // Sync formData when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const type = formData.crawlType === "article" ? "article" : "product";
                const endpoint = `/api/categories?type=${type}`;
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    // API returns { data: { articleCategories: [...] } } or { data: { productCategories: [...] } }
                    const categoriesData = data.data?.articleCategories || data.data?.productCategories || [];
                    // Flatten the hierarchical structure for the dropdown
                    const flattenCategories = (cats: Category[], level = 0): Category[] => {
                        let result: Category[] = [];
                        for (const cat of cats) {
                            result.push({ ...cat, name: "  ".repeat(level) + cat.name });
                            if (cat.children && cat.children.length > 0) {
                                result = result.concat(flattenCategories(cat.children as Category[], level + 1));
                            }
                        }
                        return result;
                    };
                    setCategories(flattenCategories(categoriesData));
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, [formData.crawlType]);

    const updateFormData = (updates: Partial<CrawlSourceFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên nguồn");
            setActiveTab("main");
            return;
        }
        if (!formData.baseUrl.trim()) {
            toast.error("Vui lòng nhập URL gốc");
            setActiveTab("main");
            return;
        }

        setSaving(true);
        try {
            const url = isEditing
                ? `/api/crawler/sources/${sourceId}`
                : "/api/crawler/sources";
            const method = isEditing ? "PUT" : "POST";

            const payload = {
                name: formData.name,
                baseUrl: formData.baseUrl,
                crawlType: formData.crawlType,
                isActive: formData.isActive,
                requestDelayMs: formData.requestDelayMs,
                requestHeaders: formData.requestHeaders,
                seoConfig: formData.seoConfig,
                listPageEnabled: formData.listPageEnabled,
                categoryMappings: formData.categoryMappings,
                listItemSelector: formData.listItemSelector,
                listLinkSelector: formData.listLinkSelector,
                listImageSelector: formData.listImageSelector,
                listTitleSelector: formData.listTitleSelector,
                listMaxPages: formData.paginationConfig?.maxPages || 5,
                paginationConfig: formData.paginationConfig,
                selectors: formData.selectors,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Lỗi khi lưu");
            }

            toast.success(isEditing ? "Đã cập nhật nguồn" : "Đã tạo nguồn mới");
            router.push("/admin/crawler?tab=sources");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!sourceId) return;
        if (!confirm("Bạn có chắc chắn muốn xóa nguồn này?")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/crawler/sources/${sourceId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Lỗi khi xóa");
            }

            toast.success("Đã xóa nguồn");
            router.push("/admin/crawler?tab=sources");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/crawler?tab=sources">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? `Chỉnh sửa: ${formData.name}` : "Thêm nguồn mới"}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Xóa
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Lưu
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="main">📋 Cài đặt chính</TabsTrigger>
                    <TabsTrigger value="category">📂 Danh mục</TabsTrigger>
                    <TabsTrigger value="detail">📝 Chi tiết</TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="mt-6">
                    <SourceMainTab formData={formData} updateFormData={updateFormData} />
                </TabsContent>

                <TabsContent value="category" className="mt-6">
                    <SourceCategoryTab
                        formData={formData}
                        updateFormData={updateFormData}
                        categories={categories}
                    />
                </TabsContent>

                <TabsContent value="detail" className="mt-6">
                    <SourceDetailTab
                        formData={formData}
                        updateFormData={updateFormData}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
