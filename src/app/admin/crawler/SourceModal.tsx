"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash, Info, List, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Types
interface Category {
    id: string;
    name: string;
    slug: string;
}

interface CrawlSource {
    id: string;
    name: string;
    baseUrl: string;
    crawlType: "article" | "product";
    selectors: Record<string, unknown>;
    isActive: boolean;
    defaultCategoryId?: string;
    defaultStatus?: string;
    listPageEnabled?: boolean;
    listPageUrl?: string;
    listItemSelector?: string;
    listLinkSelector?: string;
    listImageSelector?: string;
    listTitleSelector?: string;
    listPaginationNext?: string;
    listMaxPages?: number;
}

interface ArticleSelectors {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author?: string;
    publishDate?: string;
}

interface ProductSelectors {
    name: string;
    price: string;
    originalPrice?: string;
    description?: string;
    images?: string;
    sku?: string;
}

interface SourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingSource: CrawlSource | null;
    onSuccess: () => void;
}

// Selector field hints
const ARTICLE_SELECTOR_HINTS: Record<keyof ArticleSelectors, string> = {
    title: "h1.title-detail, .article-title, h1",
    content: "article.fck_detail, .article-content, .post-content",
    excerpt: ".article-sapo, .excerpt, .description",
    featuredImage: "meta[property='og:image']::attr(content), .featured-img img",
    author: ".author-name, .writer, span.author",
    publishDate: ".date-publish, time, .meta-date",
};

const PRODUCT_SELECTOR_HINTS: Record<keyof ProductSelectors, string> = {
    name: "h1.product-title, .product-name, h1",
    price: ".price-current, .product-price, .final-price",
    originalPrice: ".price-original, .old-price, del.price",
    description: ".product-description, .product-detail, .description",
    images: ".product-gallery img, .product-images img",
    sku: ".product-sku, .sku-value, [data-sku]",
};

const LIST_SELECTOR_HINTS = {
    listItem: ".article-item, .post-item, .news-item",
    link: "a, a.title-link, h3 a",
    image: "img, .thumb img, .featured-image img",
    title: ".title, h3, .headline",
    paginationNext: ".pagination .next, a[rel='next'], .load-more",
};

// Default selectors
const getDefaultArticleSelectors = (): ArticleSelectors => ({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    author: "",
    publishDate: "",
});

const getDefaultProductSelectors = (): ProductSelectors => ({
    name: "",
    price: "",
    originalPrice: "",
    description: "",
    images: "",
    sku: "",
});

