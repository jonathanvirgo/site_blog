"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CrawlSourceFormData, Category, CategoryMapping } from "../types";

interface SourceCategoryTabProps {
    formData: CrawlSourceFormData;
    updateFormData: (updates: Partial<CrawlSourceFormData>) => void;
    categories: Category[];
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export function SourceCategoryTab({
    formData,
    updateFormData,
    categories,
}: SourceCategoryTabProps) {
    const [testingMapping, setTestingMapping] = useState<string | null>(null);

    const addMapping = () => {
        const newMapping: CategoryMapping = {
            id: generateId(),
            categoryId: "",
            listPageUrl: "",
            status: "draft",
        };
        updateFormData({
            categoryMappings: [...formData.categoryMappings, newMapping],
        });
    };

    const updateMapping = (id: string, updates: Partial<CategoryMapping>) => {
        updateFormData({
            categoryMappings: formData.categoryMappings.map((m) =>
                m.id === id ? { ...m, ...updates } : m
            ),
        });
    };

    const removeMapping = (id: string) => {
        updateFormData({
            categoryMappings: formData.categoryMappings.filter((m) => m.id !== id),
        });
    };

    const testMapping = async (mapping: CategoryMapping) => {
        if (!mapping.listPageUrl) {
            toast.error("Vui lòng nhập URL trang danh mục");
            return;
        }
        if (!formData.listItemSelector || !formData.listLinkSelector) {
            toast.error("Vui lòng cấu hình selectors cho trang danh mục");
            return;
        }

        setTestingMapping(mapping.id);
        try {
            const res = await fetch("/api/crawler/test-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: mapping.listPageUrl,
                    itemSelector: formData.listItemSelector,
                    linkSelector: formData.listLinkSelector,
                    imageSelector: formData.listImageSelector,
                    titleSelector: formData.listTitleSelector,
                }),
            });

            if (!res.ok) {
                throw new Error("Test failed");
            }

