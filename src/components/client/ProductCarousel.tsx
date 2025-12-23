"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductVariant {
    price: number;
    salePrice: number | null;
    isDefault: boolean;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    images: string[] | unknown;
    variants: ProductVariant[];
}

interface ProductCarouselProps {
    products: Product[];
    title: string;
    viewAllLink?: string;
    autoplayDelay?: number;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function ProductCarousel({
    products,
    title,
    viewAllLink = "/san-pham",
    autoplayDelay = 4000,
}: ProductCarouselProps) {
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

    if (products.length === 0) return null;

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    {title}
                </h2>
                <Link
                    href={viewAllLink}
                    className="text-primary font-medium hover:underline flex items-center gap-1"
                >
                    Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Carousel */}
            <div className="relative group">
                {/* Navigation Arrows */}
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition hidden md:flex"
                    onClick={scrollPrev}
                    disabled={prevBtnDisabled}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition hidden md:flex"
                    onClick={scrollNext}
                    disabled={nextBtnDisabled}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Slides */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex -ml-4">
                        {products.map((product) => {
                            const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
                            const price = defaultVariant?.price || 0;
                            const salePrice = defaultVariant?.salePrice;
                            const images = Array.isArray(product.images) ? product.images : [];

                            return (
                                <div
                                    key={product.id}
                                    className="flex-[0_0_50%] sm:flex-[0_0_33.333%] lg:flex-[0_0_20%] pl-4"
                                >
                                    <Link href={`/san-pham/${product.slug}`}>
                                        <div className="bg-white rounded-lg p-4 border hover:shadow-lg hover:-translate-y-1 transition-all group/card h-full flex flex-col">
                                            {salePrice && (
                                                <Badge className="mb-2 bg-red-500 w-fit">
                                                    -{Math.round((1 - salePrice / price) * 100)}%
                                                </Badge>
                                            )}
                                            <div className="aspect-square rounded overflow-hidden mb-4">
                                                {images[0] ? (
                                                    <img
                                                        src={images[0] as string}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover/card:scale-105 transition"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 group-hover/card:scale-105 transition" />
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem] flex-grow">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                {salePrice ? (
                                                    <>
                                                        <span className="text-red-500 font-bold">
                                                            {formatPrice(salePrice)}
                                                        </span>
                                                        <span className="text-slate-400 text-sm line-through">
                                                            {formatPrice(price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="font-bold">{formatPrice(price)}</span>
                                                )}
                                            </div>
                                            <Button size="sm" className="w-full">
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Thêm giỏ
                                            </Button>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
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
