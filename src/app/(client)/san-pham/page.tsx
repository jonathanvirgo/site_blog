"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, List, ShoppingCart, SlidersHorizontal, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
}

interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    salePrice: number | null;
    stockQuantity: number;
    isDefault: boolean;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    images: string[];
    category: { id: string; name: string; slug: string } | null;
    variants: ProductVariant[];
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function FilterSidebar({
    categories,
    selectedCategory,
    onCategoryChange
}: {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (slug: string) => void;
    className?: string;
}) {
    return (
        <div>
            {/* Categories */}
            <div className="mb-6">
                <h3 className="font-semibold mb-3">Danh mục</h3>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="category"
                            className="h-4 w-4"
                            checked={selectedCategory === "all"}
                            onChange={() => onCategoryChange("all")}
                        />
                        <span className="flex-1">Tất cả</span>
                    </label>
                    {categories.map((cat) => (
                        <label
                            key={cat.slug}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="category"
                                className="h-4 w-4"
                                checked={selectedCategory === cat.id}
                                onChange={() => onCategoryChange(cat.id)}
                            />
                            <span className="flex-1">{cat.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <Separator className="my-4" />

            {/* Price Range */}
            <div className="mb-6">
                <h3 className="font-semibold mb-3">Khoảng giá</h3>
                <div className="space-y-2">
                    {[
                        { label: "Dưới 200.000đ", value: "0-200000" },
                        { label: "200.000đ - 500.000đ", value: "200000-500000" },
                        { label: "500.000đ - 1.000.000đ", value: "500000-1000000" },
                        { label: "Trên 1.000.000đ", value: "1000000-" },
                    ].map((range) => (
                        <label
                            key={range.value}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <input type="checkbox" className="h-4 w-4 rounded" />
                            <span>{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [addedToCart, setAddedToCart] = useState<string | null>(null);
    const { setItemCount } = useCart();

    // Fetch categories
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories?type=product");
                if (res.ok) {
                    const data = await res.json();
                    const cats = data.data?.productCategories || data.productCategories || [];
                    setCategories(cats);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        }
        fetchCategories();
    }, []);

    // Fetch products
    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                let url = `/api/products?page=${page}&limit=12&status=active`;
                if (selectedCategory !== "all") {
                    url += `&categoryId=${selectedCategory}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [page, selectedCategory]);

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setPage(1); // Reset to first page when changing category
    };

    const handleAddToCart = async (product: Product) => {
        const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
        if (!defaultVariant) {
            toast.error("Không có biến thể sản phẩm");
            return;
        }

        setAddingToCart(product.id);
        setAddedToCart(null);

        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variantId: defaultVariant.id,
                    quantity: 1
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Sync badge count from API response
                if (typeof data.itemCount === "number") {
                    setItemCount(data.itemCount);
                    localStorage.setItem("cartCount", String(data.itemCount));
                }
                setAddedToCart(product.id);
                toast.success("Đã thêm vào giỏ hàng!", {
                    description: product.name,
                    action: {
                        label: "Xem giỏ",
                        onClick: () => window.location.href = "/gio-hang"
                    }
                });
                // Reset success state after 2 seconds
                setTimeout(() => setAddedToCart(null), 2000);
            } else {
                toast.error("Không thể thêm vào giỏ hàng", {
                    description: "Vui lòng thử lại sau."
                });
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            toast.error("Có lỗi xảy ra", {
                description: "Vui lòng thử lại sau."
            });
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <div className="py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Cửa hàng</h1>
                    <p className="text-muted-foreground">
                        Khám phá các sản phẩm chăm sóc sức khỏe chất lượng cao
                    </p>
                </div>

                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <FilterSidebar
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={handleCategoryChange}
                        />
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-muted-foreground">
                                {loading ? "Đang tải..." : `Hiển thị ${products.length} sản phẩm`}
                            </p>

                            <div className="flex items-center gap-2">
                                {/* Mobile Filter */}
                                <Sheet>
                                    <SheetTrigger asChild className="lg:hidden">
                                        <Button variant="outline" size="sm">
                                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                                            Bộ lọc
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left">
                                        <SheetHeader>
                                            <SheetTitle>Bộ lọc</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <FilterSidebar
                                                categories={categories}
                                                selectedCategory={selectedCategory}
                                                onCategoryChange={handleCategoryChange}
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                {/* Sort */}
                                <Select defaultValue="newest">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Sắp xếp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Mới nhất</SelectItem>
                                        <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                                        <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                                        <SelectItem value="popular">Phổ biến nhất</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* View Mode */}
                                <div className="hidden sm:flex border rounded-lg">
                                    <Button
                                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("grid")}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
                            </div>
                        ) : (
                            /* Product Grid */
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                                        : "space-y-4"
                                }
                            >
                                {products.map((product) => {
                                    const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
                                    const price = defaultVariant?.price || 0;
                                    const salePrice = defaultVariant?.salePrice;
                                    const hasDiscount = salePrice && salePrice < price;
                                    const image = Array.isArray(product.images) && product.images[0];

                                    return (
                                        <Card
                                            key={product.id}
                                            className={`group overflow-hidden ${viewMode === "list" ? "flex flex-row" : ""}`}
                                        >
                                            <div
                                                className={`relative overflow-hidden ${viewMode === "list"
                                                    ? "w-40 h-40 flex-shrink-0"
                                                    : "aspect-square"
                                                    }`}
                                            >
                                                {image ? (
                                                    <img
                                                        src={image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted" />
                                                )}
                                                {hasDiscount && (
                                                    <Badge className="absolute top-2 left-2 z-10 bg-red-500">
                                                        -{Math.round((1 - salePrice / price) * 100)}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    {product.category?.name || "Sản phẩm"}
                                                </p>
                                                <Link href={`/san-pham/${product.slug}`}>
                                                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition mb-2">
                                                        {product.name}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="font-bold text-primary">
                                                        {formatPrice(salePrice || price)}
                                                    </span>
                                                    {hasDiscount && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            {formatPrice(price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToCart(product);
                                                    }}
                                                    disabled={addingToCart === product.id}
                                                >
                                                    {addingToCart === product.id ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : addedToCart === product.id ? (
                                                        <Check className="h-4 w-4 mr-2" />
                                                    ) : (
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                    )}
                                                    {addedToCart === product.id ? "Đã thêm!" : "Thêm vào giỏ"}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Trước
                                </Button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                                    <Button
                                        key={p}
                                        variant={page === p ? "default" : "outline"}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Sau
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
