"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
    Link as LinkIcon,
    Code,
    ListOrdered,
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
    XCircle,
    Settings,
    Plus,
} from "lucide-react";
import { toast } from "sonner";

// ==================== TYPES ====================

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

interface ImportResult {
    url: string;
    status: "pending" | "processing" | "success" | "failed";
    title?: string;
    error?: string;
    id?: string;
}

interface ImportTabProps {
    articleCategories: Category[];
    productCategories: Category[];
}

const STORAGE_KEY = "crawler_selector_presets";

// ==================== COMPONENT ====================

export function ImportTab({ articleCategories, productCategories }: ImportTabProps) {
    // Input mode: single URL, multiple URLs, or HTML
    const [inputMode, setInputMode] = useState<"single" | "multi" | "html">("single");
    
    // Content type
    const [type, setType] = useState<"article" | "product">("article");
    const categories = type === "article" ? articleCategories : productCategories;
    
    // Single URL input
    const [singleUrl, setSingleUrl] = useState("");
    
    // Multi URLs input
    const [multiUrls, setMultiUrls] = useState("");
    
    // HTML input
    const [htmlInput, setHtmlInput] = useState("");
    const [htmlTitle, setHtmlTitle] = useState("");
    
    // Selectors
    const [titleSelector, setTitleSelector] = useState("h1");
    const [contentSelector, setContentSelector] = useState("article, .content, .post-content, .entry-content");
    const [excerptSelector, setExcerptSelector] = useState(".excerpt, .sapo, .description");
    const [featuredImageSelector, setFeaturedImageSelector] = useState(".featured-image img, .post-thumbnail img");
    const [priceSelector, setPriceSelector] = useState(".price, .product-price");
    const [originalPriceSelector, setOriginalPriceSelector] = useState(".original-price, .old-price");
    const [removeSelectors, setRemoveSelectors] = useState(".ads, .social-share, .related-posts, script, style");
    
    // Options
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("draft");
    const [uploadImages, setUploadImages] = useState(true);
    
    // Preview
    const [previewing, setPreviewing] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    
    // Import progress
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState<ImportResult[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Presets
    const [presets, setPresets] = useState<SelectorPreset[]>([]);
    const [presetName, setPresetName] = useState("");
    
    // Load presets
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setPresets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse presets:", e);
            }
        }
    }, []);
    
    // Auto-apply preset based on URL domain
    useEffect(() => {
        if (singleUrl && inputMode === "single") {
            try {
                const domain = new URL(singleUrl).hostname.replace("www.", "");
                const matchingPreset = presets.find(p => domain.includes(p.domain));
                if (matchingPreset) {
                    applyPreset(matchingPreset);
                }
            } catch {
                // Invalid URL
            }
        }
    }, [singleUrl, presets, inputMode]);

    // Get selectors object
    const getSelectors = useCallback(() => {
        const selectors: Record<string, string> = {
            title: titleSelector,
            content: contentSelector,
        };
        if (excerptSelector) selectors.excerpt = excerptSelector;
        if (featuredImageSelector) selectors.featuredImage = featuredImageSelector;
        if (type === "product") {
            if (priceSelector) selectors.price = priceSelector;
            if (originalPriceSelector) selectors.originalPrice = originalPriceSelector;
        }
        return selectors;
    }, [titleSelector, contentSelector, excerptSelector, featuredImageSelector, priceSelector, originalPriceSelector, type]);

    // Apply preset
    const applyPreset = (preset: SelectorPreset) => {
        setType(preset.type);
        setTitleSelector(preset.selectors.title);
        setContentSelector(preset.selectors.content);
        setExcerptSelector(preset.selectors.excerpt || "");
        setFeaturedImageSelector(preset.selectors.featuredImage || "");
        setPriceSelector(preset.selectors.price || "");
        setOriginalPriceSelector(preset.selectors.originalPrice || "");
        setRemoveSelectors(preset.removeSelectors.join(", "));
        toast.success(`Đã áp dụng preset: ${preset.name}`);
    };

    // Save preset
    const savePreset = () => {
        if (!presetName.trim()) {
            toast.error("Vui lòng nhập tên preset");
            return;
        }
        let domain = "";
        try {
            if (singleUrl) {
                domain = new URL(singleUrl).hostname.replace("www.", "");
            }
        } catch {
            // ignore
        }

        const newPreset: SelectorPreset = {
            id: Date.now().toString(),
            name: presetName,
            domain,
            type,
            selectors: {
                title: titleSelector,
                content: contentSelector,
                excerpt: excerptSelector,
                featuredImage: featuredImageSelector,
                price: priceSelector,
                originalPrice: originalPriceSelector,
            },
            removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
        };

        const updated = [...presets, newPreset];
        setPresets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setPresetName("");
        toast.success("Đã lưu preset");
    };

    const deletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        toast.success("Đã xóa preset");
    };

    // Preview single URL
    const handlePreview = async () => {
        if (inputMode === "single" && !singleUrl) {
            toast.error("Vui lòng nhập URL");
            return;
        }
        if (inputMode === "html" && !htmlInput) {
            toast.error("Vui lòng nhập HTML");
            return;
        }

        setPreviewing(true);
        setPreviewData(null);
        setImportResults([]);

        try {
            const res = await fetch("/api/crawler/quick-import/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: inputMode === "single" ? singleUrl : undefined,
                    html: inputMode === "html" ? htmlInput : undefined,
                    type,
                    selectors: getSelectors(),
                    removeSelectors: removeSelectors.split(",").map(s => s.trim()).filter(Boolean),
                }),
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

    // Import single item
    const importSingle = async (url?: string, html?: string, title?: string): Promise<ImportResult> => {
        try {
            const res = await fetch("/api/crawler/quick-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    html,
                    htmlTitle: title,
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
                return {
                    url: url || "HTML Input",
                    status: "success",
                    title: data.data?.title,
                    id: data.data?.id,
                };
            } else {
                return {
                    url: url || "HTML Input",
                    status: "failed",
                    error: data.error || "Import thất bại",
                };
            }
        } catch (error) {
            return {
                url: url || "HTML Input",
                status: "failed",
                error: "Không thể kết nối server",
            };
        }
    };

    // Handle import
    const handleImport = async () => {
        if (!categoryId) {
            toast.error("Vui lòng chọn danh mục");
            return;
        }

        setImporting(true);
        setImportResults([]);
        setCurrentIndex(0);

        try {
            if (inputMode === "single") {
                if (!singleUrl) {
                    toast.error("Vui lòng nhập URL");
                    setImporting(false);
                    return;
                }
                const result = await importSingle(singleUrl);
                setImportResults([result]);
                if (result.status === "success") {
                    toast.success("Import thành công!");
                    setSingleUrl("");
                    setPreviewData(null);
                } else {
                    toast.error(result.error || "Import thất bại");
                }
            } else if (inputMode === "html") {
                if (!htmlInput) {
                    toast.error("Vui lòng nhập HTML");
                    setImporting(false);
                    return;
                }
                const result = await importSingle(undefined, htmlInput, htmlTitle);
                setImportResults([result]);
                if (result.status === "success") {
                    toast.success("Import thành công!");
                    setHtmlInput("");
                    setHtmlTitle("");
                    setPreviewData(null);
                } else {
                    toast.error(result.error || "Import thất bại");
                }
            } else if (inputMode === "multi") {
                const urls = multiUrls
                    .split("\n")
                    .map(u => u.trim())
                    .filter(u => u && u.startsWith("http"));

                if (urls.length === 0) {
                    toast.error("Vui lòng nhập ít nhất 1 URL hợp lệ");
                    setImporting(false);
                    return;
                }

                // Initialize results
                const initialResults: ImportResult[] = urls.map(url => ({
                    url,
                    status: "pending" as const,
                }));
                setImportResults(initialResults);

                // Process each URL
                for (let i = 0; i < urls.length; i++) {
                    setCurrentIndex(i);

                    // Update status to processing
                    setImportResults(prev => prev.map((r, idx) =>
                        idx === i ? { ...r, status: "processing" as const } : r
                    ));

                    const result = await importSingle(urls[i]);

                    // Update with result
                    setImportResults(prev => prev.map((r, idx) =>
                        idx === i ? result : r
                    ));

                    // Small delay between requests
                    if (i < urls.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                const successCount = urls.length;
                toast.success(`Hoàn thành! ${successCount}/${urls.length} URLs`);
                setMultiUrls("");
            }
        } finally {
            setImporting(false);
        }
    };

    // Calculate progress
    const progress = importResults.length > 0
        ? (importResults.filter(r => r.status === "success" || r.status === "failed").length / importResults.length) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Import Nội dung</h2>
                    <p className="text-muted-foreground">
                        Import bài viết hoặc sản phẩm từ URL hoặc HTML
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Input & Options */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Input Mode Tabs */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Nguồn dữ liệu</CardTitle>
                                <div className="flex gap-2">
                                    <Select value={type} onValueChange={(v) => setType(v as "article" | "product")}>
                                        <SelectTrigger className="w-[140px]">
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "single" | "multi" | "html")}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="single" className="gap-2">
                                        <LinkIcon className="w-4 h-4" />
                                        1 URL
                                    </TabsTrigger>
                                    <TabsTrigger value="multi" className="gap-2">
                                        <ListOrdered className="w-4 h-4" />
                                        Nhiều URLs
                                    </TabsTrigger>
                                    <TabsTrigger value="html" className="gap-2">
                                        <Code className="w-4 h-4" />
                                        HTML
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="single" className="mt-4 space-y-3">
                                    <div className="space-y-2">
                                        <Label>URL bài viết/sản phẩm</Label>
                                        <Input
                                            value={singleUrl}
                                            onChange={(e) => setSingleUrl(e.target.value)}
                                            placeholder="https://example.com/bai-viet-123"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="multi" className="mt-4 space-y-3">
                                    <div className="space-y-2">
                                        <Label>Danh sách URLs (mỗi dòng 1 URL)</Label>
                                        <Textarea
                                            value={multiUrls}
                                            onChange={(e) => setMultiUrls(e.target.value)}
                                            placeholder={"https://example.com/bai-viet-1\nhttps://example.com/bai-viet-2\nhttps://example.com/bai-viet-3"}
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {multiUrls.split("\n").filter(u => u.trim()).length} URLs
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="html" className="mt-4 space-y-3">
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
                                            value={htmlInput}
                                            onChange={(e) => setHtmlInput(e.target.value)}
                                            placeholder="<h1>Tiêu đề</h1><p>Nội dung...</p>"
                                            rows={8}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* CSS Selectors - Only for URL mode */}
                    {inputMode !== "html" && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">CSS Selectors</CardTitle>
                                    {presets.length > 0 && (
                                        <Select onValueChange={(id) => {
                                            const preset = presets.find(p => p.id === id);
                                            if (preset) applyPreset(preset);
                                        }}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Chọn preset..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {presets.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.domain})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tiêu đề *</Label>
                                        <Input
                                            value={titleSelector}
                                            onChange={(e) => setTitleSelector(e.target.value)}
                                            placeholder="h1"
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

                                <Accordion type="single" collapsible>
                                    <AccordionItem value="more">
                                        <AccordionTrigger className="text-sm">
                                            <span className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                Thêm selectors
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
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
                                                <Label>Xóa elements</Label>
                                                <Input
                                                    value={removeSelectors}
                                                    onChange={(e) => setRemoveSelectors(e.target.value)}
                                                    placeholder=".ads, .related-articles"
                                                />
                                            </div>

                                            {/* Save preset */}
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Input
                                                    value={presetName}
                                                    onChange={(e) => setPresetName(e.target.value)}
                                                    placeholder="Tên preset (VD: VnExpress)"
                                                    className="flex-1"
                                                />
                                                <Button variant="outline" onClick={savePreset} size="sm">
                                                    <Save className="w-4 h-4 mr-1" />
                                                    Lưu Preset
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    )}

                    {/* Options & Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Cài đặt Import</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Danh mục *</Label>
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
                                <div className="space-y-2 col-span-2">
                                    <Label>Upload ảnh lên Cloudinary</Label>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch checked={uploadImages} onCheckedChange={setUploadImages} />
                                        <span className="text-sm text-muted-foreground">
                                            {uploadImages ? "Bật - Ảnh sẽ được tải lên Cloudinary" : "Tắt - Giữ nguyên URL gốc"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                {inputMode === "single" && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePreview}
                                        disabled={previewing || !singleUrl}
                                    >
                                        {previewing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4 mr-2" />
                                        )}
                                        Preview
                                    </Button>
                                )}
                                <Button
                                    onClick={handleImport}
                                    disabled={importing || !categoryId || (inputMode === "single" && !singleUrl) || (inputMode === "multi" && !multiUrls.trim()) || (inputMode === "html" && !htmlInput)}
                                >
                                    {importing ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    {inputMode === "multi" ? `Import ${multiUrls.split("\n").filter(u => u.trim()).length} URLs` : "Import"}
                                </Button>
                            </div>

                            {/* Progress bar for multi import */}
                            {importing && inputMode === "multi" && importResults.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Đang xử lý...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Import Results */}
                    {importResults.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Kết quả Import
                                    <Badge variant="outline">
                                        {importResults.filter(r => r.status === "success").length}/{importResults.length} thành công
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {importResults.map((result, i) => (
                                        <div key={i} className={`flex items-center justify-between p-2 rounded ${
                                            result.status === "success" ? "bg-green-50" :
                                            result.status === "failed" ? "bg-red-50" :
                                            result.status === "processing" ? "bg-blue-50" : "bg-gray-50"
                                        }`}>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {result.status === "success" && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                                {result.status === "failed" && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                                                {result.status === "processing" && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                                                {result.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                                                <span className="truncate text-sm">
                                                    {result.title || result.url}
                                                </span>
                                            </div>
                                            {result.error && (
                                                <span className="text-xs text-red-600 ml-2">{result.error}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="space-y-4">
                    <Card className="sticky top-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!previewData ? (
                                <div className="text-center text-muted-foreground py-12">
                                    {inputMode === "single"
                                        ? "Nhập URL và nhấn Preview để xem trước"
                                        : inputMode === "multi"
                                        ? "Preview không khả dụng cho nhiều URLs"
                                        : "Nhập HTML và nhấn Preview để xem trước"
                                    }
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tiêu đề</Label>
                                        <p className="font-semibold">{previewData.title || "(Không tìm thấy)"}</p>
                                    </div>

                                    {/* Featured Image */}
                                    {previewData.featuredImage && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Ảnh đại diện</Label>
                                            <img
                                                src={previewData.featuredImage}
                                                alt="Featured"
                                                className="w-full max-h-32 object-cover rounded mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Excerpt */}
                                    {previewData.excerpt && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Tóm tắt</Label>
                                            <p className="text-sm line-clamp-3">{previewData.excerpt}</p>
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

                                    {/* Content preview */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Nội dung</Label>
                                        <div
                                            className="border rounded p-2 prose prose-sm max-w-none max-h-[200px] overflow-y-auto mt-1 bg-muted/30 text-xs"
                                            dangerouslySetInnerHTML={{ __html: previewData.content?.substring(0, 1000) || "(Không tìm thấy)" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Saved Presets */}
                    {presets.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Presets đã lưu ({presets.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {presets.map(preset => (
                                        <div key={preset.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                            <div>
                                                <span className="font-medium">{preset.name}</span>
                                                <span className="text-muted-foreground ml-1">({preset.domain})</span>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => deletePreset(preset.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

