"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    articleCount?: number;
    productCount?: number;
    children?: Category[];
}

function CategoryRow({
    category,
    level = 0,
    type,
    onEdit,
    onDelete,
    expandedIds,
    toggleExpand,
}: {
    category: Category;
    level?: number;
    type: "article" | "product";
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const count = type === "article" ? category.articleCount : category.productCount;

    return (
        <>
            <TableRow>
                <TableCell>
                    <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${level * 24}px` }}
                    >
                        {hasChildren ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleExpand(category.id)}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        ) : (
                            <span className="w-6" />
                        )}
                        {hasChildren ? (
                            <FolderOpen className="h-4 w-4 text-primary" />
                        ) : (
                            <Folder className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{category.name}</span>
                    </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                <TableCell>{count || 0}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(category)}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {hasChildren && isExpanded &&
                category.children!.map((child) => (
                    <CategoryRow
                        key={child.id}
                        category={child}
                        level={level + 1}
                        type={type}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        expandedIds={expandedIds}
                        toggleExpand={toggleExpand}
                    />
                ))}
        </>
    );
}

export default function CategoriesPage() {
    const [articleCategories, setArticleCategories] = useState<Category[]>([]);
    const [productCategories, setProductCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<"article" | "product">("article");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parentId: "",
    });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/categories?type=all");
            if (res.ok) {
                const data = await res.json();
                setArticleCategories(data.data?.articleCategories || []);
                setProductCategories(data.data?.productCategories || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
            slug: editingCategory ? formData.slug : generateSlug(name),
        });
    };

    const openCreateDialog = () => {
        setEditingCategory(null);
        setFormData({ name: "", slug: "", description: "", parentId: "" });
        setDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            parentId: "",
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
            if (editingCategory) {
                // Update
                const res = await fetch(`/api/categories/${editingCategory.id}?type=${activeTab}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: activeTab,
                        name: formData.name,
                        slug: formData.slug,
                        description: formData.description || null,
                        parentId: formData.parentId || null,
                    }),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Cập nhật thất bại");
                    return;
                }
                toast.success("Đã cập nhật danh mục!");
            } else {
                // Create
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: activeTab,
                        name: formData.name,
                        slug: formData.slug,
                        description: formData.description || null,
                        parentId: formData.parentId || null,
                    }),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Tạo danh mục thất bại");
                    return;
                }
                toast.success("Đã tạo danh mục mới!");
            }

            setDialogOpen(false);
            fetchCategories();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteCategory) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/categories/${deleteCategory.id}?type=${activeTab}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const error = await res.json();
                toast.error(error.message || "Xóa thất bại");
                return;
            }

            toast.success("Đã xóa danh mục!");
            setDeleteCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
        }
    };

    // Get flat list for parent selector
    const getFlatCategories = (categories: Category[]): Category[] => {
        const flat: Category[] = [];
        const flatten = (cats: Category[]) => {
            cats.forEach((cat) => {
                if (cat.id !== editingCategory?.id) {
                    flat.push(cat);
                    if (cat.children) flatten(cat.children);
                }
            });
        };
        flatten(categories);
        return flat;
    };

    const currentCategories = activeTab === "article" ? articleCategories : productCategories;
    const flatParents = getFlatCategories(currentCategories);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Danh mục</h1>
                    <p className="text-muted-foreground">Quản lý danh mục bài viết và sản phẩm</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm danh mục
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "article" | "product")}>
                <TabsList>
                    <TabsTrigger value="article">Bài viết</TabsTrigger>
                    <TabsTrigger value="product">Sản phẩm</TabsTrigger>
                </TabsList>

                <TabsContent value="article" className="mt-4">
                    <div className="border rounded-lg">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : articleCategories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Chưa có danh mục nào
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Tên danh mục</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Số bài viết</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articleCategories.map((category) => (
                                        <CategoryRow
                                            key={category.id}
                                            category={category}
                                            type="article"
                                            onEdit={openEditDialog}
                                            onDelete={setDeleteCategory}
                                            expandedIds={expandedIds}
                                            toggleExpand={toggleExpand}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="product" className="mt-4">
                    <div className="border rounded-lg">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : productCategories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Chưa có danh mục nào
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Tên danh mục</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Số sản phẩm</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productCategories.map((category) => (
                                        <CategoryRow
                                            key={category.id}
                                            category={category}
                                            type="product"
                                            onEdit={openEditDialog}
                                            onDelete={setDeleteCategory}
                                            expandedIds={expandedIds}
                                            toggleExpand={toggleExpand}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === "article" ? "Danh mục bài viết" : "Danh mục sản phẩm"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên danh mục *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Nhập tên danh mục"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug *</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="danh-muc-slug"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả danh mục (tùy chọn)"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Danh mục cha</Label>
                            <Select
                                value={formData.parentId || "none"}
                                onValueChange={(v) => setFormData({ ...formData, parentId: v === "none" ? "" : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Không có (Danh mục gốc)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                                    {flatParents.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
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
            <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa danh mục &quot;{deleteCategory?.name}&quot;?
                            Danh mục chỉ có thể xóa nếu không có bài viết/sản phẩm và danh mục con.
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
