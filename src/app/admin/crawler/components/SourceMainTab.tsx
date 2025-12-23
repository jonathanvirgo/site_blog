"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CrawlSourceFormData } from "../types";

interface SourceMainTabProps {
    formData: CrawlSourceFormData;
    updateFormData: (updates: Partial<CrawlSourceFormData>) => void;
}

export function SourceMainTab({ formData, updateFormData }: SourceMainTabProps) {
    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên nguồn *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => updateFormData({ name: e.target.value })}
                                placeholder="VD: VnExpress"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="baseUrl">URL gốc *</Label>
                            <Input
                                id="baseUrl"
                                value={formData.baseUrl}
                                onChange={(e) => updateFormData({ baseUrl: e.target.value })}
                                placeholder="VD: https://vnexpress.net"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="crawlType">Loại nội dung</Label>
                            <Select
                                value={formData.crawlType}
                                onValueChange={(value: "article" | "product") =>
                                    updateFormData({ crawlType: value })
                                }
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
                        <div className="flex items-center space-x-4 pt-8">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => updateFormData({ isActive: checked })}
                            />
                            <Label htmlFor="isActive">Đang hoạt động</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Request Config */}
            <Card>
                <CardHeader>
                    <CardTitle>Cấu hình Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="delay">Delay giữa requests (ms)</Label>
                            <Input
                                id="delay"
                                type="number"
                                value={formData.requestDelayMs}
                                onChange={(e) =>
                                    updateFormData({ requestDelayMs: parseInt(e.target.value) || 1000 })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timeout">Timeout (ms)</Label>
                            <Input
                                id="timeout"
                                type="number"
                                value={formData.requestTimeout}
                                onChange={(e) =>
                                    updateFormData({ requestTimeout: parseInt(e.target.value) || 30000 })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headers">Custom Headers (JSON)</Label>
                        <Textarea
                            id="headers"
                            value={JSON.stringify(formData.requestHeaders || {}, null, 2)}
                            onChange={(e) => {
                                try {
                                    const headers = JSON.parse(e.target.value);
                                    updateFormData({ requestHeaders: headers });
                                } catch {
                                    // Invalid JSON, ignore
                                }
                            }}
                            placeholder='{"User-Agent": "Mozilla/5.0..."}'
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SEO Config */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>SEO Metadata</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="seoEnabled"
                                checked={formData.seoConfig?.enabled ?? true}
                                onCheckedChange={(checked) =>
                                    updateFormData({
                                        seoConfig: { ...formData.seoConfig, enabled: checked },
                                    })
                                }
                            />
                            <Label htmlFor="seoEnabled">Tự động lấy SEO</Label>
                        </div>
                    </div>
                </CardHeader>
                {formData.seoConfig?.enabled && (
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="metaTitle">Meta Title Selector</Label>
                            <Input
                                id="metaTitle"
                                value={formData.seoConfig?.metaTitle || ""}
                                onChange={(e) =>
                                    updateFormData({
                                        seoConfig: { ...formData.seoConfig!, metaTitle: e.target.value },
                                    })
                                }
                                placeholder="meta[property='og:title']::attr(content)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="metaDesc">Meta Description Selector</Label>
                            <Input
                                id="metaDesc"
                                value={formData.seoConfig?.metaDescription || ""}
                                onChange={(e) =>
                                    updateFormData({
                                        seoConfig: { ...formData.seoConfig!, metaDescription: e.target.value },
                                    })
                                }
                                placeholder="meta[name='description']::attr(content)"
                            />
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