export default function SourceModal({
    open,
    onOpenChange,
    editingSource,
    onSuccess,
}: SourceModalProps) {
    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Form state - Basic
    const [name, setName] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [crawlType, setCrawlType] = useState<"article" | "product">("article");
    const [isActive, setIsActive] = useState(true);

    // Form state - Default settings
    const [defaultCategoryId, setDefaultCategoryId] = useState<string>("");
    const [defaultStatus, setDefaultStatus] = useState<string>("draft");

    // Form state - List page
    const [listPageEnabled, setListPageEnabled] = useState(false);
    const [listPageUrl, setListPageUrl] = useState("");
    const [listItemSelector, setListItemSelector] = useState("");
    const [listLinkSelector, setListLinkSelector] = useState("");
    const [listImageSelector, setListImageSelector] = useState("");
    const [listTitleSelector, setListTitleSelector] = useState("");
    const [listPaginationNext, setListPaginationNext] = useState("");
    const [listMaxPages, setListMaxPages] = useState(5);

    // Form state - Detail page selectors
    const [articleSelectors, setArticleSelectors] = useState<ArticleSelectors>(
        getDefaultArticleSelectors()
    );
    const [productSelectors, setProductSelectors] = useState<ProductSelectors>(
        getDefaultProductSelectors()
    );

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Fetch categories
    useEffect(() => {
        if (open && categories.length === 0) {
            setLoadingCategories(true);
            const endpoint = crawlType === "article"
                ? "/api/categories?type=article"
                : "/api/categories?type=product";

            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    if (data.categories) setCategories(data.categories);
                })
                .catch(console.error)
                .finally(() => setLoadingCategories(false));
        }
    }, [open, crawlType, categories.length]);

    // Refetch categories when type changes
    useEffect(() => {
        if (open) {
            setLoadingCategories(true);
            const endpoint = crawlType === "article"
                ? "/api/categories?type=article"
                : "/api/categories?type=product";

            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    if (data.categories) setCategories(data.categories);
                })
                .catch(console.error)
                .finally(() => setLoadingCategories(false));
        }
    }, [crawlType, open]);

    // Reset/populate form when modal opens
    useEffect(() => {
        if (open) {
            if (editingSource) {
                setName(editingSource.name);
                setBaseUrl(editingSource.baseUrl);
                setCrawlType(editingSource.crawlType);
                setIsActive(editingSource.isActive);

                // Default settings
                setDefaultCategoryId(editingSource.defaultCategoryId || "");
                setDefaultStatus(editingSource.defaultStatus || "draft");

                // List page settings
                setListPageEnabled(editingSource.listPageEnabled || false);
                setListPageUrl(editingSource.listPageUrl || "");
                setListItemSelector(editingSource.listItemSelector || "");
                setListLinkSelector(editingSource.listLinkSelector || "");
                setListImageSelector(editingSource.listImageSelector || "");
                setListTitleSelector(editingSource.listTitleSelector || "");
                setListPaginationNext(editingSource.listPaginationNext || "");
                setListMaxPages(editingSource.listMaxPages || 5);

                // Parse selectors based on type - handle nested structure
                const rawSelectors = editingSource.selectors || {};

                // Helper to safely get string value
                const getString = (obj: unknown, key: string): string => {
                    if (obj && typeof obj === 'object' && key in obj) {
                        const val = (obj as Record<string, unknown>)[key];
                        return typeof val === 'string' ? val : '';
                    }
                    return '';
                };

                if (editingSource.crawlType === "article") {
                    const articleData = ('article' in rawSelectors && typeof rawSelectors.article === 'object')
                        ? rawSelectors.article
                        : rawSelectors;

                    setArticleSelectors({
                        title: getString(articleData, 'title'),
                        content: getString(articleData, 'content'),
                        excerpt: getString(articleData, 'excerpt'),
                        featuredImage: getString(articleData, 'featuredImage'),
                        author: getString(articleData, 'author'),
                        publishDate: getString(articleData, 'publishDate'),
                    });
                } else {
                    const productData = ('product' in rawSelectors && typeof rawSelectors.product === 'object')
                        ? rawSelectors.product
                        : rawSelectors;

                    setProductSelectors({
                        name: getString(productData, 'name'),
                        price: getString(productData, 'price'),
                        originalPrice: getString(productData, 'originalPrice'),
                        description: getString(productData, 'description'),
                        images: getString(productData, 'images'),
                        sku: getString(productData, 'sku'),
                    });
                }
            } else {
                // Reset for new source
                setName("");
                setBaseUrl("");
                setCrawlType("article");
                setIsActive(true);
                setDefaultCategoryId("");
                setDefaultStatus("draft");
                setListPageEnabled(false);
                setListPageUrl("");
                setListItemSelector("");
                setListLinkSelector("");
                setListImageSelector("");
                setListTitleSelector("");
                setListPaginationNext("");
                setListMaxPages(5);
                setArticleSelectors(getDefaultArticleSelectors());
                setProductSelectors(getDefaultProductSelectors());
            }
        }
    }, [open, editingSource]);

    // Validate form
    const validateForm = (): string | null => {
        if (!name.trim()) return "Vui lòng nhập tên nguồn";
        if (!baseUrl.trim()) return "Vui lòng nhập URL gốc";

        try {
            new URL(baseUrl);
        } catch {
            return "URL gốc không hợp lệ";
        }

        // Validate list page if enabled
        if (listPageEnabled) {
            if (!listPageUrl.trim()) return "Vui lòng nhập URL trang danh mục";
            try {
                new URL(listPageUrl);
            } catch {
                return "URL trang danh mục không hợp lệ";
            }
            if (!listItemSelector.trim()) return "Vui lòng nhập selector item danh sách";
            if (!listLinkSelector.trim()) return "Vui lòng nhập selector link bài viết";
        }

        if (crawlType === "article") {
            if (!articleSelectors.title.trim()) return "Selector tiêu đề là bắt buộc";
            if (!articleSelectors.content.trim()) return "Selector nội dung là bắt buộc";
        } else {
            if (!productSelectors.name.trim()) return "Selector tên sản phẩm là bắt buộc";
            if (!productSelectors.price.trim()) return "Selector giá là bắt buộc";
        }

        return null;
    };

    // Save source
    const handleSave = async () => {
        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

        setSaving(true);
        try {
            const selectors = crawlType === "article"
                ? { article: articleSelectors }
                : { product: productSelectors };

            const body = {
                name: name.trim(),
                baseUrl: baseUrl.trim(),
                crawlType,
                isActive,
                selectors,
                // New fields
                defaultCategoryId: defaultCategoryId || null,
                defaultStatus,
                listPageEnabled,
                listPageUrl: listPageUrl.trim() || null,
                listItemSelector: listItemSelector.trim() || null,
                listLinkSelector: listLinkSelector.trim() || null,
                listImageSelector: listImageSelector.trim() || null,
                listTitleSelector: listTitleSelector.trim() || null,
                listPaginationNext: listPaginationNext.trim() || null,
                listMaxPages,
            };

            const url = editingSource
                ? `/api/crawler/sources/${editingSource.id}`
                : "/api/crawler/sources";

            const res = await fetch(url, {
                method: editingSource ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || (editingSource ? "Đã cập nhật nguồn" : "Đã tạo nguồn mới"));
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Save source error:", error);
            toast.error("Không thể lưu nguồn");
        } finally {
            setSaving(false);
        }
    };

    // Delete source
    const handleDelete = async () => {
        if (!editingSource) return;
        if (!confirm("Bạn có chắc muốn xóa nguồn này? Các jobs liên quan sẽ không bị xóa.")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/crawler/sources/${editingSource.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Đã xóa nguồn");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.error || "Không thể xóa");
            }
        } catch (error) {
            console.error("Delete source error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
        }
    };

    // Selector field component with hint
    const SelectorField = ({
        label,
        value,
        onChange,
        hint,
        required,
    }: {
        label: string;
        value: string;
        onChange: (v: string) => void;
        hint: string;
        required?: boolean;
    }) => (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <Label className="text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">Ví dụ: <code className="bg-muted px-1 rounded">{hint}</code></p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <Input
                placeholder={hint}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="font-mono text-sm"
            />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingSource ? "Chỉnh sửa nguồn" : "Thêm nguồn mới"}
                    </DialogTitle>
                    <DialogDescription>
                        Cấu hình crawler để tự động lấy nội dung từ website bên ngoài
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>
                                Tên nguồn <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="VnExpress, Shopee, Tiki..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                URL gốc <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="https://example.com"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Loại nội dung</Label>
                            <Select
                                value={crawlType}
                                onValueChange={(v) => setCrawlType(v as "article" | "product")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="article">Bài viết</SelectItem>
                                    <SelectItem value="product">Sản phẩm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Trạng thái nguồn</Label>
                            <div className="flex items-center gap-3 h-10">
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {isActive ? "Đang hoạt động" : "Tạm dừng"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Default Settings Section */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Cài đặt mặc định sau khi crawl
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Danh mục mặc định</Label>
                                <Select
                                    value={defaultCategoryId}
                                    onValueChange={setDefaultCategoryId}
                                    disabled={loadingCategories}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCategories ? "Đang tải..." : "Chọn danh mục"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Không chọn --</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Trạng thái bài viết/sản phẩm</Label>
                                <Select
                                    value={defaultStatus}
                                    onValueChange={setDefaultStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                                        <SelectItem value="pending_review">Chờ duyệt (Pending Review)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Accordion type="multiple" defaultValue={["detail-selectors"]}>
                        {/* List Page Crawling Section */}
                        <AccordionItem value="list-page">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4" />
                                    Crawl trang danh mục
                                    {listPageEnabled && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            Đã bật
                                        </span>
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={listPageEnabled}
                                            onCheckedChange={setListPageEnabled}
                                        />
                                        <span className="text-sm">
                                            Bật crawl trang danh mục để lấy danh sách URLs
                                        </span>
                                    </div>

                                    {listPageEnabled && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>
                                                    URL trang danh mục <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    placeholder="https://example.com/category/news"
                                                    value={listPageUrl}
                                                    onChange={(e) => setListPageUrl(e.target.value)}
                                                />
                                            </div>

                                            <SelectorField
                                                label="Selector item danh sách"
                                                value={listItemSelector}
                                                onChange={setListItemSelector}
                                                hint={LIST_SELECTOR_HINTS.listItem}
                                                required
                                            />

                                            <SelectorField
                                                label="Selector link bài viết"
                                                value={listLinkSelector}
                                                onChange={setListLinkSelector}
                                                hint={LIST_SELECTOR_HINTS.link}
                                                required
                                            />

                                            <SelectorField
                                                label="Selector ảnh thumbnail"
                                                value={listImageSelector}
                                                onChange={setListImageSelector}
                                                hint={LIST_SELECTOR_HINTS.image}
                                            />

                                            <SelectorField
                                                label="Selector tiêu đề trong danh sách"
                                                value={listTitleSelector}
                                                onChange={setListTitleSelector}
                                                hint={LIST_SELECTOR_HINTS.title}
                                            />

                                            <div className="border-t pt-4 mt-4">
                                                <h5 className="text-sm font-medium mb-3">Phân trang</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SelectorField
                                                        label="Selector nút Tiếp theo"
                                                        value={listPaginationNext}
                                                        onChange={setListPaginationNext}
                                                        hint={LIST_SELECTOR_HINTS.paginationNext}
                                                    />
                                                    <div className="space-y-2">
                                                        <Label>Số trang tối đa</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={100}
                                                            value={listMaxPages}
                                                            onChange={(e) => setListMaxPages(parseInt(e.target.value) || 5)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Detail Page Selectors Section */}
                        <AccordionItem value="detail-selectors">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    CSS Selectors trang chi tiết
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (Bắt buộc)
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pt-2">
                                    {crawlType === "article" ? (
                                        <>
                                            <SelectorField
                                                label="Tiêu đề"
                                                value={articleSelectors.title}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, title: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.title}
                                                required
                                            />
                                            <SelectorField
                                                label="Nội dung"
                                                value={articleSelectors.content}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, content: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.content}
                                                required
                                            />
                                            <SelectorField
                                                label="Tóm tắt"
                                                value={articleSelectors.excerpt || ""}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, excerpt: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.excerpt}
                                            />
                                            <SelectorField
                                                label="Ảnh đại diện"
                                                value={articleSelectors.featuredImage || ""}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, featuredImage: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.featuredImage}
                                            />
                                            <SelectorField
                                                label="Tác giả"
                                                value={articleSelectors.author || ""}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, author: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.author}
                                            />
                                            <SelectorField
                                                label="Ngày đăng"
                                                value={articleSelectors.publishDate || ""}
                                                onChange={(v) =>
                                                    setArticleSelectors({ ...articleSelectors, publishDate: v })
                                                }
                                                hint={ARTICLE_SELECTOR_HINTS.publishDate}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <SelectorField
                                                label="Tên sản phẩm"
                                                value={productSelectors.name}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, name: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.name}
                                                required
                                            />
                                            <SelectorField
                                                label="Giá bán"
                                                value={productSelectors.price}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, price: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.price}
                                                required
                                            />
                                            <SelectorField
                                                label="Giá gốc"
                                                value={productSelectors.originalPrice || ""}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, originalPrice: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.originalPrice}
                                            />
                                            <SelectorField
                                                label="Mô tả"
                                                value={productSelectors.description || ""}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, description: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.description}
                                            />
                                            <SelectorField
                                                label="Ảnh sản phẩm"
                                                value={productSelectors.images || ""}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, images: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.images}
                                            />
                                            <SelectorField
                                                label="Mã SKU"
                                                value={productSelectors.sku || ""}
                                                onChange={(v) =>
                                                    setProductSelectors({ ...productSelectors, sku: v })
                                                }
                                                hint={PRODUCT_SELECTOR_HINTS.sku}
                                            />
                                        </>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Hint */}
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <strong>Mẹo:</strong> Sử dụng DevTools (F12) trong trình duyệt để tìm CSS selector.
                        Nhấp chuột phải vào phần tử → Inspect → Copy selector.
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {editingSource && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting || saving}
                            className="sm:mr-auto"
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash className="w-4 h-4 mr-2" />
                            )}
                            Xóa nguồn
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={saving || deleting}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingSource ? "Cập nhật" : "Tạo nguồn"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
