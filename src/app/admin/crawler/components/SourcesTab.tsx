"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Settings,
    FileText,
    Package,
    ExternalLink,
    Globe,
} from "lucide-react";
import { toast } from "sonner";

// ==================== TYPES ====================

interface CrawlSource {
    id: string;
    name: string;
    baseUrl: string;
    crawlType: "article" | "product";
    isActive: boolean;
    _count?: {
        jobs: number;
    };
    createdAt: string;
}

interface SourcesTabProps {
    sources: CrawlSource[];
    onRefresh: () => void;
}

// ==================== COMPONENT ====================

export function SourcesTab({ sources, onRefresh }: SourcesTabProps) {
    // Toggle source active
    const toggleSource = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/crawler/sources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            if (res.ok) {
                toast.success(isActive ? "Đã bật nguồn" : "Đã tắt nguồn");
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || "Lỗi cập nhật");
            }
        } catch {
            toast.error("Lỗi kết nối");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Nguồn Crawler</h2>
                    <p className="text-muted-foreground">
                        Quản lý cấu hình các nguồn để crawl tự động
                    </p>
                </div>
                <Link href="/admin/crawler/sources/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm nguồn mới
                    </Button>
                </Link>
            </div>

            {/* Sources List */}
            {sources.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Chưa có nguồn nào</h3>
                        <p className="text-muted-foreground mb-4">
                            Tạo nguồn mới để bắt đầu crawl nội dung tự động
                        </p>
                        <Link href="/admin/crawler/sources/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm nguồn đầu tiên
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Danh sách nguồn ({sources.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Tên nguồn</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>Số jobs</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sources.map(source => (
                                    <TableRow key={source.id}>
                                        <TableCell>
                                            <Switch
                                                checked={source.isActive}
                                                onCheckedChange={(checked) => toggleSource(source.id, checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {source.name}
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={source.baseUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                {new URL(source.baseUrl).hostname}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1">
                                                {source.crawlType === "article" ? (
                                                    <><FileText className="w-3 h-3" /> Bài viết</>
                                                ) : (
                                                    <><Package className="w-3 h-3" /> Sản phẩm</>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {source._count?.jobs || 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/crawler/sources/${source.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <Settings className="w-4 h-4 mr-1" />
                                                    Cấu hình
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

