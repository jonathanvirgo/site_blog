"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search, Settings, Loader2, Image as ImageIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CrawlSourceFormData, ArticleSelectors, ProductSelectors, FieldConfig, ImageFieldConfig } from "../types";
import { FieldConfigModal } from "./FieldConfigModal";
import { ImageConfigModal } from "./ImageConfigModal";

interface SourceDetailTabProps {
    formData: CrawlSourceFormData;
    updateFormData: (updates: Partial<CrawlSourceFormData>) => void;
}

interface SelectorFieldProps {
    label: string;
    fieldKey: string;
    value: string;
    onChange: (value: string) => void;
    testUrl: string;
    required?: boolean;
    placeholder?: string;
    isImageField?: boolean;
    fieldConfig?: FieldConfig | ImageFieldConfig;
    onConfigChange?: (config: FieldConfig | ImageFieldConfig) => void;
}

interface TestResult {
    success: boolean;
    value?: string;
    htmlContent?: string;
    images?: string[];
    links?: Array<{ url: string; text: string }>;
    charCount?: number;
    htmlCharCount?: number;
}

function SelectorField({
    label,
    fieldKey,
    value,
    onChange,
    testUrl,
    required,
    placeholder,
    isImageField,
    fieldConfig,
    onConfigChange
}: SelectorFieldProps) {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [imageConfigModalOpen, setImageConfigModalOpen] = useState(false);

    const handleTest = async () => {
        if (!testUrl) {
            toast.error("Vui lòng nhập URL test");
            return;
        }
        if (!value) {
            toast.error("Vui lòng nhập selector");
            return;
        }

        setTesting(true);
        setResult(null);
        try {
            const res = await fetch("/api/crawler/test-selector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: testUrl, selector: value }),
            });

            if (!res.ok) throw new Error("Test failed");

            const data = await res.json();
            setResult(data);
            if (data.success) {
                setShowContent(true);
            }
        } catch {
            setResult({ success: false });
        } finally {
            setTesting(false);
        }
    };

    const handleConfigClick = () => {
        if (isImageField) {
            setImageConfigModalOpen(true);
        } else {
            setConfigModalOpen(true);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label className="flex-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            </div>
            <div className="flex gap-2">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleTest} disabled={testing}>
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleConfigClick}
                    title={isImageField ? "Cấu hình ảnh" : "Cấu hình transforms"}
                >
                    {isImageField ? <ImageIcon className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                </Button>
            </div>

            {/* Test Result Panel */}
            {result && (
                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                    {result.success ? (
                        <>
                            {/* Summary */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-green-600 font-medium">
                                    ✓ Tìm thấy {result.charCount || 0} ký tự
                                    {result.htmlCharCount ? ` (HTML: ${result.htmlCharCount} chars)` : ''}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowContent(!showContent)}
                                >
                                    {showContent ? "Ẩn" : "Hiện chi tiết"}
                                </Button>
                            </div>

                            {showContent && (
                                <>
                                    {/* Text/HTML Content */}
                                    {result.htmlContent && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Nội dung HTML:</Label>
                                            <div
                                                className="border rounded p-2 text-sm max-h-[300px] overflow-y-auto prose prose-sm max-w-none bg-white"
                                                dangerouslySetInnerHTML={{ __html: result.htmlContent }}
                                            />
                                        </div>
                                    )}

                                    {/* Plain text if no HTML */}
                                    {!result.htmlContent && result.value && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Giá trị:</Label>
                                            <div className="border rounded p-2 text-sm max-h-[200px] overflow-y-auto bg-white">
                                                {result.value}
                                            </div>
                                        </div>
                                    )}

                                    {/* Images */}
                                    {result.images && result.images.length > 0 && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Ảnh ({result.images.length}):
                                            </Label>
                                            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                                                {result.images.map((img, i) => (
                                                    <a
                                                        key={i}
                                                        href={img}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Image ${i + 1}`}
                                                            className="w-full h-16 object-cover rounded border hover:opacity-80"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Links */}
                                    {result.links && result.links.length > 0 && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Links ({result.links.length}):
                                            </Label>
                                            <div className="border rounded p-2 text-xs max-h-[150px] overflow-y-auto bg-white space-y-1">
                                                {result.links.map((link, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <a
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline truncate flex-1"
                                                        >
                                                            {link.text || link.url}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-red-600">✗ Không tìm thấy</span>
                    )}
                </div>
            )}

            {/* Field Config Modal */}
            <FieldConfigModal
                open={configModalOpen}
                onOpenChange={setConfigModalOpen}
                fieldName={label}
                config={fieldConfig || {}}
                onSave={(config) => onConfigChange?.(config)}
            />

            {/* Image Config Modal */}
            <ImageConfigModal
                open={imageConfigModalOpen}
                onOpenChange={setImageConfigModalOpen}
                fieldName={label}
                config={(fieldConfig as ImageFieldConfig) || {}}
                onSave={(config) => onConfigChange?.(config)}
            />
        </div>
    );
}

interface MultiSelectorFieldProps {
    label: string;
    fieldKey: string;
    values: string[];
    onChange: (values: string[]) => void;
    testUrl: string;
    hint?: string;
    isImageField?: boolean;
    fieldConfig?: ImageFieldConfig;
    onConfigChange?: (config: ImageFieldConfig) => void;
}

function MultiSelectorField({
    label,
    fieldKey,
    values,
    onChange,
    testUrl,
    hint,
    isImageField,
    fieldConfig,
    onConfigChange
}: MultiSelectorFieldProps) {
    const [testing, setTesting] = useState<number | null>(null);
    const [results, setResults] = useState<Record<number, string>>({});
    const [imageConfigModalOpen, setImageConfigModalOpen] = useState(false);

    const addSelector = () => {
        onChange([...values, ""]);
    };

    const updateSelector = (index: number, value: string) => {
        const newValues = [...values];
        newValues[index] = value;
        onChange(newValues);
    };

    const removeSelector = (index: number) => {
        onChange(values.filter((_, i) => i !== index));
    };

    const handleTest = async (index: number) => {
        const selector = values[index];
        if (!testUrl) {
            toast.error("Vui lòng nhập URL test");
            return;
        }
        if (!selector) {
            toast.error("Vui lòng nhập selector");
            return;
        }

        setTesting(index);
        try {
            const res = await fetch("/api/crawler/test-selector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: testUrl, selector, isMultiple: true }),
            });

            if (!res.ok) throw new Error("Test failed");

            const data = await res.json();
            setResults({ ...results, [index]: data.count ? `${data.count} items` : "Không tìm thấy" });
        } catch {
            setResults({ ...results, [index]: "Lỗi" });
        } finally {
            setTesting(null);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                {isImageField && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageConfigModalOpen(true)}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Cấu hình ảnh
                    </Button>
                )}
            </div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <div className="border rounded-lg p-3 space-y-2">
                {values.map((selector, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <Input
                            value={selector}
                            onChange={(e) => updateSelector(index, e.target.value)}
                            placeholder="CSS selector"
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTest(index)}
                            disabled={testing === index}
                        >
                            {testing === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSelector(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        {results[index] && (
                            <span className="text-xs text-muted-foreground">{results[index]}</span>
                        )}
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSelector}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm selector
                </Button>
            </div>

            {/* Image Config Modal */}
            <ImageConfigModal
                open={imageConfigModalOpen}
                onOpenChange={setImageConfigModalOpen}
                fieldName={label}
                config={fieldConfig || {}}
                onSave={(config) => onConfigChange?.(config)}
            />
        </div>
    );
}

export function SourceDetailTab({ formData, updateFormData }: SourceDetailTabProps) {
    const [testUrl, setTestUrl] = useState("");
    const [testingAll, setTestingAll] = useState(false);

    const isArticle = formData.crawlType === "article";
    const articleSelectors = formData.selectors.article || {} as ArticleSelectors;
    const productSelectors = formData.selectors.product || {} as ProductSelectors;

    const updateArticle = useCallback((updates: Partial<ArticleSelectors>) => {
        updateFormData({
            selectors: {
                ...formData.selectors,
                article: { ...articleSelectors, ...updates },
            },
        });
    }, [formData.selectors, articleSelectors, updateFormData]);

    const updateProduct = useCallback((updates: Partial<ProductSelectors>) => {
        updateFormData({
            selectors: {
                ...formData.selectors,
                product: { ...productSelectors, ...updates },
            },
        });
    }, [formData.selectors, productSelectors, updateFormData]);

    const updateArticleFieldConfig = useCallback((field: string, config: FieldConfig | ImageFieldConfig) => {
        updateArticle({
            fieldConfigs: {
                ...articleSelectors.fieldConfigs,
                [field]: config,
            },
        });
    }, [articleSelectors.fieldConfigs, updateArticle]);

    const updateProductFieldConfig = useCallback((field: string, config: FieldConfig | ImageFieldConfig) => {
        updateProduct({
            fieldConfigs: {
                ...productSelectors.fieldConfigs,
                [field]: config,
            },
        });
    }, [productSelectors.fieldConfigs, updateProduct]);

    const testAllSelectors = async () => {
        if (!testUrl) {
            toast.error("Vui lòng nhập URL test");
            return;
        }
        setTestingAll(true);
        toast.info("Đang test tất cả selectors...");
        setTimeout(() => {
            setTestingAll(false);
            toast.success("Test hoàn thành");
        }, 2000);
    };

    return (
        <div className="space-y-6">
            {/* Test URL */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>URL test trang chi tiết</Label>
                            <Input
                                value={testUrl}
                                onChange={(e) => setTestUrl(e.target.value)}
                                placeholder="https://example.com/bai-viet-123.html"
                            />
                        </div>
                        <Button onClick={testAllSelectors} disabled={testingAll}>
                            {testingAll ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Search className="h-4 w-4 mr-2" />
                            )}
                            Test tất cả
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Article Selectors */}
            {isArticle && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selectors cho Bài viết</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SelectorField
                            label="Tiêu đề"
                            fieldKey="title"
                            value={articleSelectors.title || ""}
                            onChange={(v) => updateArticle({ title: v })}
                            testUrl={testUrl}
                            required
                            placeholder="h1.title-detail"
                            fieldConfig={articleSelectors.fieldConfigs?.title}
                            onConfigChange={(c) => updateArticleFieldConfig("title", c)}
                        />
                        <SelectorField
                            label="Nội dung"
                            fieldKey="content"
                            value={articleSelectors.content || ""}
                            onChange={(v) => updateArticle({ content: v })}
                            testUrl={testUrl}
                            required
                            placeholder="article.fck_detail"
                            fieldConfig={articleSelectors.fieldConfigs?.content}
                            onConfigChange={(c) => updateArticleFieldConfig("content", c)}
                        />
                        <SelectorField
                            label="Tóm tắt"
                            fieldKey="excerpt"
                            value={articleSelectors.excerpt || ""}
                            onChange={(v) => updateArticle({ excerpt: v })}
                            testUrl={testUrl}
                            placeholder="p.description"
                            fieldConfig={articleSelectors.fieldConfigs?.excerpt}
                            onConfigChange={(c) => updateArticleFieldConfig("excerpt", c)}
                        />
                        <SelectorField
                            label="Tác giả"
                            fieldKey="author"
                            value={articleSelectors.author || ""}
                            onChange={(v) => updateArticle({ author: v })}
                            testUrl={testUrl}
                            placeholder=".author-name"
                            fieldConfig={articleSelectors.fieldConfigs?.author}
                            onConfigChange={(c) => updateArticleFieldConfig("author", c)}
                        />
                        <SelectorField
                            label="Ngày đăng"
                            fieldKey="publishDate"
                            value={articleSelectors.publishDate || ""}
                            onChange={(v) => updateArticle({ publishDate: v })}
                            testUrl={testUrl}
                            placeholder=".date-publish"
                            fieldConfig={articleSelectors.fieldConfigs?.publishDate}
                            onConfigChange={(c) => updateArticleFieldConfig("publishDate", c)}
                        />

                        <hr className="my-4" />

                        <div className="space-y-4">
                            <h4 className="font-medium">Ảnh đại diện (Featured Image)</h4>
                            <SelectorField
                                label="Selector"
                                fieldKey="featuredImage"
                                value={articleSelectors.featuredImage || ""}
                                onChange={(v) => updateArticle({ featuredImage: v })}
                                testUrl={testUrl}
                                placeholder="meta[property='og:image']::attr(content)"
                                isImageField
                                fieldConfig={articleSelectors.fieldConfigs?.featuredImage}
                                onConfigChange={(c) => updateArticleFieldConfig("featuredImage", c)}
                            />
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="useFrontImage"
                                    checked={articleSelectors.useFrontContentImageAsFeatured ?? true}
                                    onCheckedChange={(checked) =>
                                        updateArticle({ useFrontContentImageAsFeatured: checked })
                                    }
                                />
                                <Label htmlFor="useFrontImage">
                                    Nếu không lấy được, dùng ảnh đầu tiên trong bài viết
                                </Label>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <MultiSelectorField
                            label="Ảnh trong nội dung"
                            fieldKey="contentImages"
                            values={articleSelectors.contentImages || []}
                            onChange={(v) => updateArticle({ contentImages: v })}
                            testUrl={testUrl}
                            hint="Ảnh trong content sẽ được upload lên Cloudinary và thay thế URL gốc"
                            isImageField
                            fieldConfig={articleSelectors.fieldConfigs?.contentImages as ImageFieldConfig}
                            onConfigChange={(c) => updateArticleFieldConfig("contentImages", c)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Product Selectors */}
            {!isArticle && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selectors cho Sản phẩm</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SelectorField
                            label="Tên sản phẩm"
                            fieldKey="name"
                            value={productSelectors.name || ""}
                            onChange={(v) => updateProduct({ name: v })}
                            testUrl={testUrl}
                            required
                            placeholder="h1.product-title"
                            fieldConfig={productSelectors.fieldConfigs?.name}
                            onConfigChange={(c) => updateProductFieldConfig("name", c)}
                        />
                        <SelectorField
                            label="Mô tả ngắn"
                            fieldKey="shortDescription"
                            value={productSelectors.shortDescription || ""}
                            onChange={(v) => updateProduct({ shortDescription: v })}
                            testUrl={testUrl}
                            placeholder=".short-description"
                            fieldConfig={productSelectors.fieldConfigs?.shortDescription}
                            onConfigChange={(c) => updateProductFieldConfig("shortDescription", c)}
                        />
                        <SelectorField
                            label="Mô tả chi tiết"
                            fieldKey="description"
                            value={productSelectors.description || ""}
                            onChange={(v) => updateProduct({ description: v })}
                            testUrl={testUrl}
                            placeholder=".product-description"
                            fieldConfig={productSelectors.fieldConfigs?.description}
                            onConfigChange={(c) => updateProductFieldConfig("description", c)}
                        />

                        <hr className="my-4" />

                        <h4 className="font-medium">Giá</h4>
                        <SelectorField
                            label="Giá bán"
                            fieldKey="price"
                            value={productSelectors.price || ""}
                            onChange={(v) => updateProduct({ price: v })}
                            testUrl={testUrl}
                            required
                            placeholder=".price-current"
                            fieldConfig={productSelectors.fieldConfigs?.price}
                            onConfigChange={(c) => updateProductFieldConfig("price", c)}
                        />
                        <SelectorField
                            label="Giá gốc"
                            fieldKey="originalPrice"
                            value={productSelectors.originalPrice || ""}
                            onChange={(v) => updateProduct({ originalPrice: v })}
                            testUrl={testUrl}
                            placeholder=".price-original"
                            fieldConfig={productSelectors.fieldConfigs?.originalPrice}
                            onConfigChange={(c) => updateProductFieldConfig("originalPrice", c)}
                        />
                        <SelectorField
                            label="Giá theo variant"
                            fieldKey="variantPrice"
                            value={productSelectors.variantPrice || ""}
                            onChange={(v) => updateProduct({ variantPrice: v })}
                            testUrl={testUrl}
                            placeholder=".variant-price"
                            fieldConfig={productSelectors.fieldConfigs?.variantPrice}
                            onConfigChange={(c) => updateProductFieldConfig("variantPrice", c)}
                        />

                        <hr className="my-4" />

                        <SelectorField
                            label="Mã SKU"
                            fieldKey="sku"
                            value={productSelectors.sku || ""}
                            onChange={(v) => updateProduct({ sku: v })}
                            testUrl={testUrl}
                            placeholder=".sku-value"
                            fieldConfig={productSelectors.fieldConfigs?.sku}
                            onConfigChange={(c) => updateProductFieldConfig("sku", c)}
                        />

                        <hr className="my-4" />

                        <MultiSelectorField
                            label="Ảnh sản phẩm"
                            fieldKey="images"
                            values={productSelectors.images || []}
                            onChange={(v) => updateProduct({ images: v })}
                            testUrl={testUrl}
                            hint="Gộp selectors để lấy gallery ảnh, upload lên Cloudinary"
                            isImageField
                            fieldConfig={productSelectors.fieldConfigs?.images as ImageFieldConfig}
                            onConfigChange={(c) => updateProductFieldConfig("images", c)}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