            const result = await res.json();
            updateMapping(mapping.id, {
                testResult: {
                    linksFound: result.linksFound || 0,
                    linksWithImage: result.linksWithImage || 0,
                    sampleLinks: result.sampleLinks || [],
                },
            });
            toast.success(`Tìm thấy ${result.linksFound} links`);
        } catch (error) {
            toast.error("Lỗi khi test URL");
            console.error(error);
        } finally {
            setTestingMapping(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Enable toggle */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                        <Switch
                            id="listPageEnabled"
                            checked={formData.listPageEnabled}
                            onCheckedChange={(checked) =>
                                updateFormData({ listPageEnabled: checked })
                            }
                        />
                        <Label htmlFor="listPageEnabled" className="font-medium">
                            Bật crawl trang danh mục để lấy URLs tự động
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {formData.listPageEnabled && (
                <>
                    {/* Category Mappings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Mappings</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Mỗi mapping gồm: URL danh mục + Danh mục gán + Trạng thái bài viết
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.categoryMappings.map((mapping) => (
                                <div
                                    key={mapping.id}
                                    className="border rounded-lg p-4 space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label>URL trang danh mục</Label>
                                        <Input
                                            value={mapping.listPageUrl}
                                            onChange={(e) =>
                                                updateMapping(mapping.id, { listPageUrl: e.target.value })
                                            }
                                            placeholder="https://example.com/category"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Danh mục</Label>
                                            <Select
                                                value={mapping.categoryId || "none"}
                                                onValueChange={(value) =>
                                                    updateMapping(mapping.id, {
                                                        categoryId: value === "none" ? "" : value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- Chọn danh mục --</SelectItem>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Trạng thái bài viết</Label>
                                            <Select
                                                value={mapping.status}
                                                onValueChange={(value: "draft" | "pending_review" | "published") =>
                                                    updateMapping(mapping.id, { status: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                                                    <SelectItem value="pending_review">Chờ duyệt</SelectItem>
                                                    <SelectItem value="published">Đã xuất bản</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => testMapping(mapping)}
                                            disabled={testingMapping === mapping.id}
                                        >
                                            {testingMapping === mapping.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Search className="h-4 w-4 mr-2" />
                                            )}
                                            Test URL
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMapping(mapping.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa
                                        </Button>
                                    </div>

                                    {mapping.testResult && (
                                        <div className="bg-muted p-3 rounded text-sm">
                                            <p className="text-green-600">
                                                ✓ Tìm thấy {mapping.testResult.linksFound} links
                                            </p>
                                            <p className="text-muted-foreground">
                                                {mapping.testResult.linksWithImage} links có ảnh
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" onClick={addMapping}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm Mapping
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Selectors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Selectors cho trang danh mục</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Selector item (container) *</Label>
                                    <Input
                                        value={formData.listItemSelector || ""}
                                        onChange={(e) =>
                                            updateFormData({ listItemSelector: e.target.value })
                                        }
                                        placeholder=".article-item"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Selector link *</Label>
                                    <Input
                                        value={formData.listLinkSelector || ""}
                                        onChange={(e) =>
                                            updateFormData({ listLinkSelector: e.target.value })
                                        }
                                        placeholder="a.title-link"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Selector ảnh thumbnail</Label>
                                    <Input
                                        value={formData.listImageSelector || ""}
                                        onChange={(e) =>
                                            updateFormData({ listImageSelector: e.target.value })
                                        }
                                        placeholder="img.thumb"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Selector tiêu đề</Label>
                                    <Input
                                        value={formData.listTitleSelector || ""}
                                        onChange={(e) =>
                                            updateFormData({ listTitleSelector: e.target.value })
                                        }
                                        placeholder=".title, h3"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Phân trang</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup
                                value={formData.paginationConfig?.type || "next_button"}
                                onValueChange={(value: "next_button" | "infinite_scroll" | "numbered_url") =>
                                    updateFormData({
                                        paginationConfig: { ...formData.paginationConfig!, type: value },
                                    })
                                }
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="next_button" id="next_button" />
                                    <Label htmlFor="next_button">Nút &quot;Tiếp theo&quot;</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="infinite_scroll" id="infinite_scroll" />
                                    <Label htmlFor="infinite_scroll">Infinite Scroll</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="numbered_url" id="numbered_url" />
                                    <Label htmlFor="numbered_url">Numbered URL</Label>
                                </div>
                            </RadioGroup>

                            {formData.paginationConfig?.type === "next_button" && (
                                <div className="space-y-2 mt-4">
                                    <Label>Selector nút Next</Label>
                                    <Input
                                        value={formData.paginationConfig?.nextSelector || ""}
                                        onChange={(e) =>
                                            updateFormData({
                                                paginationConfig: {
                                                    ...formData.paginationConfig!,
                                                    nextSelector: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder=".pagination .next"
                                    />
                                </div>
                            )}

                            {formData.paginationConfig?.type === "infinite_scroll" && (
                                <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Selector nút &quot;Xem thêm&quot;</Label>
                                        <Input
                                            value={formData.paginationConfig?.loadMoreSelector || ""}
                                            onChange={(e) =>
                                                updateFormData({
                                                    paginationConfig: {
                                                        ...formData.paginationConfig!,
                                                        loadMoreSelector: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder=".load-more"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Delay sau mỗi lần scroll (ms)</Label>
                                        <Input
                                            type="number"
                                            value={formData.paginationConfig?.scrollDelay || 1500}
                                            onChange={(e) =>
                                                updateFormData({
                                                    paginationConfig: {
                                                        ...formData.paginationConfig!,
                                                        scrollDelay: parseInt(e.target.value) || 1500,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.paginationConfig?.type === "numbered_url" && (
                                <div className="space-y-2 mt-4">
                                    <Label>URL pattern</Label>
                                    <Input
                                        value={formData.paginationConfig?.urlPattern || ""}
                                        onChange={(e) =>
                                            updateFormData({
                                                paginationConfig: {
                                                    ...formData.paginationConfig!,
                                                    urlPattern: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="?page={n} hoặc /page/{n}"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Số trang tối đa</Label>
                                <Input
                                    type="number"
                                    value={formData.paginationConfig?.maxPages || 5}
                                    onChange={(e) =>
                                        updateFormData({
                                            paginationConfig: {
                                                ...formData.paginationConfig!,
                                                maxPages: parseInt(e.target.value) || 5,
                                            },
                                        })
                                    }
                                    className="w-24"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
