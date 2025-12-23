import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
    Truck,
    Shield,
    RotateCcw,
    Star,
    ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getProductBySlug } from "@/lib/cache";
import prisma from "@/lib/prisma";
import { ProductDetailClient, StickyBottomBar, SuggestedProductsGrid } from "./client";
import { ProductCarousel } from "@/components/client/ProductCarousel";

interface PageProps {
    params: Promise<{ slug: string }>;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

// Get related products by category
async function getRelatedProducts(categoryId: string | null, currentProductId: string, limit: number = 8) {
    if (!categoryId) return [];

    const products = await prisma.product.findMany({
        where: {
            categoryId,
            id: { not: currentProductId },
            status: "active",
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            variants: {
                where: { isDefault: true },
                take: 1,
                select: {
                    price: true,
                    salePrice: true,
                    isDefault: true
                }
            }
        },
        take: limit
    });

    // Convert Decimal to number for ProductCarousel compatibility
    return products.map(p => ({
        ...p,
        variants: p.variants.map(v => ({
            ...v,
            price: Number(v.price),
            salePrice: v.salePrice ? Number(v.salePrice) : null
        }))
    }));
}

// Get suggested products (from other categories - "Có thể bạn cũng thích")
async function getSuggestedProducts(excludeCategoryId: string | null, currentProductId: string, limit: number = 6) {
    const products = await prisma.product.findMany({
        where: {
            id: { not: currentProductId },
            categoryId: excludeCategoryId ? { not: excludeCategoryId } : undefined,
            status: "active",
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            variants: {
                where: { isDefault: true },
                take: 1,
                select: {
                    price: true,
                    salePrice: true,
                    isDefault: true
                }
            }
        },
        take: limit * 2 // Get more to shuffle
    });

    // Shuffle and take limit
    const shuffled = products.sort(() => Math.random() - 0.5).slice(0, limit);

    return shuffled.map(p => ({
        ...p,
        variants: p.variants.map(v => ({
            ...v,
            price: Number(v.price),
            salePrice: v.salePrice ? Number(v.salePrice) : null
        }))
    }));
}



// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        return {
            title: "Sản phẩm không tìm thấy",
        };
    }

    const images = Array.isArray(product.images) ? product.images as string[] : [];
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    const price = defaultVariant?.salePrice || defaultVariant?.price || 0;

    // Use SEO fields with fallback to product fields
    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.shortDescription || `Mua ${product.name} chính hãng với giá ${formatPrice(price)}`;

    return {
        title: `${title} | Cửa hàng`,
        description,
        openGraph: {
            title: product.name,
            description: product.shortDescription || undefined,
            type: "website",
            images: images[0] ? [{ url: images[0] }] : undefined,
        },
    };
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch product from cache
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    // Parallel data fetching
    const [relatedProducts, suggestedProducts] = await Promise.all([
        getRelatedProducts(product.category?.id || null, product.id),
        getSuggestedProducts(product.category?.id || null, product.id),
    ]);

    // Get default variant
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    const price = defaultVariant?.price || 0;
    const salePrice = defaultVariant?.salePrice;
    const hasDiscount = salePrice && salePrice < price;
    const discountPercent = hasDiscount ? Math.round((1 - salePrice / price) * 100) : 0;

    // Get product images
    const images = Array.isArray(product.images) ? product.images as string[] : [];

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: images,
        description: product.shortDescription || product.description,
        sku: defaultVariant?.sku,
        brand: {
            "@type": "Brand",
            name: "HealthCare Store"
        },
        offers: {
            "@type": "Offer",
            url: `https://yoursite.com/san-pham/${slug}`,
            priceCurrency: "VND",
            price: salePrice || price,
            availability: defaultVariant?.stockQuantity && defaultVariant.stockQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition"
        }
    };

    return (
        <>
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="py-8">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-primary transition">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/san-pham" className="hover:text-primary transition">
                            Cửa hàng
                        </Link>
                        {product.category && (
                            <>
                                <ChevronRight className="h-4 w-4" />
                                <Link
                                    href={`/san-pham?category=${product.category.id}`}
                                    className="hover:text-primary transition"
                                >
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">
                            {product.name}
                        </span>
                    </nav>

                    {/* Product Header */}
                    <div className="mb-8">
                        {product.category && (
                            <Badge variant="secondary" className="mb-3">
                                {product.category.name}
                            </Badge>
                        )}
                        <h1 className="text-2xl lg:text-3xl font-bold mb-4">
                            {product.name}
                        </h1>
                        {product.shortDescription && (
                            <p className="text-muted-foreground text-lg">
                                {product.shortDescription}
                            </p>
                        )}
                    </div>

                    {/* Main Product Section with Image Gallery & Info */}
                    <div className="mb-12">
                        <ProductDetailClient
                            productId={product.id}
                            productName={product.name}
                            variants={product.variants}
                            defaultVariantId={defaultVariant?.id}
                            images={images}
                        />
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 p-6 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Truck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Giao hàng miễn phí</p>
                                <p className="text-sm text-muted-foreground">Đơn hàng từ 300k</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Hàng chính hãng</p>
                                <p className="text-sm text-muted-foreground">100% sản phẩm chính hãng</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <RotateCcw className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Đổi trả dễ dàng</p>
                                <p className="text-sm text-muted-foreground">Trong vòng 7 ngày</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Desktop */}
                    <div className="hidden md:block mb-12">
                        <Tabs defaultValue="description">
                            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
                                <TabsTrigger
                                    value="description"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                                >
                                    Mô tả sản phẩm
                                </TabsTrigger>
                                <TabsTrigger
                                    value="specs"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                                >
                                    Thông số kỹ thuật
                                </TabsTrigger>
                                <TabsTrigger
                                    value="reviews"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                                >
                                    Đánh giá
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="pt-6">
                                <div
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: product.description || "<p>Chưa có mô tả chi tiết cho sản phẩm này.</p>" }}
                                />
                            </TabsContent>
                            <TabsContent value="specs" className="pt-6">
                                <div className="max-w-2xl">
                                    <table className="w-full">
                                        <tbody className="divide-y">
                                            <tr>
                                                <td className="py-3 text-muted-foreground w-1/3">SKU</td>
                                                <td className="py-3 font-medium">{defaultVariant?.sku || "N/A"}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 text-muted-foreground">Danh mục</td>
                                                <td className="py-3 font-medium">{product.category?.name || "Chưa phân loại"}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 text-muted-foreground">Tình trạng</td>
                                                <td className="py-3">
                                                    {defaultVariant?.stockQuantity && defaultVariant.stockQuantity > 0 ? (
                                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                                            Còn hàng
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-red-600 border-red-600">
                                                            Hết hàng
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                            {product.variants.length > 1 && (
                                                <tr>
                                                    <td className="py-3 text-muted-foreground">Biến thể</td>
                                                    <td className="py-3 font-medium">{product.variants.length} loại</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                            <TabsContent value="reviews" className="pt-6">
                                <div className="text-center py-12 text-muted-foreground">
                                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-lg font-medium mb-2">Chưa có đánh giá nào</p>
                                    <p>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Accordion - Mobile */}
                    <div className="md:hidden mb-12">
                        <Accordion type="single" collapsible defaultValue="description">
                            <AccordionItem value="description">
                                <AccordionTrigger className="text-lg font-semibold">
                                    Mô tả sản phẩm
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: product.description || "<p>Chưa có mô tả chi tiết cho sản phẩm này.</p>" }}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="specs">
                                <AccordionTrigger className="text-lg font-semibold">
                                    Thông số kỹ thuật
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">SKU</span>
                                            <span className="font-medium">{defaultVariant?.sku || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Danh mục</span>
                                            <span className="font-medium">{product.category?.name || "Chưa phân loại"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Tình trạng</span>
                                            <span className="font-medium">
                                                {defaultVariant?.stockQuantity && defaultVariant.stockQuantity > 0 ? "Còn hàng" : "Hết hàng"}
                                            </span>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="reviews">
                                <AccordionTrigger className="text-lg font-semibold">
                                    Đánh giá
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-muted-foreground text-center py-6">
                                        Chưa có đánh giá nào cho sản phẩm này.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <Separator className="mb-12" />

                    {/* Related Products Carousel */}
                    {relatedProducts.length > 0 && (
                        <section className="mb-12">
                            <ProductCarousel
                                products={relatedProducts}
                                title="🔥 Sản phẩm liên quan"
                                viewAllLink={`/san-pham?category=${product.category?.id}`}
                            />
                        </section>
                    )}
                </div>
            </div>

            {/* Suggested Products - "Có thể bạn cũng thích" - Full width at bottom */}
            <SuggestedProductsGrid
                initialProducts={suggestedProducts}
                excludeCategoryId={product.category?.id || null}
                currentProductId={product.id}
            />
        </>
    );
}
