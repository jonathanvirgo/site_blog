import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Clock, Eye, Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getArticleBySlug, getFeaturedArticles } from "@/lib/cache";
import prisma from "@/lib/prisma";
import { FeaturedCarousel } from "@/components/article/FeaturedCarousel";
import { InfiniteScrollArticles } from "@/components/article/InfiniteScrollArticles";

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Calculate read time based on content length
function calculateReadTime(content: string | null): string {
    if (!content) return "1 phút";
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} phút`;
}

// Format date
function formatDate(date: Date | null): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// Get articles from same category
async function getSameCategoryArticles(categoryId: string | null, currentArticleId: string, limit: number = 8) {
    if (!categoryId) return [];

    return prisma.article.findMany({
        where: {
            categoryId,
            id: { not: currentArticleId },
            status: "published",
            deletedAt: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
        },
        orderBy: { publishedAt: "desc" },
        take: limit
    });
}

// Get notable articles
async function getNotableArticles(currentArticleId: string, limit: number = 5) {
    return prisma.article.findMany({
        where: {
            isNotable: true,
            id: { not: currentArticleId },
            status: "published",
            deletedAt: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
        },
        orderBy: { publishedAt: "desc" },
        take: limit
    });
}

// Get personalized/random articles
async function getPersonalizedArticles(currentArticleId: string, categoryId: string | null, limit: number = 4) {
    return prisma.article.findMany({
        where: {
            id: { not: currentArticleId },
            categoryId: categoryId ? { not: categoryId } : undefined,
            status: "published",
            deletedAt: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            category: {
                select: { name: true, slug: true }
            }
        },
        orderBy: { viewCount: "desc" },
        take: limit
    });
}

// Get related products for sidebar
async function getRelatedProducts(categoryId: string | null, limit: number = 3) {
    return prisma.product.findMany({
        where: {
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            variants: {
                where: { isDefault: true },
                select: {
                    price: true,
                    salePrice: true
                },
                take: 1
            }
        },
        orderBy: { createdAt: "desc" },
        take: limit
    });
}

// Increment view count
async function incrementViewCount(articleId: string) {
    try {
        await prisma.article.update({
            where: { id: articleId },
            data: { viewCount: { increment: 1 } }
        });
    } catch (error) {
        console.error("Failed to increment view count:", error);
    }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return {
            title: "Bài viết không tìm thấy",
        };
    }

    const title = article.metaTitle || article.title;
    const description = article.metaDescription || article.excerpt || undefined;

    return {
        title: `${title} | HealthNews`,
        description,
        openGraph: {
            title: article.title,
            description: article.excerpt || undefined,
            type: "article",
            images: article.featuredImage ? [{ url: article.featuredImage }] : undefined,
            publishedTime: article.publishedAt?.toISOString(),
            authors: article.author?.fullName ? [article.author.fullName] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.excerpt || undefined,
            images: article.featuredImage ? [article.featuredImage] : undefined,
        },
    };
}

export default async function ArticleDetailPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch article from cache
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    // Increment view count (fire and forget)
    incrementViewCount(article.id);

    // Parallel data fetching
    const [
        sameCategoryArticles,
        featuredArticles,
        notableArticles,
        personalizedArticles,
        relatedProducts
    ] = await Promise.all([
        getSameCategoryArticles(article.category?.id || null, article.id, 8),
        getFeaturedArticles(8),
        getNotableArticles(article.id, 5),
        getPersonalizedArticles(article.id, article.category?.id || null, 4),
        getRelatedProducts(article.category?.id || null, 3)
    ]);

    // Filter out current article from featured
    const filteredFeatured = featuredArticles.filter(a => a.id !== article.id).slice(0, 6);

    // Collect all shown article IDs for infinite scroll exclusion
    const shownArticleIds = [
        article.id,
        ...sameCategoryArticles.map(a => a.id),
        ...filteredFeatured.map(a => a.id),
        ...notableArticles.map(a => a.id),
        ...personalizedArticles.map(a => a.id)
    ];

    const readTime = calculateReadTime(article.content);

    // Format product price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(price);
    };

    return (
        <article className="py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link href="/" className="hover:text-primary transition-colors">
                        Trang chủ
                    </Link>
                    <span>›</span>
                    {article.category && (
                        <>
                            <Link
                                href={`/chuyen-muc/${article.category.slug}`}
                                className="hover:text-primary transition-colors"
                            >
                                {article.category.name}
                            </Link>
                            <span>›</span>
                        </>
                    )}
                    <span className="text-foreground line-clamp-1">{article.title}</span>
                </nav>

                {/* Main Content + Sidebar */}
                <div className="flex gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="flex-1 max-w-[720px]">
                        {/* Header */}
                        <header className="mb-8">
                            {article.category && (
                                <Link href={`/chuyen-muc/${article.category.slug}`}>
                                    <Badge className="mb-4 hover:bg-primary/90">{article.category.name}</Badge>
                                </Link>
                            )}
                            <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                                {article.title}
                            </h1>
                            {article.excerpt && (
                                <p className="text-xl text-muted-foreground mb-6">
                                    {article.excerpt}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="font-semibold text-primary">
                                            {article.author?.fullName?.charAt(0) || "A"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {article.author?.fullName || "Tác giả"}
                                        </p>
                                        <p className="text-xs">{formatDate(article.publishedAt)}</p>
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="h-8 hidden sm:block" />
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {readTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        {article.viewCount.toLocaleString()} lượt xem
                                    </span>
                                </div>
                            </div>
                        </header>

                        {/* Featured Image */}
                        {article.featuredImage ? (
                            <figure className="mb-8">
                                <div className="aspect-video rounded-xl overflow-hidden">
                                    <img
                                        src={article.featuredImage}
                                        alt={article.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </figure>
                        ) : (
                            <div className="aspect-video rounded-xl bg-muted mb-8" />
                        )}

                        {/* Content */}
                        <div
                            className="prose prose-lg max-w-none mb-8 
                                       prose-headings:font-bold prose-headings:text-foreground
                                       prose-p:text-foreground/90 prose-p:leading-relaxed
                                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                       prose-img:rounded-lg"
                            dangerouslySetInnerHTML={{ __html: article.content || "" }}
                        />

                        {/* Social Share & Tags */}
                        <div className="p-6 bg-muted/30 rounded-xl mb-8">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="font-medium">Chia sẻ:</span>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Facebook className="h-4 w-4" />
                                    Facebook
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Twitter className="h-4 w-4" />
                                    Twitter
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    Copy Link
                                </Button>
                            </div>

                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Tags:</span>
                                    {article.tags.map((tag) => (
                                        <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                                            <Badge variant="secondary" className="hover:bg-secondary/80">
                                                #{tag.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Author Bio */}
                        {article.author && (
                            <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                                        <span className="font-bold text-2xl text-primary">
                                            {article.author.fullName?.charAt(0) || "A"}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {article.author.fullName || "Tác giả"}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-2">
                                            Tác giả tại HealthNews
                                        </p>
                                        <Button variant="link" className="p-0 h-auto text-primary">
                                            Xem tất cả bài viết →
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Sidebar */}
                    <aside className="hidden lg:block w-[300px] flex-shrink-0">
                        <div className="sticky top-20 space-y-6">
                            {/* Related Products */}
                            {relatedProducts.length > 0 && (
                                <div className="bg-white rounded-xl border p-4">
                                    <h3 className="font-bold mb-4">Sản phẩm liên quan</h3>
                                    <div className="space-y-4">
                                        {relatedProducts.map((product) => {
                                            const images = product.images as string[] | null;
                                            const defaultVariant = product.variants[0];
                                            const price = Number(defaultVariant?.salePrice || defaultVariant?.price) || 0;

                                            return (
                                                <Link
                                                    key={product.id}
                                                    href={`/san-pham/${product.slug}`}
                                                    className="flex gap-3 group"
                                                >
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                                        {images && images[0] ? (
                                                            <img
                                                                src={images[0]}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-muted" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-primary font-semibold text-sm mt-1">
                                                            {formatPrice(price)}
                                                        </p>
                                                        <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                                                            Xem nhanh
                                                        </Button>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Newsletter */}
                            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                                <h3 className="font-semibold mb-2">📬 Đăng ký nhận tin</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Nhận bài viết mới nhất qua email
                                </p>
                                <input
                                    type="email"
                                    placeholder="Email của bạn"
                                    className="w-full p-2 rounded-lg border mb-2 text-sm"
                                />
                                <Button className="w-full" size="sm">Đăng ký</Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Full Width Sections */}
            <div className="mt-12">
                {/* Section: Tin cùng chuyên mục */}
                {sameCategoryArticles.length > 0 && (
                    <section className="py-10 bg-[#F8FAFC]">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span>📂</span>
                                Tin cùng chuyên mục
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {sameCategoryArticles.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/bai-viet/${item.slug}`}
                                        className="group"
                                    >
                                        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                                            {item.featuredImage ? (
                                                <img
                                                    src={item.featuredImage}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                                            )}
                                        </div>
                                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Section: Tin nổi bật (Carousel) */}
                {filteredFeatured.length > 0 && (
                    <div className="container mx-auto px-4">
                        <FeaturedCarousel
                            articles={filteredFeatured.map(a => ({
                                ...a,
                                category: a.category ? { ...a.category, slug: a.category.slug } : null
                            }))}
                        />
                    </div>
                )}

                {/* Section: Đáng chú ý (Masonry) */}
                {notableArticles.length > 0 && (
                    <section className="py-10 bg-[#FFF7ED]">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span>⭐</span>
                                Đáng chú ý
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                {/* Large Featured Article */}
                                {notableArticles[0] && (
                                    <Link
                                        href={`/bai-viet/${notableArticles[0].slug}`}
                                        className="md:col-span-2 md:row-span-2 group"
                                    >
                                        <div className="relative h-full min-h-[300px] md:min-h-[400px] rounded-xl overflow-hidden">
                                            {notableArticles[0].featuredImage ? (
                                                <img
                                                    src={notableArticles[0].featuredImage}
                                                    alt={notableArticles[0].title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-100" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary-foreground/90 transition-colors">
                                                    {notableArticles[0].title}
                                                </h3>
                                                {notableArticles[0].excerpt && (
                                                    <p className="text-white/80 line-clamp-2 text-sm md:text-base">
                                                        {notableArticles[0].excerpt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {/* Small Articles */}
                                {notableArticles.slice(1).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/bai-viet/${item.slug}`}
                                        className="group"
                                    >
                                        <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                                            {item.featuredImage ? (
                                                <img
                                                    src={item.featuredImage}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50" />
                                            )}
                                        </div>
                                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Section: Dành riêng cho bạn */}
                {personalizedArticles.length > 0 && (
                    <section className="py-10 bg-[#F0FDF4]">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <span>💡</span>
                                Dành riêng cho bạn
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Đề xuất dựa trên sở thích của bạn
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                {personalizedArticles.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/bai-viet/${item.slug}`}
                                        className="group"
                                    >
                                        <div className="aspect-video rounded-lg overflow-hidden mb-3">
                                            {item.featuredImage ? (
                                                <img
                                                    src={item.featuredImage}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50" />
                                            )}
                                        </div>
                                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm md:text-base">
                                            {item.title}
                                        </h3>
                                        {item.category && (
                                            <span className="text-xs text-muted-foreground mt-1 block">
                                                {item.category.name}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Section: Đừng bỏ lỡ (Infinite Scroll) */}
                <section className="py-10">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span>🚀</span>
                            Đừng bỏ lỡ
                        </h2>
                        <InfiniteScrollArticles excludeIds={shownArticleIds} />
                    </div>
                </section>
            </div>
        </article>
    );
}
