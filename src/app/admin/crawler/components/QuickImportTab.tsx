"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Search,
    Download,
    Image as ImageIcon,
    FileText,
    Package,
    Loader2,
    Save,
    Trash2,
    CheckCircle,
    AlertCircle,
    Link,
    Code,
    List,
    Play,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
}

interface SelectorPreset {
    id: string;
    name: string;
    domain: string;
    type: "article" | "product";
    selectors: {
        title: string;
        content: string;
        excerpt?: string;
        featuredImage?: string;
        price?: string;
        originalPrice?: string;
    };
    removeSelectors: string[];
}

interface PreviewData {
    title: string;
    excerpt: string;
    content: string;
    featuredImage: string | null;
    images: string[];
    imagesCount: number;
    price?: string;
    originalPrice?: string;
}

interface QueueItem {
    url: string;
    title?: string;
    status: "pending" | "importing" | "success" | "error";
    error?: string;
    resultId?: string;
}

interface QuickImportTabProps {
    articleCategories: Category[];
    productCategories: Category[];
    initialUrls?: string[];  // URLs đẩy từ CategoryCrawler
}

const STORAGE_KEY = "crawler_selector_presets";

export function QuickImportTab({ articleCategories, productCategories, initialUrls }: QuickImportTabProps) {
    // Input mode
    const [inputMode, setInputMode] = useState<"url" | "html" | "batch">("url");

    // Form state
    const [url, setUrl] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [htmlTitle, setHtmlTitle] = useState("");
    const [type, setType] = useState<"article" | "product">("article");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("draft");
    const [uploadImages, setUploadImages] = useState(true);

    // Batch import queue
    const [batchUrls, setBatchUrls] = useState("");
    const [importQueue, setImportQueue] = useState<QueueItem[]>([]);
    const [batchImporting, setBatchImporting] = useState(false);

    // Selectors
    const [titleSelector, setTitleSelector] = useState("h1");
    const [contentSelector, setContentSelector] = useState(".article-content");
    const [excerptSelector, setExcerptSelector] = useState("");
    const [featuredImageSelector, setFeaturedImageSelector] = useState("");
    const [priceSelector, setPriceSelector] = useState("");
    const [originalPriceSelector, setOriginalPriceSelector] = useState("");
    const [removeSelectors, setRemoveSelectors] = useState("");

    // Presets
    const [presets, setPresets] = useState<SelectorPreset[]>([]);
    const [presetName, setPresetName] = useState("");

    // Preview & Import state
    const [previewing, setPreviewing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);

    // Handle initial URLs from CategoryCrawler
    useEffect(() => {
        if (initialUrls && initialUrls.length > 0) {
            setBatchUrls(initialUrls.join("\n"));
            setInputMode("batch");
        }
    }, [initialUrls]);

    // Load presets from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setPresets(JSON.parse(saved));
            } catch { /* ignore */ }
        }
    }, []);

    // Auto-detect preset by domain
    useEffect(() => {
        if (!url) return;
        try {
            const domain = new URL(url).hostname.replace("www.", "");
            const preset = presets.find(p => p.domain === domain);
            if (preset) {
                applyPreset(preset);
                toast.info(`Đã tự động áp dụng preset: ${preset.name}`);
            }
        } catch { /* invalid URL */ }
    }, [url, presets]);

    const categories = type === "article" ? articleCategories : productCategories;

    const getSelectors = () => ({
        title: titleSelector,
        content: contentSelector,
        excerpt: excerptSelector || undefined,
        featuredImage: featuredImageSelector || undefined,
        price: type === "product" ? priceSelector || undefined : undefined,
        originalPrice: type === "product" ? originalPriceSelector || undefined : undefined,
    });

    const applyPreset = (preset: SelectorPreset) => {
        setType(preset.type);
        setTitleSelector(preset.selectors.title);
        setContentSelector(preset.selectors.content);
        setExcerptSelector(preset.selectors.excerpt || "");
        setFeaturedImageSelector(preset.selectors.featuredImage || "");
        setPriceSelector(preset.selectors.price || "");
        setOriginalPriceSelector(preset.selectors.originalPrice || "");
        setRemoveSelectors(preset.removeSelectors.join(", "));
    };

    const savePreset = () => {
        if (!presetName || !url) {
            toast.error("Vui lòng nhập tên preset và URL");
            return;
        }
        try {
            const domain = new URL(url).hostname.replace("www.", "");
            const newPreset: SelectorPreset = {
                id: Date.now().toString(),
                name: presetName,
                domain,
                type,
                selectors: getSelectors(),
                removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
            };
            const updated = [...presets.filter(p => p.domain !== domain), newPreset];
            setPresets(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            toast.success(`Đã lưu preset: ${presetName}`);
            setPresetName("");
        } catch {
            toast.error("URL không hợp lệ");
        }
    };

    const deletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        toast.success("Đã xóa preset");
    };

    const handlePreview = async () => {
        if (inputMode === "url" && !url) {
            toast.error("Vui lòng nhập URL");
            return;
        }
        if (inputMode === "html" && !htmlContent) {
            toast.error("Vui lòng paste HTML");
            return;
        }
        setPreviewing(true);
        setPreviewData(null);
        setImportResult(null);

        try {
            const requestBody = inputMode === "html"
                ? {
                    html: htmlContent,
                    htmlTitle: htmlTitle || undefined,
                    type,
                    selectors: getSelectors(),
                    removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                }
                : {
                    url,
                    type,
                    selectors: getSelectors(),
                    removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                };

            const res = await fetch("/api/crawler/quick-import/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPreviewData(data.data);
                toast.success("Đã tải preview thành công");
            } else {
                toast.error(data.error || "Preview thất bại");
            }
        } catch (error) {
            toast.error("Không thể kết nối server");
            console.error(error);
        } finally {
            setPreviewing(false);
        }
    };

    const handleImport = async () => {
        if (inputMode === "url" && !url) {
            toast.error("Vui lòng nhập URL");
            return;
        }
        if (inputMode === "html" && !htmlContent) {
            toast.error("Vui lòng paste HTML");
            return;
        }
        if (!previewData) {
            toast.error("Vui lòng preview trước khi import");
            return;
        }
        if (!categoryId) {
            toast.error("Vui lòng chọn danh mục");
            return;
        }
        setImporting(true);
        setImportResult(null);

        try {
            const requestBody = inputMode === "html"
                ? {
                    html: htmlContent,
                    htmlTitle: htmlTitle || undefined,
                    type,
                    selectors: getSelectors(),
                    categoryId,
                    status,
                    uploadImages,
                    removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                }
                : {
                    url,
                    type,
                    selectors: getSelectors(),
                    categoryId,
                    status,
                    uploadImages,
                    removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                };

            const res = await fetch("/api/crawler/quick-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setImportResult({ success: true, message: data.message, id: data.data.id });
                toast.success(data.message);
                // Clear form
                setUrl("");
                setHtmlContent("");
                setPreviewData(null);
            } else {
                setImportResult({ success: false, message: data.error });
                toast.error(data.error || "Import thất bại");
            }
        } catch (error) {
            toast.error("Không thể kết nối server");
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    // Batch import
    const startBatchImport = async () => {
        if (!categoryId) {
            toast.error("Vui lòng chọn danh mục trước");
            return;
        }

        const urls = batchUrls
            .split("\n")
            .map(u => u.trim())
            .filter(u => u && u.startsWith("http"));

        if (urls.length === 0) {
            toast.error("Không có URL hợp lệ");
            return;
        }

        // Initialize queue
        const queue: QueueItem[] = urls.map(u => ({
            url: u,
            status: "pending" as const,
        }));
        setImportQueue(queue);
        setBatchImporting(true);

        // Process queue
        for (let i = 0; i < queue.length; i++) {
            setImportQueue(prev => prev.map((item, idx) =>
                idx === i ? { ...item, status: "importing" } : item
            ));

            try {
                const res = await fetch("/api/crawler/quick-import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: queue[i].url,
                        type,
                        selectors: getSelectors(),
                        categoryId,
                        status,
                        uploadImages,
                        removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                    }),
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    setImportQueue(prev => prev.map((item, idx) =>
                        idx === i ? { ...item, status: "success", resultId: data.data?.id } : item
                    ));
                } else {
                    setImportQueue(prev => prev.map((item, idx) =>
                        idx === i ? { ...item, status: "error", error: data.error } : item
                    ));
                }
            } catch (error) {
                setImportQueue(prev => prev.map((item, idx) =>
                    idx === i ? { ...item, status: "error", error: "Lỗi kết nối" } : item
                ));
            }

            // Small delay between imports
            await new Promise(r => setTimeout(r, 500));
        }

        setBatchImporting(false);
        const successCount = importQueue.filter(i => i.status === "success").length;
        toast.success(`Hoàn thành: ${successCount}/${queue.length} bài viết`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-4">
                {/* Input Mode Tabs */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Import</CardTitle>
                        <CardDescription>
                            Nhập URL, paste HTML hoặc import hàng loạt
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "url" | "html" | "batch")}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="url" className="gap-1">
                                    <Link className="w-4 h-4" />
                                    URL
                                </TabsTrigger>
                                <TabsTrigger value="html" className="gap-1">
                                    <Code className="w-4 h-4" />
                                    Paste HTML
                                </TabsTrigger>
                                <TabsTrigger value="batch" className="gap-1">
                                    <List className="w-4 h-4" />
                                    Hàng loạt
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="url" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>URL bài viết/sản phẩm</Label>
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/bai-viet-123"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="html" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Tiêu đề (tùy chọn)</Label>
                                    <Input
                                        value={htmlTitle}
                                        onChange={(e) => setHtmlTitle(e.target.value)}
                                        placeholder="Tiêu đề bài viết"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nội dung HTML</Label>
                                    <Textarea
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                        placeholder="Paste HTML content here..."
                                        rows={6}
                                        className="font-mono text-sm"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="batch" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Danh sách URLs (mỗi URL một dòng)</Label>
                                    <Textarea
                                        value={batchUrls}
                                        onChange={(e) => setBatchUrls(e.target.value)}
                                        placeholder="https://example.com/bai-viet-1&#10;https://example.com/bai-viet-2&#10;https://example.com/bai-viet-3"
                                        rows={6}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {batchUrls.split("\n").filter(u => u.trim() && u.startsWith("http")).length} URLs hợp lệ
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Loại nội dung</Label>
                                <Select value={type} onValueChange={(v) => setType(v as "article" | "product")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="article">
                                            <div className="flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Bài viết
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="product">
                                            <div className="flex items-center">
                                                <Package className="w-4 h-4 mr-2" />
                                                Sản phẩm
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Danh mục</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Trạng thái</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Bản nháp</SelectItem>
                                        <SelectItem value={type === "article" ? "published" : "active"}>
                                            {type === "article" ? "Xuất bản" : "Hoạt động"}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Upload ảnh lên Cloudinary</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch checked={uploadImages} onCheckedChange={setUploadImages} />
                                    <span className="text-sm text-muted-foreground">
                                        {uploadImages ? "Bật" : "Tắt"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CSS Selectors */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">CSS Selectors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tiêu đề *</Label>
                                <Input
                                    value={titleSelector}
                                    onChange={(e) => setTitleSelector(e.target.value)}
                                    placeholder="h1.title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nội dung *</Label>
                                <Input
                                    value={contentSelector}
                                    onChange={(e) => setContentSelector(e.target.value)}
                                    placeholder=".article-content"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tóm tắt</Label>
                                <Input
                                    value={excerptSelector}
                                    onChange={(e) => setExcerptSelector(e.target.value)}
                                    placeholder=".excerpt, .sapo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ảnh đại diện</Label>
                                <Input
                                    value={featuredImageSelector}
                                    onChange={(e) => setFeaturedImageSelector(e.target.value)}
                                    placeholder=".featured-image img"
                                />
                            </div>
                        </div>

                        {type === "product" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Giá</Label>
                                    <Input
                                        value={priceSelector}
                                        onChange={(e) => setPriceSelector(e.target.value)}
                                        placeholder=".price"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Giá gốc</Label>
                                    <Input
                                        value={originalPriceSelector}
                                        onChange={(e) => setOriginalPriceSelector(e.target.value)}
                                        placeholder=".original-price"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Xóa elements (CSS selectors, cách nhau bởi dấu phẩy)</Label>
                            <Input
                                value={removeSelectors}
                                onChange={(e) => setRemoveSelectors(e.target.value)}
                                placeholder=".ads, .related-articles, .social-share"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Presets */}
                <Accordion type="single" collapsible>
                    <AccordionItem value="presets">
                        <AccordionTrigger>
                            <span className="flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                Preset Selectors ({presets.length})
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {/* Save new preset */}
                                <div className="flex gap-2">
                                    <Input
                                        value={presetName}
                                        onChange={(e) => setPresetName(e.target.value)}
                                        placeholder="Tên preset (VD: VnExpress)"
                                        className="flex-1"
                                    />
                                    <Button variant="outline" onClick={savePreset}>
                                        <Save className="w-4 h-4 mr-1" />
                                        Lưu
                                    </Button>
                                </div>

                                {/* List presets */}
                                {presets.length > 0 && (
                                    <div className="space-y-2">
                                        {presets.map(preset => (
                                            <div key={preset.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <div>
                                                    <span className="font-medium">{preset.name}</span>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        ({preset.domain})
                                                    </span>
                                                    <Badge variant="outline" className="ml-2">
                                                        {preset.type === "article" ? "Bài viết" : "Sản phẩm"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => applyPreset(preset)}>
                                                        Áp dụng
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deletePreset(preset.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Actions */}
                {inputMode === "batch" ? (
                    <div className="space-y-4">
                        <Button
                            onClick={startBatchImport}
                            disabled={batchImporting || !categoryId || !batchUrls.trim()}
                            className="w-full"
                        >
                            {batchImporting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Bắt đầu Import hàng loạt
                        </Button>

                        {/* Batch Queue */}
                        {importQueue.length > 0 && (
                            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                <div className="divide-y">
                                    {importQueue.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 text-sm">
                                            {item.status === "pending" && (
                                                <div className="w-4 h-4 rounded-full bg-gray-300" />
                                            )}
                                            {item.status === "importing" && (
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                            )}
                                            {item.status === "success" && (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                            {item.status === "error" && (
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="flex-1 truncate">{item.url}</span>
                                            {item.error && (
                                                <span className="text-xs text-red-500">{item.error}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={handlePreview}
                            disabled={previewing || (inputMode === "url" ? !url : !htmlContent)}
                        >
                            {previewing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4 mr-2" />
                            )}
                            Preview
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={importing || !previewData || !categoryId}
                            variant="default"
                        >
                            {importing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Import
                        </Button>
                    </div>
                )}

                {/* Import Result */}
                {importResult && inputMode !== "batch" && (
                    <div className={`p-4 rounded-lg ${importResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}>
                        <div className="flex items-center">
                            {importResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            )}
                            <span className={importResult.success ? "text-green-800" : "text-red-800"}>
                                {importResult.message}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!previewData ? (
                            <div className="text-center text-muted-foreground py-12">
                                Nhập URL và nhấn Preview để xem trước nội dung
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tiêu đề</Label>
                                    <p className="font-semibold text-lg">{previewData.title || "(Không tìm thấy)"}</p>
                                </div>

                                {/* Featured Image */}
                                {previewData.featuredImage && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Ảnh đại diện</Label>
                                        <img
                                            src={previewData.featuredImage}
                                            alt="Featured"
                                            className="w-full max-h-48 object-cover rounded mt-1"
                                        />
                                    </div>
                                )}

                                {/* Excerpt */}
                                {previewData.excerpt && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tóm tắt</Label>
                                        <p className="text-sm">{previewData.excerpt}</p>
                                    </div>
                                )}

                                {/* Price */}
                                {type === "product" && previewData.price && (
                                    <div className="flex gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Giá</Label>
                                            <p className="font-semibold text-red-600">{previewData.price}</p>
                                        </div>
                                        {previewData.originalPrice && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Giá gốc</Label>
                                                <p className="line-through text-muted-foreground">{previewData.originalPrice}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Images count */}
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {previewData.imagesCount} ảnh trong nội dung
                                    </span>
                                </div>

                                {/* Content */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Nội dung</Label>
                                    <div
                                        className="border rounded p-3 prose prose-sm max-w-none max-h-[400px] overflow-y-auto mt-1 bg-muted/30"
                                        dangerouslySetInnerHTML={{ __html: previewData.content || "(Không tìm thấy)" }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

