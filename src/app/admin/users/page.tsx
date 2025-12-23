"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash,
    User,
    Shield,
    ShieldCheck,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserItem {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
    _count?: {
        orders: number;
        articles: number;
    };
}

const roleLabels: Record<string, string> = {
    admin: "Quản trị viên",
    editor: "Biên tập viên",
    customer: "Khách hàng",
};

const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    editor: "bg-blue-100 text-blue-800",
    customer: "bg-gray-100 text-gray-800",
};

const roleIcons: Record<string, typeof Shield> = {
    admin: ShieldCheck,
    editor: Shield,
    customer: User,
};

export default function UsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
        role: "customer",
    });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (roleFilter !== "all") params.set("role", roleFilter);

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const openCreateDialog = () => {
        setEditingUser(null);
        setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            phone: "",
            role: "customer",
        });
        setDialogOpen(true);
    };

    const openEditDialog = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: "",
            confirmPassword: "",
            fullName: user.fullName || "",
            phone: user.phone || "",
            role: user.role,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingUser && (!formData.email || !formData.password)) {
            toast.error("Email và mật khẩu là bắt buộc");
            return;
        }

        // Validate password confirmation
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        if (formData.password && formData.password.length < 8) {
            toast.error("Mật khẩu phải có ít nhất 8 ký tự");
            return;
        }

        setSaving(true);
        try {
            if (editingUser) {
                // Update
                const payload: Record<string, string> = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    role: formData.role,
                };
                if (formData.password) {
                    payload.password = formData.password;
                }

                const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.error || "Cập nhật thất bại");
                    return;
                }
                toast.success("Đã cập nhật người dùng!");
            } else {
                // Create
                const res = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) {
                    const error = await res.json();
                    toast.error(error.error || "Tạo người dùng thất bại");
                    return;
                }
                toast.success("Đã tạo người dùng mới!");
            }

            setDialogOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteUser) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Đã xóa người dùng!");
                setDeleteUser(null);
                fetchUsers();
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Người dùng</h1>
                    <p className="text-muted-foreground">Quản lý tài khoản người dùng</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm người dùng
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo email, tên, SĐT..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                        <SelectItem value="editor">Biên tập viên</SelectItem>
                        <SelectItem value="customer">Khách hàng</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy người dùng nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[35%]">Người dùng</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Đơn hàng</TableHead>
                                <TableHead>Bài viết</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const RoleIcon = roleIcons[user.role] || User;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatarUrl || undefined} />
                                                    <AvatarFallback>
                                                        {user.fullName?.[0] || user.email[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">
                                                        {user.fullName || "Chưa cập nhật"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={roleColors[user.role]}
                                            >
                                                <RoleIcon className="mr-1 h-3 w-3" />
                                                {roleLabels[user.role]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user._count?.orders || 0}</TableCell>
                                        <TableCell>{user._count?.articles || 0}</TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteUser(user)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Sửa người dùng" : "Thêm người dùng"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Cập nhật thông tin người dùng"
                                : "Tạo tài khoản người dùng mới"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="user@example.com"
                                disabled={!!editingUser}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder="••••••••"
                            />
                        </div>
                        {(formData.password || !editingUser) && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Nhập lại mật khẩu *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ tên</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fullName: e.target.value })
                                    }
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Vai trò</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v) => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Khách hàng</SelectItem>
                                    <SelectItem value="editor">Biên tập viên</SelectItem>
                                    <SelectItem value="admin">Quản trị viên</SelectItem>
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
            <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng "{deleteUser?.email}"?
                            Hành động này không thể hoàn tác.
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
