"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Article {
    id: string;
    title: string;
    slug: string;
    status: string;
    viewCount: number;
    createdAt: string;
    author: { fullName: string } | null;
    category: { name: string } | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
    draft: "Nháp",
    published: "Đã xuất bản",
    archived: "Lưu trữ",
};

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch categories
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories?type=article");
                if (res.ok) {
                    const data = await res.json();
                    // Flatten hierarchical categories
                    const flatCategories: Category[] = [];
                    const flatten = (cats: any[]) => {
                        cats.forEach(cat => {
                            flatCategories.push({ id: cat.id, name: cat.name, slug: cat.slug });
                            if (cat.children?.length) flatten(cat.children);
                        });
                    };
                    flatten(data.data?.articleCategories || []);
                    setCategories(flatCategories);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        }
        fetchCategories();
    }, []);

    // Fetch articles
    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (categoryFilter !== "all") params.set("categoryId", categoryFilter);

            const res = await fetch(`/api/articles?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles || []);
            }
        } catch (error) {
            console.error("Failed to fetch articles:", error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, categoryFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchArticles();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchArticles]);

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/articles/${deleteId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Đã xóa bài viết!");
                setArticles(articles.filter(a => a.id !== deleteId));
            } else {
                toast.error("Không thể xóa bài viết");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bài viết</h1>
                    <p className="text-muted-foreground">Quản lý tất cả bài viết</p>
                </div>
                <Link href="/admin/articles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo bài viết
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm bài viết..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="draft">Nháp</SelectItem>
                        <SelectItem value="published">Đã xuất bản</SelectItem>
                        <SelectItem value="archived">Lưu trữ</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chuyên mục" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy bài viết nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Tiêu đề</TableHead>
                                <TableHead>Chuyên mục</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Lượt xem</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {articles.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium line-clamp-1">{article.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {article.author?.fullName || "Unknown"}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{article.category?.name || "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={statusColors[article.status]}
                                        >
                                            {statusLabels[article.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{article.viewCount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/bai-viet/${article.slug}`} target="_blank">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Xem
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/articles/${article.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeleteId(article.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bài viết sẽ được chuyển vào thùng rác và có thể khôi phục sau.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
