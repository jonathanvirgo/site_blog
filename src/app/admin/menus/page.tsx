"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash,
    Menu as MenuIcon,
    ChevronRight,
    ChevronDown,
    ExternalLink,
    Loader2,
    GripVertical,
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
import { Switch } from "@/components/ui/switch";

// Base predefined URLs for the menu selector
const BASE_URLS = [
    { label: "Trang chủ", url: "/" },
    { label: "Sản phẩm", url: "/san-pham" },
    { label: "Giỏ hàng", url: "/gio-hang" },
    { label: "Thanh toán", url: "/thanh-toan" },
    { label: "Tìm kiếm", url: "/tim-kiem" },
    { label: "Tài khoản", url: "/tai-khoan" },
];

interface CategoryOption {
    label: string;
    url: string;
    group: string;
}

interface MenuItem {
    id: string;
    title: string;
    url: string;
    sortOrder: number;
    isActive: boolean;
    parentId: string | null;
    children?: MenuItem[];
}

function MenuRow({
    menu,
    level = 0,
    onEdit,
    onDelete,
    onToggle,
    expandedIds,
    toggleExpand,
}: {
    menu: MenuItem;
    level?: number;
    onEdit: (menu: MenuItem) => void;
    onDelete: (menu: MenuItem) => void;
    onToggle: (menu: MenuItem) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedIds.has(menu.id);

    return (
        <>
            <TableRow className={!menu.isActive ? "opacity-50" : ""}>
                <TableCell>
                    <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${level * 24}px` }}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        {hasChildren ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleExpand(menu.id)}
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
                        <MenuIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{menu.title}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="truncate max-w-[200px]">{menu.url}</span>
                        <a
                            href={menu.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </TableCell>
                <TableCell>{menu.sortOrder}</TableCell>
                <TableCell>
                    <Switch
                        checked={menu.isActive}
                        onCheckedChange={() => onToggle(menu)}
                    />
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(menu)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(menu)}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {hasChildren &&
                isExpanded &&
                menu.children!.map((child) => (
                    <MenuRow
                        key={child.id}
                        menu={child}
                        level={level + 1}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggle={onToggle}
                        expandedIds={expandedIds}
                        toggleExpand={toggleExpand}
                    />
                ))}
        </>
    );
}

export default function MenusPage() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [categoryUrls, setCategoryUrls] = useState<CategoryOption[]>([]);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        sortOrder: 0,
        isActive: true,
        parentId: "",
    });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteMenu, setDeleteMenu] = useState<MenuItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Combined URL options
    const allUrlOptions = [
        ...BASE_URLS,
        ...categoryUrls,
    ];

    // Check if URL is predefined
    const isPredefinedUrl = (url: string) => allUrlOptions.some(u => u.url === url);

    // Fetch menus and categories
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch menus
            const menusRes = await fetch("/api/menus");
            if (menusRes.ok) {
                const data = await menusRes.json();
                setMenus(data.menus || []);
            }

            // Fetch categories
            const catRes = await fetch("/api/categories");
            if (catRes.ok) {
                const catData = await catRes.json();
                const articleCats = catData.data?.articleCategories || catData.articleCategories || [];
                const productCats = catData.data?.productCategories || catData.productCategories || [];

                const catOptions: CategoryOption[] = [];

                // Add article categories
                articleCats.forEach((cat: { name: string; slug: string }) => {
                    catOptions.push({
                        label: `📰 ${cat.name}`,
                        url: `/chuyen-muc/${cat.slug}`,
                        group: "Chuyên mục bài viết"
                    });
                });

                // Add product categories
                productCats.forEach((cat: { name: string; slug: string }) => {
                    catOptions.push({
                        label: `🛒 ${cat.name}`,
                        url: `/san-pham?category=${cat.slug}`,
                        group: "Danh mục sản phẩm"
                    });
                });

                setCategoryUrls(catOptions);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

    const openCreateDialog = () => {
        setEditingMenu(null);
        setFormData({
            title: "",
            url: "",
            sortOrder: 0,
            isActive: true,
            parentId: "",
        });
        setDialogOpen(true);
    };

    const openEditDialog = (menu: MenuItem) => {
        setEditingMenu(menu);
        setFormData({
            title: menu.title,
            url: menu.url,
            sortOrder: menu.sortOrder,
            isActive: menu.isActive,
            parentId: menu.parentId || "",
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.url) {
            toast.error("Tiêu đề và URL là bắt buộc");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: formData.title,
                url: formData.url,
                sortOrder: formData.sortOrder,
                isActive: formData.isActive,
                parentId: formData.parentId || null,
            };

            if (editingMenu) {
                // Update
                const res = await fetch(`/api/menus/${editingMenu.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.error || "Cập nhật thất bại");
                    return;
                }
                toast.success("Đã cập nhật menu!");
            } else {
                // Create
                const res = await fetch("/api/menus", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                console.log("POST /api/menus response:", res.status, res.ok);
                if (!res.ok) {
                    const error = await res.json();
                    console.log("POST error:", error);
                    toast.error(error.error || "Tạo menu thất bại");
                    return;
                }
                const result = await res.json();
                console.log("POST success:", result);
                toast.success("Đã tạo menu mới!");
            }

            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (menu: MenuItem) => {
        try {
            const res = await fetch(`/api/menus/${menu.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !menu.isActive }),
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Toggle error:", error);
        }
    };

    const handleDelete = async () => {
        if (!deleteMenu) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/menus/${deleteMenu.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Đã xóa menu!");
                setDeleteMenu(null);
                fetchData();
            } else {
                const error = await res.json();
                toast.error(error.error || "Xóa thất bại");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
        }
    };

    // Get flat list for parent selector (exclude current menu and its children)
    const getFlatMenus = (): MenuItem[] => {
        const flat: MenuItem[] = [];
        const flatten = (items: MenuItem[]) => {
            items.forEach((item) => {
                if (item.id !== editingMenu?.id) {
                    flat.push(item);
                    if (item.children) flatten(item.children);
                }
            });
        };
        flatten(menus);
        return flat;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Menu</h1>
                    <p className="text-muted-foreground">
                        Quản lý menu điều hướng trên header
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm menu
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : menus.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Chưa có menu nào. Bấm &quot;Thêm menu&quot; để tạo mới.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[35%]">Tiêu đề</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Thứ tự</TableHead>
                                <TableHead>Hiển thị</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {menus.map((menu) => (
                                <MenuRow
                                    key={menu.id}
                                    menu={menu}
                                    onEdit={openEditDialog}
                                    onDelete={setDeleteMenu}
                                    onToggle={handleToggle}
                                    expandedIds={expandedIds}
                                    toggleExpand={toggleExpand}
                                />
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
                            {editingMenu ? "Sửa menu" : "Thêm menu"}
                        </DialogTitle>
                        <DialogDescription>
                            Menu sẽ hiển thị trên thanh điều hướng header
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Tiêu đề *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="Trang chủ"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL *</Label>
                            <Select
                                value={formData.url && isPredefinedUrl(formData.url) ? formData.url : "custom"}
                                onValueChange={(v) => {
                                    if (v === "custom") {
                                        setFormData({ ...formData, url: "" });
                                    } else {
                                        setFormData({ ...formData, url: v });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Base URLs */}
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Trang cơ bản
                                    </div>
                                    {BASE_URLS.map((item) => (
                                        <SelectItem key={item.url} value={item.url}>
                                            {item.label}
                                        </SelectItem>
                                    ))}

                                    {/* Article Categories */}
                                    {categoryUrls.filter(c => c.group === "Chuyên mục bài viết").length > 0 && (
                                        <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                                                Chuyên mục bài viết
                                            </div>
                                            {categoryUrls.filter(c => c.group === "Chuyên mục bài viết").map((item) => (
                                                <SelectItem key={item.url} value={item.url}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}

                                    {/* Product Categories */}
                                    {categoryUrls.filter(c => c.group === "Danh mục sản phẩm").length > 0 && (
                                        <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                                                Danh mục sản phẩm
                                            </div>
                                            {categoryUrls.filter(c => c.group === "Danh mục sản phẩm").map((item) => (
                                                <SelectItem key={item.url} value={item.url}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}

                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                                        Khác
                                    </div>
                                    <SelectItem value="custom">📝 URL tùy chỉnh...</SelectItem>
                                </SelectContent>
                            </Select>
                            {(!isPredefinedUrl(formData.url) || formData.url === "") && (
                                <Input
                                    id="customUrl"
                                    value={formData.url}
                                    onChange={(e) =>
                                        setFormData({ ...formData, url: e.target.value })
                                    }
                                    placeholder="Nhập URL tùy chỉnh, vd: /lien-he"
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sortOrder: parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Menu cha</Label>
                                <Select
                                    value={formData.parentId || "none"}
                                    onValueChange={(v) =>
                                        setFormData({ ...formData, parentId: v === "none" ? "" : v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Không có (Menu gốc)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không có (Menu gốc)</SelectItem>
                                        {getFlatMenus().map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(v) =>
                                    setFormData({ ...formData, isActive: v })
                                }
                            />
                            <Label>Hiển thị trên website</Label>
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
            <AlertDialog open={!!deleteMenu} onOpenChange={() => setDeleteMenu(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa menu &quot;{deleteMenu?.title}&quot;?
                            {deleteMenu?.children && deleteMenu.children.length > 0 && (
                                <span className="block mt-2 text-yellow-600">
                                    Lưu ý: Menu con cũng sẽ bị xóa theo.
                                </span>
                            )}
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
