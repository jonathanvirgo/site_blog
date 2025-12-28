"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Play,
    Trash,
    Eye,
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    RefreshCw,
    FileText,
    Package,
} from "lucide-react";
import { toast } from "sonner";

// ==================== TYPES ====================

interface CrawlJob {
    id: string;
    url: string;
    type: "article" | "product";
    status: "queued" | "processing" | "success" | "failed" | "duplicate" | "pending_review";
    extractedData?: Record<string, unknown>;
    errorMessage?: string;
    createdAt: string;
    processedAt?: string;
    source?: {
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
}

interface HistoryTabProps {
    jobs: CrawlJob[];
    categories: Category[];
    onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
    queued: "Chờ xử lý",
    processing: "Đang xử lý",
    success: "Thành công",
    failed: "Thất bại",
    duplicate: "Trùng lặp",
    pending_review: "Chờ duyệt",
};

const statusColors: Record<string, string> = {
    queued: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    duplicate: "bg-gray-100 text-gray-800",
    pending_review: "bg-purple-100 text-purple-800",
};

// ==================== COMPONENT ====================

export function HistoryTab({ jobs, categories, onRefresh }: HistoryTabProps) {
    const [activeTab, setActiveTab] = useState("pending");
    const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
    
    // Preview modal
    const [previewJob, setPreviewJob] = useState<CrawlJob | null>(null);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [approving, setApproving] = useState(false);

    // Filter jobs by status
    const pendingJobs = jobs.filter(j => ["queued", "processing"].includes(j.status));
    const reviewJobs = jobs.filter(j => j.status === "pending_review");
    const completedJobs = jobs.filter(j => ["success", "failed", "duplicate"].includes(j.status));

    // Run single job
    const handleRunJob = async (jobId: string) => {
        setRunningJobs(prev => new Set(prev).add(jobId));
        try {
            const res = await fetch(`/api/crawler/jobs/${jobId}/run`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Đã chạy job");
                onRefresh();
            } else {
                toast.error(data.error || "Lỗi chạy job");
            }
        } catch {
            toast.error("Lỗi kết nối");
        } finally {
            setRunningJobs(prev => {
                const next = new Set(prev);
                next.delete(jobId);
                return next;
            });
        }
    };

    // Run all queued jobs
    const handleRunAll = async () => {
        const queuedJobs = jobs.filter(j => j.status === "queued");
        for (const job of queuedJobs) {
            await handleRunJob(job.id);
        }
    };

    // Delete job
    const handleDeleteJob = async (jobId: string) => {
        try {
            const res = await fetch(`/api/crawler/jobs/${jobId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Đã xóa job");
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || "Lỗi xóa job");
            }
        } catch {
            toast.error("Lỗi kết nối");
        }
    };

    // Open preview modal
    const handlePreview = (job: CrawlJob) => {
        setPreviewJob(job);
        setPreviewData((job.extractedData || {}) as Record<string, unknown>);
        setSelectedCategoryId("");
    };

    // Approve job
    const handleApprove = async () => {
        if (!previewJob || !selectedCategoryId) {
            toast.error("Vui lòng chọn danh mục");
            return;
        }
        setApproving(true);
        try {
            const res = await fetch(`/api/crawler/jobs/${previewJob.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId: selectedCategoryId,
                    data: previewData,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Đã duyệt và tạo nội dung");
                setPreviewJob(null);
                onRefresh();
            } else {
                toast.error(data.error || "Lỗi duyệt");
            }
        } catch {
            toast.error("Lỗi kết nối");
        } finally {
            setApproving(false);
        }
    };

    // Reject job
    const handleReject = async () => {
        if (!previewJob) return;
        try {
            const res = await fetch(`/api/crawler/jobs/${previewJob.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Đã từ chối");
                setPreviewJob(null);
                onRefresh();
            }
        } catch {
            toast.error("Lỗi kết nối");
        }
    };

    // Render job row
    const renderJobRow = (job: CrawlJob, showActions: boolean = true) => {
        const data = (job.extractedData || {}) as Record<string, string>;
        const title = data.title || data.name || "Không có tiêu đề";

        return (
            <TableRow key={job.id}>
                <TableCell className="max-w-[200px]">
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block"
                    >
                        {new URL(job.url).hostname}
                    </a>
                </TableCell>
                <TableCell className="max-w-[250px] truncate font-medium">
                    {title}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="gap-1">
                        {job.type === "article" ? <FileText className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                        {job.type === "article" ? "Bài viết" : "Sản phẩm"}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge className={statusColors[job.status]}>
                        {job.status === "processing" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {statusLabels[job.status]}
                    </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                    {new Date(job.createdAt).toLocaleString("vi-VN")}
                </TableCell>
                {showActions && (
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
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
                            {job.status === "pending_review" && (
                                <Button size="sm" variant="outline" onClick={() => handlePreview(job)}>
                                    <Eye className="w-4 h-4" />
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteJob(job.id)}>
                                <Trash className="w-4 h-4" />
                            </Button>
                        </div>
                    </TableCell>
                )}
            </TableRow>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Lịch sử Crawl</h2>
                    <p className="text-muted-foreground">
                        Quản lý hàng đợi và lịch sử import
                    </p>
                </div>
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm mới
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Chờ xử lý</p>
                                <p className="text-2xl font-bold text-yellow-600">{pendingJobs.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                                <p className="text-2xl font-bold text-purple-600">{reviewJobs.length}</p>
                            </div>
                            <Eye className="w-8 h-8 text-purple-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Thành công</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {completedJobs.filter(j => j.status === "success").length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Thất bại</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {completedJobs.filter(j => j.status === "failed").length}
                                </p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="w-4 h-4" />
                        Hàng đợi ({pendingJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="review" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Chờ duyệt ({reviewJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Đã xử lý ({completedJobs.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pending Tab */}
                <TabsContent value="pending">
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Hàng đợi xử lý</CardTitle>
                            {pendingJobs.filter(j => j.status === "queued").length > 0 && (
                                <Button size="sm" onClick={handleRunAll}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Chạy tất cả
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {pendingJobs.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Không có job nào trong hàng đợi
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>URL</TableHead>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Loại</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thời gian</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingJobs.map(job => renderJobRow(job))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Chờ duyệt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviewJobs.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Không có nội dung nào chờ duyệt
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>URL</TableHead>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Loại</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thời gian</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviewJobs.map(job => renderJobRow(job))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Completed Tab */}
                <TabsContent value="completed">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Đã xử lý</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {completedJobs.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Chưa có job nào hoàn thành
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>URL</TableHead>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Loại</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thời gian</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedJobs.slice(0, 50).map(job => renderJobRow(job, false))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Preview Modal */}
            <Dialog open={!!previewJob} onOpenChange={() => setPreviewJob(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Xem trước nội dung</DialogTitle>
                    </DialogHeader>
                    {previewJob && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">URL gốc</Label>
                                <a
                                    href={previewJob.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {previewJob.url}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground">Tiêu đề</Label>
                                <p className="font-semibold text-lg">
                                    {(previewData.title as string) || (previewData.name as string) || "Không có tiêu đề"}
                                </p>
                            </div>
                            {previewData.featuredImage && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Ảnh đại diện</Label>
                                    <img
                                        src={previewData.featuredImage as string}
                                        alt="Featured"
                                        className="w-full max-h-48 object-cover rounded mt-1"
                                    />
                                </div>
                            )}
                            {previewData.excerpt && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Tóm tắt</Label>
                                    <p className="text-sm">{previewData.excerpt as string}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-sm text-muted-foreground">Nội dung</Label>
                                <div
                                    className="border rounded p-3 prose prose-sm max-w-none max-h-[300px] overflow-y-auto mt-1 bg-muted/30"
                                    dangerouslySetInnerHTML={{ __html: (previewData.content as string) || "" }}
                                />
                            </div>
                            <div>
                                <Label>Danh mục *</Label>
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
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={handleReject}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                        </Button>
                        <Button onClick={handleApprove} disabled={approving || !selectedCategoryId}>
                            {approving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Duyệt & Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

