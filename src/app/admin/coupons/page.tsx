"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash,
    Ticket,
    Copy,
    Check,
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
import { Switch } from "@/components/ui/switch";
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

interface Coupon {
    id: string;
    code: string;
    type: string;
    value: number;
    minOrder: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usedCount: number;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    orderCount: number;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        type: "percentage",
        value: 0,
        minOrder: "",
        maxDiscount: "",
        usageLimit: "",
        startsAt: "",
        expiresAt: "",
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch coupons
    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (activeFilter === "active") params.set("active", "true");
            if (activeFilter === "inactive") params.set("active", "false");

            const res = await fetch(`/api/coupons?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
        } finally {
            setLoading(false);
        }
    }, [search, activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCoupons();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCoupons]);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const openCreateDialog = () => {
        setEditingCoupon(null);
        setFormData({
            code: "",
            type: "percentage",
            value: 0,
            minOrder: "",
            maxDiscount: "",
            usageLimit: "",
            startsAt: "",
            expiresAt: "",
            isActive: true,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder?.toString() || "",
            maxDiscount: coupon.maxDiscount?.toString() || "",
            usageLimit: coupon.usageLimit?.toString() || "",
            startsAt: coupon.startsAt ? coupon.startsAt.split("T")[0] : "",
            expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
            isActive: coupon.isActive,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.value) {
            toast.error("Vui lòng nhập mã và giá trị");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                code: formData.code,
                type: formData.type,
                value: Number(formData.value),
                minOrder: formData.minOrder ? Number(formData.minOrder) : null,
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
                startsAt: formData.startsAt || null,
                expiresAt: formData.expiresAt || null,
                isActive: formData.isActive,
            };

            if (editingCoupon) {
                // Update
                const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Cập nhật thất bại");
                    return;
                }
                toast.success("Đã cập nhật mã giảm giá!");
            } else {
                // Create
                const res = await fetch("/api/coupons", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.message || "Tạo mã giảm giá thất bại");
                    return;
                }
                toast.success("Đã tạo mã giảm giá mới!");
            }

            setDialogOpen(false);
            fetchCoupons();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteCoupon) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/coupons/${deleteCoupon.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Đã xóa mã giảm giá!");
                setDeleteCoupon(null);
                fetchCoupons();
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

    const toggleActive = async (coupon: Coupon) => {
        try {
            const res = await fetch(`/api/coupons/${coupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !coupon.isActive }),
            });
            if (res.ok) {
                setCoupons(coupons.map(c =>
                    c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
                ));
            }
        } catch (error) {
            console.error("Toggle error:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mã giảm giá</h1>
                    <p className="text-muted-foreground">Quản lý mã giảm giá và khuyến mãi</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm mã giảm giá
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm mã..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="inactive">Đã tắt</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Chưa có mã giảm giá nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã</TableHead>
                                <TableHead>Giá trị</TableHead>
                                <TableHead>Đơn tối thiểu</TableHead>
                                <TableHead>Sử dụng</TableHead>
                                <TableHead>Thời hạn</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map((coupon) => {
                                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                                return (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Ticket className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-mono font-bold">{coupon.code}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => copyCode(coupon.code)}
                                                >
                                                    {copiedCode === coupon.code ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {coupon.type === "percentage" ? (
                                                <span>{coupon.value}%</span>
                                            ) : (
                                                <span>{formatPrice(coupon.value)}</span>
                                            )}
                                            {coupon.maxDiscount && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    (tối đa {formatPrice(coupon.maxDiscount)})
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.minOrder ? formatPrice(coupon.minOrder) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.usedCount}
                                            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.expiresAt ? (
                                                <span className={isExpired ? "text-red-500" : ""}>
                                                    {new Date(coupon.expiresAt).toLocaleDateString("vi-VN")}
                                                </span>
                                            ) : (
                                                "Không giới hạn"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={coupon.isActive}
                                                    onCheckedChange={() => toggleActive(coupon)}
                                                />
                                                <Badge variant={coupon.isActive ? "default" : "secondary"}>
                                                    {coupon.isActive ? "Hoạt động" : "Tắt"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteCoupon(coupon)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCoupon ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
                        </DialogTitle>
                        <DialogDescription>
                            Mã giảm giá có thể áp dụng khi thanh toán
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Mã giảm giá *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="SALE10"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Loại giảm giá</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                                        <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="value">
                                    Giá trị * {formData.type === "percentage" ? "(%)" : "(VNĐ)"}
                                </Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    placeholder="10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxDiscount">Giảm tối đa (VNĐ)</Label>
                                <Input
                                    id="maxDiscount"
                                    type="number"
                                    value={formData.maxDiscount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                    placeholder="100000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minOrder">Đơn tối thiểu (VNĐ)</Label>
                                <Input
                                    id="minOrder"
                                    type="number"
                                    value={formData.minOrder}
                                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                                    placeholder="200000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="usageLimit">Số lần sử dụng</Label>
                                <Input
                                    id="usageLimit"
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startsAt">Ngày bắt đầu</Label>
                                <Input
                                    id="startsAt"
                                    type="date"
                                    value={formData.startsAt}
                                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiresAt">Ngày hết hạn</Label>
                                <Input
                                    id="expiresAt"
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                            />
                            <Label>Hoạt động ngay</Label>
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
            <AlertDialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa mã giảm giá &quot;{deleteCoupon?.code}&quot;?
                            {(deleteCoupon?.usedCount || 0) > 0 && (
                                <span className="block mt-2 text-yellow-600">
                                    Lưu ý: Mã này đã được sử dụng {deleteCoupon?.usedCount} lần và sẽ bị vô hiệu hóa thay vì xóa.
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
