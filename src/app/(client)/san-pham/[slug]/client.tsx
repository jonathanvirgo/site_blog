"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Minus, Plus, ShoppingCart, Heart, Share2, Loader2, Check, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";

// ==================== Types ====================
interface Variant {
    id: string;
    sku: string;
    price: number;
    salePrice: number | null;
    stockQuantity: number;
    isDefault: boolean;
}

interface ProductDetailClientProps {
    productId: string;
    productName: string;
    variants: Variant[];
    defaultVariantId?: string;
    images: string[];
}

// ==================== Utility Functions ====================
function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

// ==================== Image Gallery Component ====================
interface ImageGalleryProps {
    images: string[];
    productName: string;
    discountPercent?: number;
}

function ImageGallery({ images, productName, discountPercent = 0 }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
    const imageRef = useRef<HTMLDivElement>(null);

    // Mobile carousel
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const handleThumbnailClick = (index: number) => {
        setSelectedIndex(index);
        emblaApi?.scrollTo(index);
    };

    if (images.length === 0) {
        return (
            <div className="aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">Không có hình ảnh</span>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Main Image - Desktop */}
                <div
                    ref={imageRef}
                    className="aspect-square rounded-xl overflow-hidden relative cursor-zoom-in hidden md:block group"
                    onClick={() => setIsLightboxOpen(true)}
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={() => setIsZooming(false)}
                    onMouseMove={handleMouseMove}
                >
                    <img
                        src={images[selectedIndex]}
                        alt={productName}
                        className={`w-full h-full object-cover transition-transform duration-300 ${isZooming ? "scale-150" : "scale-100"
                            }`}
                        style={isZooming ? {
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                        } : undefined}
                    />
                    {discountPercent > 0 && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                            -{discountPercent}%
                        </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/80 rounded-full p-3">
                            <ZoomIn className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Main Image - Mobile Carousel */}
                <div className="md:hidden relative">
                    <div className="overflow-hidden rounded-xl" ref={emblaRef}>
                        <div className="flex">
                            {images.map((image, index) => (
                                <div key={index} className="flex-[0_0_100%] min-w-0">
                                    <div className="aspect-square relative" onClick={() => setIsLightboxOpen(true)}>
                                        <img
                                            src={image}
                                            alt={`${productName} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {discountPercent > 0 && index === 0 && (
                                            <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                                                -{discountPercent}%
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all ${index === selectedIndex ? "bg-primary w-4" : "bg-white/70"
                                    }`}
                                onClick={() => handleThumbnailClick(index)}
                                aria-label={`Xem ảnh ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Thumbnail Gallery - Desktop */}
                {images.length > 1 && (
                    <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${index === selectedIndex
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-gray-300"
                                    }`}
                                onClick={() => handleThumbnailClick(index)}
                            >
                                <img
                                    src={image}
                                    alt={`${productName} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/30 rounded-full p-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
                        }}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </button>

                    <img
                        src={images[selectedIndex]}
                        alt={productName}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/30 rounded-full p-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex((prev) => (prev + 1) % images.length);
                        }}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </button>

                    {/* Lightbox Thumbnails */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition ${index === selectedIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndex(index);
                                }}
                            >
                                <img src={image} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

// ==================== Variant Selector Component ====================
interface VariantSelectorProps {
    variants: Variant[];
    selectedVariant: Variant | undefined;
    onSelectVariant: (variant: Variant) => void;
}

function VariantSelector({ variants, selectedVariant, onSelectVariant }: VariantSelectorProps) {
    if (variants.length <= 1) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="font-medium">Quy cách:</p>
                {selectedVariant && (
                    <span className="text-sm text-muted-foreground">SKU: {selectedVariant.sku}</span>
                )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn quy cách sản phẩm">
                {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isOutOfStock = variant.stockQuantity === 0;

                    return (
                        <button
                            key={variant.id}
                            onClick={() => !isOutOfStock && onSelectVariant(variant)}
                            disabled={isOutOfStock}
                            aria-pressed={isSelected}
                            aria-label={`${variant.sku}${isOutOfStock ? ", hết hàng" : isSelected ? ", đã chọn" : ""}`}
                            className={`relative px-4 py-2 rounded-lg border-2 font-medium transition-all ${isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : isOutOfStock
                                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                        >
                            <span className={isOutOfStock ? "line-through" : ""}>
                                {variant.sku}
                            </span>
                            {isOutOfStock && (
                                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    Hết
                                </span>
                            )}
                            {isSelected && !isOutOfStock && (
                                <Check className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white rounded-full p-0.5" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ==================== Quantity Selector Component ====================
interface QuantitySelectorProps {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    maxQuantity: number;
}

function QuantitySelector({ quantity, onQuantityChange, maxQuantity }: QuantitySelectorProps) {
    const canDecrease = quantity > 1;
    const canIncrease = quantity < maxQuantity && maxQuantity > 0;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="font-medium">Số lượng:</p>
                <span className="text-sm text-muted-foreground">
                    {maxQuantity > 0 ? `${maxQuantity} sản phẩm có sẵn` : "Hết hàng"}
                </span>
            </div>
            <div className="flex items-center gap-4" role="group" aria-label="Chọn số lượng">
                <div className="flex items-center border rounded-lg overflow-hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuantityChange(quantity - 1)}
                        disabled={!canDecrease}
                        aria-label="Giảm số lượng"
                        className="rounded-none border-r"
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            onQuantityChange(Math.max(1, Math.min(maxQuantity, val)));
                        }}
                        className="w-16 text-center font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={1}
                        max={maxQuantity}
                        aria-label="Số lượng"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuantityChange(quantity + 1)}
                        disabled={!canIncrease}
                        aria-label="Tăng số lượng"
                        className="rounded-none border-l"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ==================== Price Display Component ====================
interface PriceDisplayProps {
    price: number;
    salePrice: number | null;
}

function PriceDisplay({ price, salePrice }: PriceDisplayProps) {
    const hasDiscount = salePrice && salePrice < price;
    const discountPercent = hasDiscount ? Math.round((1 - salePrice / price) * 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-primary">
                    {formatPrice(salePrice || price)}
                </span>
                {hasDiscount && (
                    <>
                        <span className="text-xl text-muted-foreground line-through">
                            {formatPrice(price)}
                        </span>
                        <Badge variant="destructive" className="text-sm">
                            -{discountPercent}%
                        </Badge>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== Action Buttons Component ====================
interface ActionButtonsProps {
    loading: boolean;
    success: boolean;
    disabled: boolean;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onWishlist: () => void;
    onShare: () => void;
}

function ActionButtons({ loading, success, disabled, onAddToCart, onBuyNow, onWishlist, onShare }: ActionButtonsProps) {
    return (
        <div className="space-y-3">
            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    size="lg"
                    className="flex-1 h-12"
                    onClick={onAddToCart}
                    disabled={loading || disabled}
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : success ? (
                        <Check className="h-5 w-5 mr-2" />
                    ) : (
                        <ShoppingCart className="h-5 w-5 mr-2" />
                    )}
                    {success ? "Đã thêm!" : "Thêm vào giỏ hàng"}
                </Button>
                <Button
                    size="lg"
                    variant="secondary"
                    className="flex-1 h-12"
                    onClick={onBuyNow}
                    disabled={disabled}
                >
                    ⚡ Mua ngay
                </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onWishlist} className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Yêu thích</span>
                </Button>
                <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Chia sẻ</span>
                </Button>
            </div>
        </div>
    );
}

// ==================== Main Component ====================
export function ProductDetailClient({ productId, productName, variants, defaultVariantId, images }: ProductDetailClientProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
        variants.find(v => v.id === defaultVariantId) || variants[0]
    );
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Calculate discount
    const price = selectedVariant?.price || 0;
    const salePrice = selectedVariant?.salePrice || null;
    const hasDiscount = salePrice && salePrice < price;
    const discountPercent = hasDiscount ? Math.round((1 - salePrice / price) * 100) : 0;

    // Reset quantity when variant changes
    useEffect(() => {
        setQuantity(1);
    }, [selectedVariant?.id]);

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    variantId: selectedVariant.id,
                    quantity
                })
            });

            if (res.ok) {
                setSuccess(true);
                toast.success("Đã thêm vào giỏ hàng!", {
                    description: `${productName} x${quantity}`,
                    action: {
                        label: "Xem giỏ",
                        onClick: () => window.location.href = "/gio-hang"
                    }
                });
                // Reset success state after 2 seconds
                setTimeout(() => setSuccess(false), 2000);
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
            setLoading(false);
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        window.location.href = "/gio-hang";
    };

    const handleWishlist = () => {
        toast.success("Đã thêm vào danh sách yêu thích!");
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: productName,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Đã sao chép liên kết!");
            }
        } catch {
            // User cancelled share
        }
    };

    const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity === 0;

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <ImageGallery
                images={images}
                productName={productName}
                discountPercent={discountPercent}
            />

            {/* Right: Product Info */}
            <div className="space-y-6">
                {/* Price */}
                <PriceDisplay price={price} salePrice={salePrice} />

                {/* Stock Status */}
                <div className={`flex items-center gap-2 ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
                    {isOutOfStock ? (
                        <>
                            <X className="h-4 w-4" />
                            <span className="font-medium">Hết hàng</span>
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Còn hàng</span>
                        </>
                    )}
                </div>

                {/* Variant Selection */}
                <VariantSelector
                    variants={variants}
                    selectedVariant={selectedVariant}
                    onSelectVariant={setSelectedVariant}
                />

                {/* Quantity */}
                <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    maxQuantity={selectedVariant?.stockQuantity || 0}
                />

                {/* Action Buttons */}
                <ActionButtons
                    loading={loading}
                    success={success}
                    disabled={isOutOfStock}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onWishlist={handleWishlist}
                    onShare={handleShare}
                />
            </div>
        </div>
    );
}

// ==================== Sticky Bottom Bar (Mobile) ====================
interface StickyBottomBarProps {
    price: number;
    salePrice: number | null;
    disabled: boolean;
    onAddToCart: () => void;
}

export function StickyBottomBar({ price, salePrice, disabled, onAddToCart }: StickyBottomBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 400px
            setIsVisible(window.scrollY > 400);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <Button variant="outline" size="icon" className="shrink-0">
                    <Heart className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <p className="text-lg font-bold text-primary">
                        {formatPrice(salePrice || price)}
                    </p>
                    {salePrice && salePrice < price && (
                        <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(price)}
                        </p>
                    )}
                </div>
                <Button
                    className="shrink-0"
                    onClick={onAddToCart}
                    disabled={disabled}
                >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Thêm giỏ hàng
                </Button>
            </div>
        </div>
    );
}

// ==================== Suggested Products Grid ====================
interface SuggestedProduct {
    id: string;
    name: string;
    slug: string;
    images: unknown;
    variants: {
        price: number;
        salePrice: number | null;
        isDefault: boolean;
    }[];
}

interface SuggestedProductsGridProps {
    initialProducts: SuggestedProduct[];
    excludeCategoryId: string | null;
    currentProductId: string;
}

export function SuggestedProductsGrid({ initialProducts, excludeCategoryId, currentProductId }: SuggestedProductsGridProps) {
    const [products, setProducts] = useState<SuggestedProduct[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page + 1),
                limit: "6",
                exclude: currentProductId,
            });
            if (excludeCategoryId) {
                params.set("excludeCategory", excludeCategoryId);
            }

            const res = await fetch(`/api/products/suggestions?${params}`);
            if (!res.ok) throw new Error("Failed to load");

            const data = await res.json();
            const newProducts = data.products || [];

            if (newProducts.length === 0) {
                setHasMore(false);
            } else {
                setProducts([...products, ...newProducts]);
                setPage(page + 1);
                if (newProducts.length < 6) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Load more error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">💡 Có thể bạn cũng thích</h2>

                {/* Product Grid - 6 columns desktop, 3 tablet, 2 mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {products.map((product) => {
                        const images = Array.isArray(product.images) ? product.images as string[] : [];
                        const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
                        const price = defaultVariant?.price || 0;
                        const salePrice = defaultVariant?.salePrice;
                        const hasDiscount = salePrice && salePrice < price;

                        return (
                            <a
                                key={product.id}
                                href={`/san-pham/${product.slug}`}
                                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                            >
                                {/* Image */}
                                <div className="aspect-square overflow-hidden relative">
                                    {images[0] ? (
                                        <img
                                            src={images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                                    )}
                                    {hasDiscount && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                            -{Math.round((1 - salePrice / price) * 100)}%
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition mb-2">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="text-primary font-bold">
                                            {formatPrice(salePrice || price)}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-xs text-muted-foreground line-through">
                                                {formatPrice(price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="flex justify-center mt-8">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={loadMore}
                            disabled={loading}
                            className="min-w-[200px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tải...
                                </>
                            ) : (
                                "Xem thêm"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
