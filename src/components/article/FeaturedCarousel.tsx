"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    category: {
        name: string;
        slug: string;
    } | null;
}

interface FeaturedCarouselProps {
    articles: Article[];
    title?: string;
}

export function FeaturedCarousel({ articles, title = "Tin nổi bật" }: FeaturedCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 300;
        scrollContainerRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    };

    if (articles.length === 0) return null;

    return (
        <section className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-orange-500">🔥</span>
                    {title}
                </h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="rounded-full"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("right")}
                        className="rounded-full"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/bai-viet/${article.slug}`}
                        className="flex-shrink-0 w-[280px] group"
                    >
                        <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-3 shadow-md">
                            {article.featuredImage ? (
                                <img
                                    src={article.featuredImage}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                            )}
                            {article.category && (
                                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    {article.category.name}
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                        </h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}
