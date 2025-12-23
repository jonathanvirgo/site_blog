"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Play,
    RefreshCw,
    Link as LinkIcon,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Settings,
    Plus,
    Trash,
    ExternalLink,
    Eye,
    Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Types
interface CrawlSource {
    id: string;
    name: string;
    baseUrl: string;
    crawlType: "article" | "product";
    selectors: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    stats?: {
        totalJobs: number;
        successful: number;
        failed: number;
        pending: number;
    };
    lastCrawl?: string;
}

interface CrawlJob {
    id: string;
    url: string;
    type: "article" | "product";
    status: "queued" | "processing" | "success" | "failed" | "duplicate" | "pending_review";
    extractedData?: Record<string, unknown>;
    errorMessage?: string;
    createdAt: string;
    processedAt?: string;
    source?: { id: string; name: string };
    user?: { id: string; fullName: string };
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

const statusColors: Record<string, string> = {
    queued: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    duplicate: "bg-gray-100 text-gray-800",
    pending_review: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<string, string> = {
    queued: "Chờ xử lý",
    processing: "Đang xử lý",
    success: "Thành công",
    failed: "Thất bại",
    duplicate: "Trùng lặp",
    pending_review: "Chờ duyệt",
};

export default function CrawlerPage() {
    const [activeTab, setActiveTab] = useState("import");
    const [sources, setSources] = useState<CrawlSource[]>([]);
    const [jobs, setJobs] = useState<CrawlJob[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

    // Import form state
    const [importUrls, setImportUrls] = useState("");
    const [importType, setImportType] = useState<"article" | "product">("article");
    const [selectedSourceId, setSelectedSourceId] = useState<string>("");

    // Preview modal state
    const [previewJob, setPreviewJob] = useState<CrawlJob | null>(null);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [approving, setApproving] = useState(false);

    // Manual crawl state
    const [manualUrls, setManualUrls] = useState("");
    const [manualSourceId, setManualSourceId] = useState<string>("");
    const [manualCategoryId, setManualCategoryId] = useState<string>("");
    const [manualStatus, setManualStatus] = useState<string>("draft");
    const [manualCrawling, setManualCrawling] = useState(false);
    const [manualResults, setManualResults] = useState<Array<{
        url: string;
        status: string;
        error?: string;
        title?: string;
        slug?: string;
        itemId?: string;
    }>>([]);

    // Source modal state - no longer needed, using separate page
    // const [sourceModalOpen, setSourceModalOpen] = useState(false);
    // const [editingSource, setEditingSource] = useState<CrawlSource | null>(null);

    // Fetch data
    const fetchSources = useCallback(async () => {
        try {
            const res = await fetch("/api/crawler/sources");
            const data = await res.json();
            if (data.sources) setSources(data.sources);
        } catch (error) {
            console.error("Failed to fetch sources:", error);
        }
    }, []);

    const fetchJobs = useCallback(async (status?: string) => {
        try {
            const params = new URLSearchParams();
            if (status && status !== "all") params.set("status", status);
            params.set("limit", "50");

            const res = await fetch(`/api/crawler/jobs?${params}`);
            const data = await res.json();
            if (data.jobs) setJobs(data.jobs);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        }
    }, []);

    const fetchCategories = useCallback(async (type: "article" | "product" = "article") => {
        try {
            const res = await fetch(`/api/categories?type=${type}`);
            const data = await res.json();
            // API returns { data: { articleCategories: [...] } } or { data: { productCategories: [...] } }
            const categoriesData = data.data?.articleCategories || data.data?.productCategories || [];
            // Flatten the hierarchical structure
            const flattenCategories = (cats: Category[], level = 0): Category[] => {
                let result: Category[] = [];
                for (const cat of cats) {
                    result.push({ ...cat, name: "  ".repeat(level) + cat.name });
                    if ((cat as Category & { children?: Category[] }).children) {
                        result = result.concat(flattenCategories((cat as Category & { children?: Category[] }).children!, level + 1));
                    }
                }
                return result;
            };
            setCategories(flattenCategories(categoriesData));
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchSources(), fetchJobs(), fetchCategories()])
            .finally(() => setLoading(false));
    }, [fetchSources, fetchJobs, fetchCategories]);

    // Manual Crawl handler
    const handleManualCrawl = async () => {
        const urls = manualUrls
            .split("\n")
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (urls.length === 0) {
            toast.error("Vui lòng nhập ít nhất 1 URL");
            return;
        }
        if (!manualSourceId) {
            toast.error("Vui lòng chọn nguồn");
            return;
        }
        if (!manualCategoryId) {
            toast.error("Vui lòng chọn danh mục");
            return;
        }

        setManualCrawling(true);
        setManualResults([]);

        try {
            // Get source type
            const source = sources.find(s => s.id === manualSourceId);
            const type = source?.crawlType || "article";

            const res = await fetch("/api/crawler/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls,
                    sourceId: manualSourceId,
                    categoryId: manualCategoryId,
                    status: manualStatus,
                    type,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setManualResults(data.results || []);
                if (data.success > 0) {
                    setManualUrls("");
                }
            } else {
                toast.error(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Manual crawl error:", error);
            toast.error("Không thể thực hiện crawl");
        } finally {
            setManualCrawling(false);
        }
    };

    // Import URLs
    const handleImport = async () => {
        const urls = importUrls
            .split("\n")
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (urls.length === 0) {
            toast.error("Vui lòng nhập ít nhất 1 URL");
            return;
        }

        try {
            const res = await fetch("/api/crawler/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls,
                    type: importType,
                    sourceId: selectedSourceId || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setImportUrls("");
                fetchJobs();
                setActiveTab("queue");
            } else {
                toast.error(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Không thể thêm URL");
        }
    };

    // Run a single job
    const handleRunJob = async (jobId: string) => {
        setRunningJobs(prev => new Set(prev).add(jobId));

        try {
            const res = await fetch(`/api/crawler/jobs/${jobId}/run`, {
                method: "POST",
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                if (data.status === "pending_review") {
                    // Refresh to show the updated job
                    fetchJobs();
                }
            } else {
                toast.error(data.error || "Crawl thất bại");
            }
        } catch (error) {
            console.error("Run job error:", error);
            toast.error("Không thể chạy crawl");
        } finally {
            setRunningJobs(prev => {
                const next = new Set(prev);
                next.delete(jobId);
                return next;
            });
            fetchJobs();
        }
    };

    // Run all queued jobs
    const handleRunAll = async () => {
        const queuedJobs = jobs.filter(j => j.status === "queued");
        if (queuedJobs.length === 0) {
            toast.info("Không có job nào trong hàng đợi");
            return;
        }

        toast.info(`Đang chạy ${queuedJobs.length} jobs...`);

        for (const job of queuedJobs) {
            await handleRunJob(job.id);
            // Small delay between jobs
            await new Promise(r => setTimeout(r, 500));
        }

        toast.success("Đã hoàn tất tất cả jobs");
    };

    // Open preview modal
    const openPreview = (job: CrawlJob) => {
        setPreviewJob(job);
        setPreviewData(job.extractedData || {});
        setSelectedCategoryId("");
    };

    // Approve job
    const handleApprove = async () => {
        if (!previewJob) return;

        setApproving(true);
        try {
            const res = await fetch(`/api/crawler/jobs/${previewJob.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...previewData,
                    categoryId: selectedCategoryId || null,
                    status: "draft",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setPreviewJob(null);
                fetchJobs();
            } else {
                toast.error(data.error || "Không thể duyệt");
            }
        } catch (error) {
            console.error("Approve error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setApproving(false);
        }
    };

    // Delete job
    const handleDeleteJob = async (jobId: string) => {
        if (!confirm("Bạn có chắc muốn xóa job này?")) return;

        try {
            const res = await fetch(`/api/crawler/jobs/${jobId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Đã xóa job");
                fetchJobs();
            } else {
                toast.error("Không thể xóa");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Content Crawler</h1>
                    <p className="text-muted-foreground">Import nội dung từ các nguồn bên ngoài</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { fetchSources(); fetchJobs(); }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Link href="/admin/crawler/sources/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm nguồn
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Nguồn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sources.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xử lý</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {jobs.filter(j => j.status === "queued").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Chờ duyệt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {jobs.filter(j => j.status === "pending_review").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Thành công</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {jobs.filter(j => j.status === "success").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="import">Import mới</TabsTrigger>
                    <TabsTrigger value="manual">Manual Crawl</TabsTrigger>
                    <TabsTrigger value="queue">Hàng đợi ({jobs.filter(j => ["queued", "processing"].includes(j.status)).length})</TabsTrigger>
                    <TabsTrigger value="review">Chờ duyệt ({jobs.filter(j => j.status === "pending_review").length})</TabsTrigger>
                    <TabsTrigger value="completed">Đã hoàn thành</TabsTrigger>
                    <TabsTrigger value="sources">Nguồn ({sources.length})</TabsTrigger>
                </TabsList>

                {/* Import Tab */}
                <TabsContent value="import" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import URLs</CardTitle>
                            <CardDescription>Nhập mỗi URL trên một dòng (tối đa 50 URLs)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Loại nội dung</Label>
                                    <Select value={importType} onValueChange={(v) => setImportType(v as "article" | "product")}>
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
                                <div>
                                    <Label>Nguồn (tùy chọn)</Label>
                                    <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tự động phát hiện" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tự động phát hiện</SelectItem>
                                            {sources.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>URLs</Label>
                                <Textarea
                                    placeholder="https://example.com/article-1&#10;https://example.com/article-2"
                                    value={importUrls}
                                    onChange={(e) => setImportUrls(e.target.value)}
                                    rows={8}
                                />
                            </div>

                            <Button onClick={handleImport} disabled={!importUrls.trim()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm vào hàng đợi
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manual Crawl Tab */}
                <TabsContent value="manual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manual Crawl</CardTitle>
                            <CardDescription>
                                Crawl trực tiếp danh sách URL vào danh mục được chọn (không cần duyệt)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Nguồn <span className="text-red-500">*</span></Label>
                                    <Select value={manualSourceId} onValueChange={setManualSourceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn nguồn" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sources.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name} ({s.crawlType === "article" ? "Bài viết" : "Sản phẩm"})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Danh mục <span className="text-red-500">*</span></Label>
                                    <Select value={manualCategoryId} onValueChange={setManualCategoryId}>
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
                                <div>
                                    <Label>Trạng thái</Label>
                                    <Select value={manualStatus} onValueChange={setManualStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Bản nháp</SelectItem>
                                            <SelectItem value="published">Xuất bản</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Danh sách URLs (mỗi dòng 1 URL)</Label>
                                <Textarea
                                    placeholder="https://example.com/bai-viet-1&#10;https://example.com/bai-viet-2&#10;https://example.com/bai-viet-3"
                                    value={manualUrls}
                                    onChange={(e) => setManualUrls(e.target.value)}
                                    rows={10}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {manualUrls.split("\n").filter(u => u.trim()).length} URLs
                                </p>
                            </div>

                            <Button
                                onClick={handleManualCrawl}
                                disabled={manualCrawling || !manualUrls.trim() || !manualSourceId || !manualCategoryId}
                            >
                                {manualCrawling ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang crawl...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Crawl & Import
                                    </>
                                )}
                            </Button>

                            {/* Results */}
                            {manualResults.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium mb-2">Kết quả</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>URL</TableHead>
                                                <TableHead>Tiêu đề</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Chi tiết</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {manualResults.map((result, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            {result.url}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        {result.title || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            result.status === "success" ? "bg-green-100 text-green-800" :
                                                                result.status === "duplicate" ? "bg-gray-100 text-gray-800" :
                                                                    result.status === "slug_conflict" ? "bg-orange-100 text-orange-800" :
                                                                        "bg-red-100 text-red-800"
                                                        }>
                                                            {result.status === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                            {result.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                                                            {result.status === "success" ? "Thành công" :
                                                                result.status === "duplicate" ? "Trùng lặp" :
                                                                    result.status === "slug_conflict" ? "Trùng slug" :
                                                                        "Thất bại"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                        {result.error || result.slug || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Queue Tab */}
                <TabsContent value="queue" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">Hàng đợi xử lý</h3>
                        <Button onClick={handleRunAll} disabled={jobs.filter(j => j.status === "queued").length === 0}>
                            <Play className="w-4 h-4 mr-2" />
                            Chạy tất cả
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.filter(j => ["queued", "processing"].includes(j.status)).map(job => (
                                <TableRow key={job.id}>
                                    <TableCell className="max-w-[300px] truncate">
                                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600">
                                            <LinkIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                            {job.url}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {job.type === "article" ? "Bài viết" : "Sản phẩm"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[job.status]}>
                                            {job.status === "processing" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                            {statusLabels[job.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(job.createdAt).toLocaleString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            {job.status === "queued" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRunJob(job.id)}
                                                    disabled={runningJobs.has(job.id)}
                                                >
                                                    {runningJobs.has(job.id) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteJob(job.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {jobs.filter(j => ["queued", "processing"].includes(j.status)).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Không có job nào trong hàng đợi
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="space-y-4">
                    <h3 className="font-medium">Chờ duyệt</h3>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.filter(j => j.status === "pending_review").map(job => {
                                const data = job.extractedData as Record<string, string> || {};
                                const title = data.title || data.name || "Không có tiêu đề";

                                return (
                                    <TableRow key={job.id}>
                                        <TableCell className="max-w-[200px] truncate">
                                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 inline mr-1" />
                                                {new URL(job.url).hostname}
                                            </a>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate font-medium">
                                            {title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {job.type === "article" ? "Bài viết" : "Sản phẩm"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {job.processedAt && new Date(job.processedAt).toLocaleString("vi-VN")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" onClick={() => openPreview(job)}>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Xem & Duyệt
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteJob(job.id)}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {jobs.filter(j => j.status === "pending_review").length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Không có nội dung chờ duyệt
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                {/* Completed Tab */}
                <TabsContent value="completed" className="space-y-4">
                    <h3 className="font-medium">Đã hoàn thành</h3>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Lỗi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.filter(j => ["success", "failed", "duplicate"].includes(j.status)).map(job => (
                                <TableRow key={job.id}>
                                    <TableCell className="max-w-[300px] truncate">
                                        {job.url}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {job.type === "article" ? "Bài viết" : "Sản phẩm"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[job.status]}>
                                            {job.status === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {job.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                                            {statusLabels[job.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {job.processedAt && new Date(job.processedAt).toLocaleString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="text-red-600 max-w-[200px] truncate">
                                        {job.errorMessage}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>

                {/* Sources Tab */}
                <TabsContent value="sources" className="space-y-4">
                    <h3 className="font-medium">Nguồn đã cấu hình</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sources.map(source => (
                            <Card key={source.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{source.name}</CardTitle>
                                            <CardDescription>{source.baseUrl}</CardDescription>
                                        </div>
                                        <Badge variant={source.isActive ? "default" : "secondary"}>
                                            {source.isActive ? "Hoạt động" : "Tạm dừng"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Loại: {source.crawlType === "article" ? "Bài viết" : "Sản phẩm"}</p>
                                        {source.stats && (
                                            <p>Jobs: {source.stats.successful} thành công / {source.stats.totalJobs} tổng</p>
                                        )}
                                        {source.lastCrawl && (
                                            <p className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(source.lastCrawl).toLocaleString("vi-VN")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <Link href={`/admin/crawler/sources/${source.id}`}>
                                            <Button size="sm" variant="outline">
                                                <Settings className="w-4 h-4 mr-1" />
                                                Cấu hình
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {sources.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="text-center py-8 text-muted-foreground">
                                    Chưa có nguồn nào. Bấm "Thêm nguồn" để tạo mới.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Preview & Approve Modal */}
            <Dialog open={!!previewJob} onOpenChange={(open) => !open && setPreviewJob(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Xem trước & Duyệt
                            <Badge variant="outline" className="ml-2">
                                {previewJob?.type === "article" ? "Bài viết" : "Sản phẩm"}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {previewJob && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Nguồn: <a href={previewJob.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {previewJob.url}
                                </a>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <Label>Tiêu đề</Label>
                                    <Input
                                        value={(previewData.title as string) || (previewData.name as string) || ""}
                                        onChange={(e) => setPreviewData({
                                            ...previewData,
                                            [previewJob.type === "article" ? "title" : "name"]: e.target.value
                                        })}
                                    />
                                </div>

                                {previewJob.type === "article" && (
                                    <div>
                                        <Label>Tóm tắt</Label>
                                        <Textarea
                                            value={(previewData.excerpt as string) || ""}
                                            onChange={(e) => setPreviewData({ ...previewData, excerpt: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label>Danh mục</Label>
                                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
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

                                {previewJob.type === "product" && typeof previewData.price === "number" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Giá</Label>
                                            <Input
                                                type="number"
                                                value={(previewData.price as number) || 0}
                                                onChange={(e) => setPreviewData({ ...previewData, price: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Giá gốc</Label>
                                            <Input
                                                type="number"
                                                value={(previewData.originalPrice as number) || 0}
                                                onChange={(e) => setPreviewData({ ...previewData, originalPrice: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Nội dung</Label>
                                    <div
                                        className="border rounded-md p-4 prose prose-sm max-w-none max-h-[300px] overflow-y-auto bg-muted/30"
                                        dangerouslySetInnerHTML={{ __html: (previewData.content as string) || (previewData.description as string) || "" }}
                                    />
                                </div>

                                {(previewData.images as string[])?.length > 0 && (
                                    <div>
                                        <Label>Hình ảnh ({(previewData.images as string[]).length})</Label>
                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                            {(previewData.images as string[]).slice(0, 8).map((img, i) => (
                                                <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewJob(null)}>
                            Hủy
                        </Button>
                        <Button onClick={handleApprove} disabled={approving}>
                            {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Duyệt & Tạo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    );
}
