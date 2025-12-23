"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Clock, ShoppingCart, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    viewCount: number;
    publishedAt: string | null;
    category: { name: string; slug: string } | null;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    images: string[];
    category: { name: string; slug: string } | null;
    variants: {
        price: number;
        salePrice: number | null;
        stockQuantity: number;
        isDefault: boolean;
    }[];
}

interface SearchResults {
    articles: Article[];
    products: Product[];
    total: number;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function getRelativeTime(date: string | null): string {
    if (!date) return "";
    const now = new Date();
    const pubDate = new Date(date);
    const diffMs = now.getTime() - pubDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<"all" | "articles" | "products">("all");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults>({ articles: [], products: [], total: 0 });

    // Fetch search results
    const fetchResults = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults({ articles: [], products: [], total: 0 });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                const searchData = data.data || data;
                setResults({
                    articles: searchData.articles || [],
                    products: searchData.products || [],
                    total: (searchData.articles?.length || 0) + (searchData.products?.length || 0)
                });
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial search from URL
    useEffect(() => {
        if (initialQuery) {
            fetchResults(initialQuery);
        }
    }, [initialQuery, fetchResults]);

    // Debounced search on input change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== initialQuery) {
                fetchResults(searchQuery);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, initialQuery, fetchResults]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchResults(searchQuery);
    };

    const { articles, products } = results;
    const totalResults = articles.length + products.length;

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Search Header */}
            <section className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài viết, sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setResults({ articles: [], products: [], total: 0 });
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tìm kiếm"}
                        </Button>
                    </form>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-4 border-b -mb-[1px]">
                        {[
                            { key: "all", label: `Tất cả (${totalResults})` },
                            { key: "articles", label: `Bài viết (${articles.length})` },
                            { key: "products", label: `Sản phẩm (${products.length})` },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                                className={`px-4 py-2 font-medium transition border-b-2 -mb-[1px] ${activeTab === tab.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div>
                        {/* Results Count */}
                        <p className="text-muted-foreground mb-6">
                            Tìm thấy <strong>{totalResults}</strong> kết quả
                            {searchQuery && ` cho "${searchQuery}"`}
                        </p>

                        {/* Articles */}
                        {(activeTab === "all" || activeTab === "articles") && articles.length > 0 && (
                            <div className="mb-8">
                                {activeTab === "all" && (
                                    <h2 className="text-lg font-bold mb-4">Bài viết</h2>
                                )}
                                <div className="space-y-4">
                                    {articles.map((article) => (
                                        <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                            <div className="bg-white rounded-lg border p-4 flex gap-4 hover:shadow-lg transition group">
                                                <div className="w-[200px] h-[120px] flex-shrink-0 rounded-lg overflow-hidden">
                                                    {article.featuredImage ? (
                                                        <img
                                                            src={article.featuredImage}
                                                            alt={article.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    {article.category && (
                                                        <Badge variant="outline" className="mb-2">
                                                            {article.category.name}
                                                        </Badge>
                                                    )}
                                                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition line-clamp-2">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                                                        {article.excerpt}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {getRelativeTime(article.publishedAt)}
                                                        </span>
                                                        <span>{article.viewCount.toLocaleString()} lượt xem</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products */}
                        {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
                            <div>
                                {activeTab === "all" && (
                                    <h2 className="text-lg font-bold mb-4">Sản phẩm</h2>
                                )}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map((product) => {
                                        const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
                                        const price = defaultVariant?.price || 0;
                                        const salePrice = defaultVariant?.salePrice;
                                        const inStock = (defaultVariant?.stockQuantity || 0) > 0;
                                        const image = Array.isArray(product.images) && product.images[0];

                                        return (
                                            <Link key={product.id} href={`/san-pham/${product.slug}`}>
                                                <div className="bg-white rounded-lg border p-4 hover:shadow-lg transition group">
                                                    <div className="aspect-square rounded-lg overflow-hidden mb-3">
                                                        {image ? (
                                                            <img
                                                                src={image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 group-hover:scale-105 transition" />
                                                        )}
                                                    </div>
                                                    {product.category && (
                                                        <Badge variant="secondary" className="mb-2 text-xs">
                                                            {product.category.name}
                                                        </Badge>
                                                    )}
                                                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        {salePrice && salePrice < price ? (
                                                            <>
                                                                <span className="text-red-500 font-bold">
                                                                    {formatPrice(salePrice)}
                                                                </span>
                                                                <span className="text-slate-400 text-xs line-through">
                                                                    {formatPrice(price)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-bold">{formatPrice(price)}</span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="w-full"
                                                        disabled={!inStock}
                                                    >
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                        {inStock ? "Thêm giỏ" : "Hết hàng"}
                                                    </Button>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && totalResults === 0 && searchQuery && (
                            <div className="text-center py-16">
                                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <h2 className="text-xl font-bold mb-2">Không tìm thấy kết quả</h2>
                                <p className="text-muted-foreground">
                                    Thử tìm kiếm với từ khóa khác
                                </p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !searchQuery && (
                            <div className="text-center py-16">
                                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <h2 className="text-xl font-bold mb-2">Tìm kiếm</h2>
                                <p className="text-muted-foreground">
                                    Nhập từ khóa để tìm kiếm bài viết và sản phẩm
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

// Default export with Suspense boundary for useSearchParams
export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background py-8">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </div>
            </main>
        }>
            <SearchContent />
        </Suspense>
    );
}

