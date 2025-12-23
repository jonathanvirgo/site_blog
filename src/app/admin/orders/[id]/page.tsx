"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    User,
    Phone,
    MapPin,
    CreditCard,
    FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mock data
const order = {
    id: "1",
    orderNumber: "ORD-2024-001",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "vnpay",
    totalAmount: 750000,
    discountAmount: 50000,
    createdAt: "2024-12-18 14:30",
    customer: {
        name: "Nguyễn Văn A",
        phone: "0901234567",
        email: "nguyenvana@email.com",
    },
    shipping: {
        name: "Nguyễn Văn A",
        phone: "0901234567",
        address: "123 Đường ABC, Phường XYZ",
        ward: "Phường 1",
        district: "Quận 1",
        city: "TP. Hồ Chí Minh",
    },
    items: [
        {
            id: "1",
            name: "Vitamin C 1000mg Natural Plus",
            variant: "60 viên",
            price: 350000,
            quantity: 1,
            subtotal: 350000,
        },
        {
            id: "2",
            name: "Omega 3 Fish Oil Premium",
            variant: "90 viên",
            price: 400000,
            quantity: 1,
            subtotal: 400000,
        },
    ],
    timeline: [
        { status: "pending", label: "Đặt hàng", time: "2024-12-18 14:30", done: true },
        { status: "confirmed", label: "Xác nhận", time: "2024-12-18 14:45", done: true },
        { status: "processing", label: "Đang xử lý", time: null, done: false },
        { status: "shipped", label: "Đang giao", time: null, done: false },
        { status: "delivered", label: "Đã giao", time: null, done: false },
    ],
    note: "Giao hàng giờ hành chính, gọi trước 30 phút.",
};

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

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

export default function OrderDetailPage() {
    const [status, setStatus] = useState(order.status);

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        // TODO: Call API to update status
        console.log("Updating status to:", newStatus);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono">
                                {order.orderNumber}
                            </h1>
                            <Badge className={statusColors[status]}>
                                {statusLabels[status]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Đặt lúc {order.createdAt}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Cập nhật trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Chờ xử lý</SelectItem>
                            <SelectItem value="confirmed">Xác nhận</SelectItem>
                            <SelectItem value="processing">Đang xử lý</SelectItem>
                            <SelectItem value="shipped">Giao hàng</SelectItem>
                            <SelectItem value="delivered">Đã giao</SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">In đơn</Button>
                </div>
            </div>

            {/* Timeline */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        {order.timeline.map((step, index) => (
                            <div
                                key={step.status}
                                className="flex flex-col items-center relative"
                            >
                                {/* Connection line */}
                                {index < order.timeline.length - 1 && (
                                    <div
                                        className={`absolute top-4 left-1/2 w-full h-0.5 ${step.done ? "bg-primary" : "bg-muted"
                                            }`}
                                    />
                                )}

                                {/* Icon */}
                                <div
                                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${step.done
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    {step.done ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <Clock className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Label */}
                                <p
                                    className={`mt-2 text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    {step.label}
                                </p>
                                {step.time && (
                                    <p className="text-xs text-muted-foreground">{step.time}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Sản phẩm ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Sản phẩm</TableHead>
                                        <TableHead>Đơn giá</TableHead>
                                        <TableHead>SL</TableHead>
                                        <TableHead className="text-right">Thành tiền</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.variant && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.variant}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatPrice(item.price)}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatPrice(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Separator className="my-4" />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tạm tính</span>
                                    <span>{formatPrice(order.totalAmount + order.discountAmount)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá</span>
                                        <span>-{formatPrice(order.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phí vận chuyển</span>
                                    <span className="text-green-600">Miễn phí</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Tổng cộng</span>
                                    <span className="text-primary">
                                        {formatPrice(order.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Note */}
                    {order.note && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Ghi chú
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{order.note}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium">{order.customer.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.customer.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {order.customer.phone}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Địa chỉ giao hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium">{order.shipping.name}</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {order.shipping.phone}
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p>{order.shipping.address}</p>
                                    <p className="text-muted-foreground">
                                        {order.shipping.ward}, {order.shipping.district},{" "}
                                        {order.shipping.city}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Phương thức</span>
                                <span className="font-medium uppercase">
                                    {order.paymentMethod}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Trạng thái</span>
                                <Badge
                                    className={
                                        order.paymentStatus === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }
                                >
                                    {order.paymentStatus === "paid"
                                        ? "Đã thanh toán"
                                        : "Chưa thanh toán"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
