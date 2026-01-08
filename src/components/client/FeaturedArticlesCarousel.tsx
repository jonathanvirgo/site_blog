"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
}

interface FeaturedArticlesCarouselProps {
    articles: Article[];
    title?: string;
    autoplayDelay?: number;
}

export function FeaturedArticlesCarousel({
    articles,
    title = "Đáng chú ý",
    autoplayDelay = 4000,
}: FeaturedArticlesCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: "start",
            slidesToScroll: 1,
        },
        [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

    const onInit = useCallback(() => {
        if (!emblaApi) return;
        setScrollSnaps(emblaApi.scrollSnapList());
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevBtnDisabled(!emblaApi.canScrollPrev());
        setNextBtnDisabled(!emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        onInit();
        onSelect();
        emblaApi.on("reInit", onInit);
        emblaApi.on("reInit", onSelect);
        emblaApi.on("select", onSelect);

        return () => {
            emblaApi.off("reInit", onInit);
            emblaApi.off("reInit", onSelect);
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, onInit, onSelect]);

    if (articles.length === 0) return null;

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-bold uppercase tracking-wide relative">
                    <span className="relative z-10">{title}</span>
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-400 rounded-full"></span>
                </h2>
            </div>

            {/* Carousel */}
            <div className="relative group">
                {/* Navigation Arrows */}
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white hover:bg-white shadow-xl border-0 opacity-0 group-hover:opacity-100 transition-all hidden md:flex hover:scale-110"
                    onClick={scrollPrev}
                    disabled={prevBtnDisabled}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white hover:bg-white shadow-xl border-0 opacity-0 group-hover:opacity-100 transition-all hidden md:flex hover:scale-110"
                    onClick={scrollNext}
                    disabled={nextBtnDisabled}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                {/* Slides */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex -ml-4">
                        {articles.map((article) => (
                            <div
                                key={article.id}
                                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4"
                            >
                                <Link href={`/bai-viet/${article.slug}`}>
                                    <div className="group/card">
                                        <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 shadow-md">
                                            {article.featuredImage ? (
                                                <img
                                                    src={article.featuredImage}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-secondary to-muted group-hover/card:scale-105 transition-transform duration-500" />
                                            )}
                                        </div>
                                        <h4 className="font-semibold line-clamp-2 text-base group-hover/card:text-primary transition-colors">
                                            {article.title}
                                        </h4>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
                {scrollSnaps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${index === selectedIndex
                            ? "bg-primary w-6"
                            : "bg-slate-300 hover:bg-slate-400"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
