"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash,
    Tag,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

interface TagItem {
    id: string;
    name: string;
    slug: string;
    type: string;
    articleCount: number;
    productCount: number;
    totalUsage: number;
}

const typeLabels: Record<string, string> = {
    article: "Bài viết",
    product: "Sản phẩm",
    both: "Cả hai",
};

const typeColors: Record<string, string> = {
    article: "bg-blue-100 text-blue-800",
    product: "bg-green-100 text-green-800",
    both: "bg-purple-100 text-purple-800",
};

export default function TagsPage() {
    const [tags, setTags] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<TagItem | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        type: "both",
    });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteTag, setDeleteTag] = useState<TagItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch tags
    const fetchTags = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (typeFilter !== "all") params.set("type", typeFilter);

            const res = await fetch(`/api/tags?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTags(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch tags:", error);
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTags();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTags]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: editingTag ? formData.slug : generateSlug(name),
        });
    };

    const openCreateDialog = () => {
        setEditingTag(null);
        setFormData({ name: "", slug: "", type: "both" });
        setDialogOpen(true);
    };

    const openEditDialog = (tag: TagItem) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            slug: tag.slug,
            type: tag.type,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Vui lòng nhập tên và slug");
            return;
        }

        setSaving(true);
        try {
            if (editingTag) {
                // Update
                const res = await fetch(`/api/tags/${editingTag.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Cập nhật thất bại");
                    return;
                }
                toast.success("Đã cập nhật tag!");
            } else {
                // Create
                const res = await fetch("/api/tags", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Tạo tag thất bại");
                    return;
                }
                toast.success("Đã tạo tag mới!");
            }

            setDialogOpen(false);
            fetchTags();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTag) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/tags/${deleteTag.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Đã xóa tag!");
                setDeleteTag(null);
                fetchTags();
            } else {
                const error = await res.json();
                toast.error(error.message || "Xóa thất bại");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tag</h1>
                    <p className="text-muted-foreground">Quản lý tag bài viết và sản phẩm</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm tag
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tag..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="article">Bài viết</SelectItem>
                        <SelectItem value="product">Sản phẩm</SelectItem>
                        <SelectItem value="both">Cả hai</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : tags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Chưa có tag nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Tên tag</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Bài viết</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.map((tag) => (
                                <TableRow key={tag.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{tag.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {tag.slug}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={typeColors[tag.type]}>
                                            {typeLabels[tag.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{tag.articleCount}</TableCell>
                                    <TableCell>{tag.productCount}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeleteTag(tag)}
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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTag ? "Sửa tag" : "Thêm tag"}
                        </DialogTitle>
                        <DialogDescription>
                            Tag dùng để phân loại và nhóm nội dung liên quan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên tag *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Nhập tên tag"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug *</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="tag-slug"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Loại tag</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="article">Bài viết</SelectItem>
                                    <SelectItem value="product">Sản phẩm</SelectItem>
                                    <SelectItem value="both">Cả hai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tag &quot;{deleteTag?.name}&quot;?
                            Tag sẽ bị gỡ khỏi tất cả bài viết và sản phẩm.
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
