"use client";

import { useState } from "react";
import {
    Link as LinkIcon,
    Loader2,
    Search,
    Trash2,
    CheckSquare,
    Square,
    ArrowRight,
    ExternalLink,
    Copy,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ExtractedLink {
    url: string;
    title: string;
    index: number;
    selected?: boolean;
}

interface CategoryCrawlerTabProps {
    onPushToImport?: (urls: string[]) => void;
}

export function CategoryCrawlerTab({ onPushToImport }: CategoryCrawlerTabProps) {
    const [categoryUrl, setCategoryUrl] = useState("");
    const [linkSelector, setLinkSelector] = useState("a[href]");
    const [containerSelector, setContainerSelector] = useState("");
    const [filterPattern, setFilterPattern] = useState("");
    const [excludePattern, setExcludePattern] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [links, setLinks] = useState<ExtractedLink[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleExtract = async () => {
        if (!categoryUrl.trim()) {
            toast.error("Vui lòng nhập URL danh mục");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/crawler/extract-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: categoryUrl,
                    linkSelector: linkSelector || "a[href]",
                    containerSelector: containerSelector || undefined,
                    filterPattern: filterPattern || undefined,
                    excludePattern: excludePattern || undefined,
                    limit: 200,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const extractedLinks = data.links.map((link: ExtractedLink) => ({
                    ...link,
                    selected: true,
                }));
                setLinks(extractedLinks);
                toast.success(`Tìm thấy ${data.linksFound} links`);
            } else {
                toast.error(data.error || "Không thể trích xuất links");
            }
        } catch (error) {
            console.error("Extract error:", error);
            toast.error("Lỗi khi trích xuất links");
        } finally {
            setLoading(false);
        }
    };

    const toggleLink = (index: number) => {
        setLinks(prev => prev.map((link, i) => 
            i === index ? { ...link, selected: !link.selected } : link
        ));
    };

    const toggleAll = (selected: boolean) => {
        setLinks(prev => prev.map(link => ({ ...link, selected })));
    };

    const removeSelected = () => {
        setLinks(prev => prev.filter(link => !link.selected));
    };

    const selectedLinks = links.filter(l => l.selected);
    const selectedUrls = selectedLinks.map(l => l.url);

    const copySelectedUrls = () => {
        navigator.clipboard.writeText(selectedUrls.join("\n"));
        toast.success(`Đã copy ${selectedUrls.length} URLs`);
    };

    const handlePushToImport = () => {
        if (selectedUrls.length === 0) {
            toast.error("Chưa chọn URL nào");
            return;
        }
        if (onPushToImport) {
            onPushToImport(selectedUrls);
            toast.success(`Đã đẩy ${selectedUrls.length} URLs sang Quick Import`);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Lấy URLs từ danh mục
                    </CardTitle>
                    <CardDescription>
                        Nhập URL trang danh mục để lấy danh sách các URL bài viết
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>URL Danh mục <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com/category/news"
                                value={categoryUrl}
                                onChange={(e) => setCategoryUrl(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleExtract} disabled={loading || !categoryUrl.trim()}>
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                <span className="ml-2">Lấy URLs</span>
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                            <Filter className="w-4 h-4" />
                            Tùy chọn nâng cao
                        </Button>
                        {showAdvanced && (
                            <div className="space-y-3 mt-3 p-4 border rounded-lg bg-muted/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Link Selector</Label>
                                        <Input
                                            placeholder="a[href]"
                                            value={linkSelector}
                                            onChange={(e) => setLinkSelector(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            CSS selector cho links. Mặc định: a[href]
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Container Selector</Label>
                                        <Input
                                            placeholder=".article-list, #content"
                                            value={containerSelector}
                                            onChange={(e) => setContainerSelector(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Giới hạn tìm kiếm trong container
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Filter Pattern (Regex)</Label>
                                        <Input
                                            placeholder="/article/|/post/|/tin-tuc/"
                                            value={filterPattern}
                                            onChange={(e) => setFilterPattern(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Chỉ giữ URLs khớp với pattern
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Exclude Pattern (Regex)</Label>
                                        <Input
                                            placeholder="/tag/|/category/|#comment"
                                            value={excludePattern}
                                            onChange={(e) => setExcludePattern(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Loại bỏ URLs khớp với pattern
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {links.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                Kết quả: {links.length} URLs
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    Đã chọn: {selectedLinks.length}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                                <CheckSquare className="w-4 h-4 mr-1" />
                                Chọn tất cả
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                                <Square className="w-4 h-4 mr-1" />
                                Bỏ chọn
                            </Button>
                            <Button variant="outline" size="sm" onClick={removeSelected} disabled={selectedLinks.length === 0}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Xóa đã chọn
                            </Button>
                            <Button variant="outline" size="sm" onClick={copySelectedUrls} disabled={selectedLinks.length === 0}>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy URLs
                            </Button>
                            <div className="flex-1" />
                            <Button onClick={handlePushToImport} disabled={selectedLinks.length === 0}>
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Đẩy sang Quick Import ({selectedLinks.length})
                            </Button>
                        </div>

                        {/* Links list */}
                        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                            <div className="divide-y">
                                {links.map((link, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 hover:bg-muted/50 ${
                                            link.selected ? "bg-primary/5" : ""
                                        }`}
                                    >
                                        <Checkbox
                                            checked={link.selected}
                                            onCheckedChange={() => toggleLink(index)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">
                                                {link.title || "(Không có tiêu đề)"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {link.url}
                                            </p>
                                        </div>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

