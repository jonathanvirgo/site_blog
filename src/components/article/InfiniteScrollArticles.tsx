"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    category: {
        name: string;
    } | null;
}

interface InfiniteScrollArticlesProps {
    excludeIds: string[];
    initialArticles?: Article[];
}

export function InfiniteScrollArticles({ excludeIds, initialArticles = [] }: InfiniteScrollArticlesProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(initialArticles.length);
    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchMoreArticles = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const excludeParam = [...excludeIds, ...articles.map(a => a.id)].join(",");
            const res = await fetch(
                `/api/articles/latest?offset=${offset}&limit=10&excludeIds=${excludeParam}`
            );
            const data = await res.json();

            if (data.success && data.data) {
                if (data.data.length === 0) {
                    setHasMore(false);
                } else {
                    setArticles(prev => [...prev, ...data.data]);
                    setOffset(prev => prev + data.data.length);
                    setHasMore(data.pagination?.hasMore ?? false);
                }
            }
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, offset, excludeIds, articles]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchMoreArticles();
                }
            },
            { threshold: 0.1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [fetchMoreArticles, hasMore, loading]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="space-y-4">
            {articles.map((article) => (
                <Link
                    key={article.id}
                    href={`/bai-viet/${article.slug}`}
                    className="flex gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                    {/* Image */}
                    <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] flex-shrink-0 rounded-lg overflow-hidden">
                        {article.featuredImage ? (
                            <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No image</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                        </h3>
                        {article.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
                                {article.excerpt}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            {article.category && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {article.category.name}
                                </span>
                            )}
                            <span>·</span>
                            <span>{formatDate(article.publishedAt)}</span>
                        </div>
                    </div>
                </Link>
            ))}

            {/* Loading / End State */}
            <div ref={loaderRef} className="py-8 text-center">
                {loading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải thêm bài viết...</span>
                    </div>
                )}
                {!hasMore && articles.length > 0 && (
                    <p className="text-muted-foreground">
                        Bạn đã xem hết! 🎉
                    </p>
                )}
                {!hasMore && articles.length === 0 && (
                    <p className="text-muted-foreground">
                        Không có bài viết nào.
                    </p>
                )}
            </div>
        </div>
    );
}
