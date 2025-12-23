"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface LatestArticlesFeedProps {
    initialArticles: Article[];
    excludeIds?: string[];
    pageSize?: number;
    threshold?: number;
}

function getRelativeTime(date: string | null): string {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}

export function LatestArticlesFeed({
    initialArticles,
    excludeIds = [],
    pageSize = 10,
    threshold = 200,
}: LatestArticlesFeedProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(initialArticles.length);
    const loadingRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const currentExcludeIds = [...excludeIds, ...articles.map((a) => a.id)];
            const params = new URLSearchParams({
                offset: offset.toString(),
                limit: pageSize.toString(),
                excludeIds: currentExcludeIds.join(","),
            });

            const res = await fetch(`/api/articles/latest?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            const newArticles = data.data || [];

            if (newArticles.length === 0 || newArticles.length < pageSize) {
                setHasMore(false);
            }

            setArticles((prev) => [...prev, ...newArticles]);
            setOffset((prev) => prev + newArticles.length);
        } catch (error) {
            console.error("Error loading more articles:", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, offset, pageSize, excludeIds, articles]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            {
                rootMargin: `${threshold}px`,
            }
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoading, threshold]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 border-b-4 border-primary pb-2 inline-block">
                Bài viết mới nhất
            </h2>
            <div className="space-y-6">
                {articles.map((article) => (
                    <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                        <div className="flex gap-4 group">
                            <div className="w-[240px] h-[160px] flex-shrink-0 rounded-lg overflow-hidden">
                                {article.featuredImage ? (
                                    <img
                                        src={article.featuredImage}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 group-hover:scale-105 transition" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Badge variant="outline" className="mb-2">
                                    {article.category?.name || "Chung"}
                                </Badge>
                                <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {article.excerpt}
                                </p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
                                    {getRelativeTime(article.publishedAt)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Loading indicator / Observer target */}
            <div ref={loadingRef} className="py-8 flex justify-center">
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải thêm...</span>
                    </div>
                )}
                {!hasMore && articles.length > initialArticles.length && (
                    <p className="text-muted-foreground text-sm">Đã hiển thị tất cả bài viết</p>
                )}
            </div>
        </div>
    );
}
