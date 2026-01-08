import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Format date as relative time
function formatRelativeTime(date: Date | null): string {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Calculate read time
function calculateReadTime(content: string | null): string {
    if (!content) return "1 phút";
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} phút đọc`;
}

// Fetch category with articles
async function getCategoryWithArticles(slug: string) {
    const category = await prisma.articleCategory.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            metaTitle: true,
            metaDescription: true,
            parentId: true,
            parent: {
                select: {
                    name: true,
                    slug: true
                }
            }
        }
    });

    if (!category) return null;

    // Count articles in this category
    const articleCount = await prisma.article.count({
        where: {
            categoryId: category.id,
            status: "published",
            deletedAt: null
        }
    });

    // Get subcategories if this is a parent category
    const subcategories = await prisma.articleCategory.findMany({
        where: { parentId: category.id },
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            _count: {
                select: {
                    articles: {
                        where: {
                            status: "published",
                            deletedAt: null
                        }
                    }
                }
            }
        }
    });

    // Get articles in this category
    const articles = await prisma.article.findMany({
        where: {
            categoryId: category.id,
            status: "published",
            deletedAt: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
            content: true,
            publishedAt: true,
            isFeatured: true,
            category: {
                select: {
                    name: true,
                    slug: true
                }
            }
        },
        orderBy: [
            { isFeatured: "desc" },
            { publishedAt: "desc" }
        ],
        take: 30
    });

    // Get articles for each subcategory (for subcategory boxes)
    const subcategoryArticles = await Promise.all(
        subcategories.map(async (sub) => {
            const subArticles = await prisma.article.findMany({
                where: {
                    categoryId: sub.id,
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
                take: 4
            });
            return {
                subcategory: {
                    id: sub.id,
                    name: sub.name,
                    slug: sub.slug,
                    image: sub.image,
                    count: sub._count.articles
                },
                articles: subArticles
            };
        })
    );

    return {
        category: {
            ...category,
            articleCount
        },
        subcategories: subcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            image: sub.image,
            count: sub._count.articles
        })),
        articles,
        subcategoryArticles
    };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const category = await prisma.articleCategory.findUnique({
        where: { slug },
        select: {
            name: true,
            description: true,
            metaTitle: true,
            metaDescription: true,
            image: true,
        }
    });

    if (!category) {
        return {
            title: "Chuyên mục không tìm thấy",
        };
    }

    const title = category.metaTitle || category.name;
    const description = category.metaDescription || category.description || undefined;

    return {
        title: `${title} - Tin tức & Bài viết | HealthNews`,
        description,
        openGraph: {
            title: category.name,
            description: category.description || undefined,
            type: "website",
            images: category.image ? [{ url: category.image }] : undefined,
        },
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;

    const data = await getCategoryWithArticles(slug);

    if (!data) {
        notFound();
    }

    const { category, subcategories, articles, subcategoryArticles } = data;

    // Section 1: Featured Content Grid
    const heroArticle = articles.find(a => a.isFeatured) || articles[0];
    const usedIds = new Set<string>();
    if (heroArticle) usedIds.add(heroArticle.id);

    const subFeatureArticles = articles.filter(a => a.id !== heroArticle?.id).slice(0, 2);
    subFeatureArticles.forEach(a => usedIds.add(a.id));

    const sidebarArticles = articles.filter(a => !usedIds.has(a.id)).slice(0, 4);
    sidebarArticles.forEach(a => usedIds.add(a.id));

    // Section 2: Main Feed - Latest articles
    const mainFeedArticles = articles.filter(a => !usedIds.has(a.id));

    const hasSubcategories = subcategoryArticles.length > 0 && subcategoryArticles.some(s => s.articles.length > 0);

    return (
        <>
            {/* SECTION 1: Featured Content Grid */}
            <section className="py-8 md:py-12">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        {category.parent && (
                            <>
                                <Link href={`/chuyen-muc/${category.parent.slug}`} className="hover:text-primary transition-colors">
                                    {category.parent.name}
                                </Link>
                                <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                        <span className="text-foreground font-medium">{category.name}</span>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6">
                        {/* Main Content - 8 cols */}
                        <div className="lg:col-span-8 space-y-4">
                            {/* Hero Article */}
                            {heroArticle ? (
                                <Link href={`/bai-viet/${heroArticle.slug}`}>
                                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group shadow-lg">
                                        {heroArticle.featuredImage ? (
                                            <img
                                                src={heroArticle.featuredImage}
                                                alt={heroArticle.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-cyan-500/80" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        {heroArticle.isFeatured && (
                                            <Badge className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg border-0">
                                                <Star className="h-3 w-3 mr-1" />
                                                Nổi bật
                                            </Badge>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                                                {heroArticle.title}
                                            </h1>
                                            <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4">
                                                {heroArticle.excerpt}
                                            </p>
                                            <Button size="lg" className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg">
                                                Đọc tiếp
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                                    <p className="text-muted-foreground">Chưa có bài viết nổi bật</p>
                                </div>
                            )}

                            {/* Sub-features - 2 columns */}
                            {subFeatureArticles.length > 0 && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {subFeatureArticles.map((article) => (
                                        <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                            <div className="group rounded-xl overflow-hidden border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all card-interactive">
                                                <div className="aspect-[16/9] overflow-hidden">
                                                    {article.featuredImage ? (
                                                        <img
                                                            src={article.featuredImage}
                                                            alt={article.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                        {article.title}
                                                    </h3>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar - 4 cols */}
                        <div className="lg:col-span-4 space-y-4">
                            {/* Featured Sidebar Article (first article as large card) */}
                            {sidebarArticles[0] && (
                                <Link href={`/bai-viet/${sidebarArticles[0].slug}`}>
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden group shadow-md">
                                        {sidebarArticles[0].featuredImage ? (
                                            <img
                                                src={sidebarArticles[0].featuredImage}
                                                alt={sidebarArticles[0].title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-cyan-500/80" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                            {sidebarArticles[0].category && (
                                                <Badge className="mb-2 bg-primary/90 border-0">{sidebarArticles[0].category.name}</Badge>
                                            )}
                                            <h3 className="font-semibold line-clamp-2 group-hover:text-cyan-300 transition-colors">
                                                {sidebarArticles[0].title}
                                            </h3>
                                            {sidebarArticles[0].excerpt && (
                                                <p className="text-sm text-white/80 line-clamp-2 mt-1">
                                                    {sidebarArticles[0].excerpt}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Sidebar Articles - small cards (remaining 3 articles) */}
                            <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3 shadow-sm">
                                {sidebarArticles.slice(1).map((article) => (
                                    <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                        <div className="flex gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                                {article.featuredImage ? (
                                                    <img
                                                        src={article.featuredImage}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                                                )}
                                            </div>
                                            <h4 className="text-sm font-medium line-clamp-3 group-hover:text-primary transition-colors">
                                                {article.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Main Feed (2-Column Layout) */}
            <section className="py-12 section-alt">
                <div className="container mx-auto px-4">
                    <div className={`grid ${hasSubcategories ? 'lg:grid-cols-2' : ''} gap-8`}>
                        {/* Left: Bài viết mới nhất */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 uppercase flex items-center gap-3">
                                <span className="w-1 h-6 bg-gradient-to-b from-primary to-cyan-500 rounded-full"></span>
                                Bài viết mới nhất
                            </h2>
                            <div className="space-y-6">
                                {mainFeedArticles.length > 0 ? (
                                    mainFeedArticles.map((article) => (
                                        <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                            <div className="flex gap-4 group">
                                                {/* Image */}
                                                <div className="w-[240px] h-[160px] flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                                                    {article.featuredImage ? (
                                                        <img
                                                            src={article.featuredImage}
                                                            alt={article.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                                                    )}
                                                </div>
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {article.category && (
                                                        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-0">
                                                            {article.category.name}
                                                        </Badge>
                                                    )}
                                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                                        {article.excerpt}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(article.publishedAt)} • {calculateReadTime(article.content)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">Chưa có bài viết mới</p>
                                )}

                                {/* Load more button */}
                                {mainFeedArticles.length >= 10 && (
                                    <div className="text-center pt-4">
                                        <button className="px-8 py-3 border border-primary/50 rounded-full font-medium text-primary hover:bg-primary hover:text-white transition-colors">
                                            Xem thêm bài viết
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Subcategory Boxes */}
                        {hasSubcategories && (
                            <div className="space-y-8">
                                {subcategoryArticles.map((subData, index) => {
                                    if (subData.articles.length === 0) return null;
                                    const { subcategory, articles: subArticles } = subData;

                                    // Alternate between Style 1 and Style 2
                                    if (index % 2 === 0) {
                                        // Style 1: Featured + List
                                        return (
                                            <div key={subcategory.id} className="border rounded-lg p-4">
                                                <h3 className="font-bold uppercase border-b pb-2 mb-4 flex items-center justify-between">
                                                    {subcategory.name}
                                                    <Link href={`/chuyen-muc/${subcategory.slug}`} className="text-sm font-normal text-primary hover:underline">
                                                        Xem tất cả
                                                    </Link>
                                                </h3>
                                                <div className="space-y-3">
                                                    {/* Featured article */}
                                                    {subArticles[0] && (
                                                        <Link href={`/bai-viet/${subArticles[0].slug}`}>
                                                            <div className="flex gap-3 group">
                                                                <div className="w-[120px] h-[80px] flex-shrink-0 rounded overflow-hidden">
                                                                    {subArticles[0].featuredImage ? (
                                                                        <img
                                                                            src={subArticles[0].featuredImage}
                                                                            alt={subArticles[0].title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
                                                                        {subArticles[0].title}
                                                                    </h5>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                                        {subArticles[0].excerpt}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    )}
                                                    {/* List items */}
                                                    <ul className="space-y-2 pt-2 border-t">
                                                        {subArticles.slice(1).map((article) => (
                                                            <li key={article.id}>
                                                                <Link href={`/bai-viet/${article.slug}`} className="text-sm hover:text-primary transition flex items-start gap-2">
                                                                    <span className="text-muted-foreground">•</span>
                                                                    <span className="line-clamp-1">{article.title}</span>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Style 2: Grid Layout
                                        return (
                                            <div key={subcategory.id} className="border rounded-lg p-4">
                                                <h3 className="font-bold uppercase border-b pb-2 mb-4 flex items-center justify-between">
                                                    {subcategory.name}
                                                    <Link href={`/chuyen-muc/${subcategory.slug}`} className="text-sm font-normal text-primary hover:underline">
                                                        Xem tất cả
                                                    </Link>
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Big image */}
                                                    {subArticles[0] && (
                                                        <Link href={`/bai-viet/${subArticles[0].slug}`}>
                                                            <div className="group">
                                                                <div className="aspect-square rounded overflow-hidden mb-2">
                                                                    {subArticles[0].featuredImage ? (
                                                                        <img
                                                                            src={subArticles[0].featuredImage}
                                                                            alt={subArticles[0].title}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 group-hover:scale-105 transition" />
                                                                    )}
                                                                </div>
                                                                <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
                                                                    {subArticles[0].title}
                                                                </h5>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                                    {subArticles[0].excerpt}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    )}
                                                    {/* Small items */}
                                                    <div className="space-y-3">
                                                        {subArticles.slice(1).map((article) => (
                                                            <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                                                <div className="flex gap-2 group">
                                                                    <div className="w-[60px] h-[60px] flex-shrink-0 rounded overflow-hidden">
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
                                                                    <h6 className="text-xs font-medium line-clamp-3 group-hover:text-primary transition">
                                                                        {article.title}
                                                                    </h6>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
