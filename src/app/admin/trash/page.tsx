"use client";

import { useState, useEffect } from "react";
import {
    Trash2,
    RotateCcw,
    AlertTriangle,
    FileText,
    Package,
    Loader2,
    X,
} from "lucide-react";

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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TrashedArticle {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    deletedAt: string;
    author: { fullName: string | null };
}

interface TrashedProduct {
    id: string;
    name: string;
    slug: string;
    images: string[];
    deletedAt: string;
}

export default function TrashPage() {
    const [articles, setArticles] = useState<TrashedArticle[]>([]);
    const [products, setProducts] = useState<TrashedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "restore" | "delete" | "empty";
        itemType?: "article" | "product";
        itemId?: string;
        itemName?: string;
    }>({ open: false, type: "delete" });

    useEffect(() => {
        fetchTrash();
    }, []);

    const fetchTrash = async () => {
        try {
            const res = await fetch("/api/trash");
            const data = await res.json();
            setArticles(data.articles || []);
            setProducts(data.products || []);
        } catch (error) {
            console.error("Fetch trash error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (type: "article" | "product", id: string) => {
        setActionLoading(id);
        try {
            const endpoint = type === "article" ? `/api/articles/${id}` : `/api/products/${id}`;
            const res = await fetch(endpoint, { method: "PATCH" });

            if (res.ok) {
                if (type === "article") {
                    setArticles((prev) => prev.filter((a) => a.id !== id));
                } else {
                    setProducts((prev) => prev.filter((p) => p.id !== id));
                }
            }
        } catch (error) {
            console.error("Restore error:", error);
        } finally {
            setActionLoading(null);
            setConfirmDialog({ open: false, type: "restore" });
        }
    };

    const handlePermanentDelete = async (type: "article" | "product", id: string) => {
        setActionLoading(id);
        try {
            const endpoint = type === "article"
                ? `/api/articles/${id}?permanent=true`
                : `/api/products/${id}?permanent=true`;
            const res = await fetch(endpoint, { method: "DELETE" });

            if (res.ok) {
                if (type === "article") {
                    setArticles((prev) => prev.filter((a) => a.id !== id));
                } else {
                    setProducts((prev) => prev.filter((p) => p.id !== id));
                }
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setActionLoading(null);
            setConfirmDialog({ open: false, type: "delete" });
        }
    };

    const handleEmptyTrash = async (type: "all" | "articles" | "products") => {
        setActionLoading("empty");
        try {
            const res = await fetch(`/api/trash?type=${type}`, { method: "DELETE" });

            if (res.ok) {
                if (type === "articles" || type === "all") {
                    setArticles([]);
                }
                if (type === "products" || type === "all") {
                    setProducts([]);
                }
            }
        } catch (error) {
            console.error("Empty trash error:", error);
        } finally {
            setActionLoading(null);
            setConfirmDialog({ open: false, type: "empty" });
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const totalItems = articles.length + products.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trash2 className="h-8 w-8" />
                        Thùng rác
                    </h1>
                    <p className="text-muted-foreground">
                        {totalItems} mục trong thùng rác
                    </p>
                </div>
                {totalItems > 0 && (
                    <Button
                        variant="destructive"
                        onClick={() => setConfirmDialog({ open: true, type: "empty" })}
                        disabled={actionLoading === "empty"}
                    >
                        {actionLoading === "empty" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Xóa tất cả vĩnh viễn
                    </Button>
                )}
            </div>

            {/* Warning */}
            {totalItems > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Lưu ý</p>
                        <p className="text-sm text-amber-700">
                            Các mục trong thùng rác sẽ được xóa vĩnh viễn sau 30 ngày.
                            Khi xóa vĩnh viễn, hình ảnh liên quan cũng sẽ bị xóa khỏi Cloudinary.
                        </p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {totalItems === 0 && (
                <div className="text-center py-16">
                    <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Thùng rác trống</h2>
                    <p className="text-muted-foreground">
                        Không có bài viết hoặc sản phẩm nào trong thùng rác
                    </p>
                </div>
            )}

            {/* Tabs */}
            {totalItems > 0 && (
                <Tabs defaultValue="articles">
                    <TabsList>
                        <TabsTrigger value="articles" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Bài viết ({articles.length})
                        </TabsTrigger>
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Sản phẩm ({products.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Articles Tab */}
                    <TabsContent value="articles">
                        {articles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Không có bài viết nào trong thùng rác
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Tác giả</TableHead>
                                            <TableHead>Ngày xóa</TableHead>
                                            <TableHead className="w-[150px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {articles.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {article.featuredImage && (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={article.featuredImage}
                                                                alt=""
                                                                className="w-12 h-8 object-cover rounded"
                                                            />
                                                        )}
                                                        <span className="font-medium line-clamp-1">
                                                            {article.title}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {article.author?.fullName || "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(article.deletedAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setConfirmDialog({
                                                                open: true,
                                                                type: "restore",
                                                                itemType: "article",
                                                                itemId: article.id,
                                                                itemName: article.title,
                                                            })}
                                                            disabled={actionLoading === article.id}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setConfirmDialog({
                                                                open: true,
                                                                type: "delete",
                                                                itemType: "article",
                                                                itemId: article.id,
                                                                itemName: article.title,
                                                            })}
                                                            disabled={actionLoading === article.id}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent value="products">
                        {products.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Không có sản phẩm nào trong thùng rác
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Số ảnh</TableHead>
                                            <TableHead>Ngày xóa</TableHead>
                                            <TableHead className="w-[150px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => {
                                            const imageCount = Array.isArray(product.images) ? product.images.length : 0;
                                            return (
                                                <TableRow key={product.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {imageCount > 0 && (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={product.images[0]}
                                                                    alt=""
                                                                    className="w-10 h-10 object-cover rounded"
                                                                />
                                                            )}
                                                            <span className="font-medium line-clamp-1">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{imageCount} ảnh</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {formatDate(product.deletedAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setConfirmDialog({
                                                                    open: true,
                                                                    type: "restore",
                                                                    itemType: "product",
                                                                    itemId: product.id,
                                                                    itemName: product.name,
                                                                })}
                                                                disabled={actionLoading === product.id}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => setConfirmDialog({
                                                                    open: true,
                                                                    type: "delete",
                                                                    itemType: "product",
                                                                    itemId: product.id,
                                                                    itemName: product.name,
                                                                })}
                                                                disabled={actionLoading === product.id}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.type === "restore" && "Khôi phục mục này?"}
                            {confirmDialog.type === "delete" && "Xóa vĩnh viễn?"}
                            {confirmDialog.type === "empty" && "Xóa tất cả thùng rác?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === "restore" && (
                                <>Mục &quot;{confirmDialog.itemName}&quot; sẽ được khôi phục.</>
                            )}
                            {confirmDialog.type === "delete" && (
                                <>
                                    Mục &quot;{confirmDialog.itemName}&quot; sẽ bị xóa vĩnh viễn.
                                    <br />
                                    <span className="text-destructive font-medium">
                                        Hình ảnh liên quan cũng sẽ bị xóa khỏi Cloudinary.
                                    </span>
                                </>
                            )}
                            {confirmDialog.type === "empty" && (
                                <>
                                    Tất cả {totalItems} mục trong thùng rác sẽ bị xóa vĩnh viễn.
                                    <br />
                                    <span className="text-destructive font-medium">
                                        Tất cả hình ảnh liên quan cũng sẽ bị xóa khỏi Cloudinary. Hành động này không thể hoàn tác!
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmDialog.type === "restore" && confirmDialog.itemType && confirmDialog.itemId) {
                                    handleRestore(confirmDialog.itemType, confirmDialog.itemId);
                                } else if (confirmDialog.type === "delete" && confirmDialog.itemType && confirmDialog.itemId) {
                                    handlePermanentDelete(confirmDialog.itemType, confirmDialog.itemId);
                                } else if (confirmDialog.type === "empty") {
                                    handleEmptyTrash("all");
                                }
                            }}
                            className={confirmDialog.type !== "restore" ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                            {confirmDialog.type === "restore" ? "Khôi phục" : "Xóa vĩnh viễn"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
