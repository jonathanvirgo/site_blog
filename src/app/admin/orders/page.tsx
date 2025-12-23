"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Search,
    MoreHorizontal,
    Eye,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
} from "lucide-react";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Order {
    id: string;
    orderNumber: string;
    shippingName: string;
    shippingPhone: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    _count?: { items: number };
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
};

const paymentStatusLabels: Record<string, string> = {
    pending: "Chưa thanh toán",
    paid: "Đã thanh toán",
    failed: "Thất bại",
    refunded: "Hoàn tiền",
};

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [updating, setUpdating] = useState<string | null>(null);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.data?.orders || data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success("Đã cập nhật trạng thái!");
                setOrders(orders.map(o =>
                    o.id === orderId ? { ...o, status: newStatus } : o
                ));
            } else {
                toast.error("Cập nhật trạng thái thất bại");
            }
        } catch (error) {
            console.error("Update status error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setUpdating(null);
        }
    };

    const getNextStatuses = (currentStatus: string): string[] => {
        switch (currentStatus) {
            case "pending":
                return ["confirmed", "cancelled"];
            case "confirmed":
                return ["processing", "cancelled"];
            case "processing":
                return ["shipped", "cancelled"];
            case "shipped":
                return ["delivered"];
            default:
                return [];
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Đơn hàng</h1>
                    <p className="text-muted-foreground">Quản lý tất cả đơn hàng</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo mã đơn, tên, SĐT..."
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
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="shipped">Đang giao</SelectItem>
                        <SelectItem value="delivered">Đã giao</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy đơn hàng nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã đơn</TableHead>
                                <TableHead>Khách hàng</TableHead>
                                <TableHead>Tổng tiền</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thanh toán</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{order.shippingName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.shippingPhone}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatPrice(order.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={statusColors[order.status]}
                                        >
                                            {statusLabels[order.status] || order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={paymentStatusColors[order.paymentStatus]}
                                        >
                                            {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={updating === order.id}
                                                >
                                                    {updating === order.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Chi tiết
                                                    </Link>
                                                </DropdownMenuItem>

                                                {getNextStatuses(order.status).length > 0 && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        {getNextStatuses(order.status).map((status) => (
                                                            <DropdownMenuItem
                                                                key={status}
                                                                onClick={() => updateStatus(order.id, status)}
                                                            >
                                                                {status === "confirmed" && <Clock className="mr-2 h-4 w-4" />}
                                                                {status === "processing" && <Clock className="mr-2 h-4 w-4" />}
                                                                {status === "shipped" && <Truck className="mr-2 h-4 w-4" />}
                                                                {status === "delivered" && <CheckCircle className="mr-2 h-4 w-4" />}
                                                                {status === "cancelled" && <XCircle className="mr-2 h-4 w-4 text-destructive" />}
                                                                {statusLabels[status]}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
