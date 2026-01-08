import Link from "next/link";
import { Star, Pill, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeaturedArticlesCarousel } from "@/components/client/FeaturedArticlesCarousel";
import { ProductCarousel } from "@/components/client/ProductCarousel";
import { LatestArticlesFeed } from "@/components/client/LatestArticlesFeed";
import { getHomepageData, CachedArticle, CachedProduct } from "@/lib/cache";
import prisma from "@/lib/prisma";

// Get articles by category for category boxes
async function getCategoryArticles(categorySlug: string, limit: number = 4) {
    const category = await prisma.articleCategory.findUnique({
        where: { slug: categorySlug },
        select: { id: true, name: true, slug: true }
    });

    if (!category) return null;

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
        },
        orderBy: { publishedAt: "desc" },
        take: limit
    });

    return { category, articles };
}

export default async function HomePage() {
    // Fetch all homepage data from cache
    const { featuredArticles, latestArticles, featuredProducts, categories } = await getHomepageData();

    // Get category boxes data (fetch 2 categories with their articles)
    const categoryBoxesData = await Promise.all([
        getCategoryArticles(categories[0]?.slug || "suc-khoe"),
        getCategoryArticles(categories[1]?.slug || "cong-nghe"),
    ]);

    // Prepare data for sections - avoid duplicates
    const usedArticleIds = new Set<string>();

    // Section 1: Hero + Sub-features (from featured articles)
    const heroArticle = featuredArticles[0];
    if (heroArticle) usedArticleIds.add(heroArticle.id);

    const subFeatures = featuredArticles.slice(1, 3);
    subFeatures.forEach(a => usedArticleIds.add(a.id));

    // Sidebar articles from latest (excluding already used)
    const sidebarArticles = latestArticles
        .filter(a => !usedArticleIds.has(a.id))
        .slice(0, 4);
    sidebarArticles.forEach(a => usedArticleIds.add(a.id));

    // Featured articles carousel (skip first 3 that appear in Section 1)
    // Combine remaining featured + other latest articles for carousel variety
    const remainingFeatured = featuredArticles.slice(3);
    const otherArticles = latestArticles.filter(a => !usedArticleIds.has(a.id));
    const displayFeaturedArticles = [...remainingFeatured, ...otherArticles].slice(0, 12);

    // Mark carousel articles as used
    displayFeaturedArticles.forEach(a => usedArticleIds.add(a.id));

    // Latest articles for infinite scroll (excluding all already shown)
    const displayLatestArticles = latestArticles
        .filter(a => !usedArticleIds.has(a.id))
        .slice(0, 10);

    // Ensure we have enough categories for the grid (fallback to empty array)
    const displayCategories = categories.slice(0, 4);
    while (displayCategories.length < 4) {
        displayCategories.push({
            id: `placeholder-${displayCategories.length}`,
            name: "Chuyên mục",
            slug: "",
            description: null,
            image: null,
            parentId: null
        });
    }

    return (
        <>
            {/* SECTION 1: Featured Content Grid */}
            <section className="py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-6">
                        {/* Main Content - 8 cols */}
                        <div className="lg:col-span-8 space-y-6 animate-fade-in">
                            {/* Hero Article */}
                            {heroArticle ? (
                                <Link href={`/bai-viet/${heroArticle.slug}`}>
                                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group shadow-xl">
                                        {heroArticle.featuredImage ? (
                                            <img
                                                src={heroArticle.featuredImage}
                                                alt={heroArticle.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 gradient-hero" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                        {heroArticle.isFeatured && (
                                            <Badge className="absolute top-4 left-4 badge-featured flex items-center gap-1">
                                                <Star className="h-3 w-3" /> Nổi bật
                                            </Badge>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                                                {heroArticle.title}
                                            </h1>
                                            <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
                                                {heroArticle.excerpt}
                                            </p>
                                            <Button size="lg" className="bg-white text-primary hover:bg-white/90 group-hover:shadow-lg transition-all duration-300">
                                                Đọc tiếp
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                                    <p className="text-muted-foreground">Chưa có bài viết nổi bật</p>
                                </div>
                            )}

                            {/* Sub-features */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {subFeatures.map((article: CachedArticle, index: number) => (
                                    <Link key={article.id} href={`/bai-viet/${article.slug}`}>
                                        <div className={`group rounded-xl overflow-hidden border border-border/50 card-interactive bg-card delay-${(index + 1) * 100}`}>
                                            <div className="aspect-[16/9] overflow-hidden">
                                                {article.featuredImage ? (
                                                    <img
                                                        src={article.featuredImage}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted group-hover:scale-105 transition-transform duration-500" />
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                                                    {article.category?.name || "Chung"}
                                                </Badge>
                                                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                    {article.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar - 4 cols */}
                        <div className="lg:col-span-4 space-y-4 animate-slide-in-right">
                            {/* Featured Sidebar Article */}
                            {sidebarArticles[0] && (
                                <Link href={`/bai-viet/${sidebarArticles[0].slug}`}>
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden group shadow-lg">
                                        {sidebarArticles[0].featuredImage ? (
                                            <img
                                                src={sidebarArticles[0].featuredImage}
                                                alt={sidebarArticles[0].title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-cyan-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                            {sidebarArticles[0].category && (
                                                <Badge className="mb-2 bg-white/20 backdrop-blur-sm border border-white/30">{sidebarArticles[0].category.name}</Badge>
                                            )}
                                            <h3 className="font-semibold line-clamp-2 group-hover:text-cyan-300 transition-colors">
                                                {sidebarArticles[0].title}
                                            </h3>
                                            {sidebarArticles[0].excerpt && (
                                                <p className="text-sm text-white/70 line-clamp-2 mt-1">
                                                    {sidebarArticles[0].excerpt}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Sidebar Articles */}
                            <div className="space-y-2 bg-card rounded-xl p-3 border border-border/50">
                                {sidebarArticles.slice(1).map((article: CachedArticle) => (
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

            {/* SECTION 2: Featured Articles Carousel */}
            <section className="py-10 border-t border-border/50">
                <div className="container mx-auto px-4">
                    <FeaturedArticlesCarousel articles={displayFeaturedArticles} />
                </div>
            </section>

            {/* SECTION 3: Product Carousel */}
            <section className="py-12 section-alt">
                <div className="container mx-auto px-4">
                    <ProductCarousel
                        products={featuredProducts}
                        title="Sản phẩm Bác sĩ khuyên dùng"
                        viewAllLink="/san-pham"
                        icon={<Pill className="h-6 w-6 text-primary" />}
                    />
                </div>
            </section>

            {/* SECTION 4: Category Images Grid */}
            <section className="py-12 section-highlight">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Column 1 */}
                        {displayCategories[0] && (
                            <Link href={`/chuyen-muc/${displayCategories[0].slug}`}>
                                <div className="relative h-[400px] rounded-2xl overflow-hidden group shadow-lg">
                                    {displayCategories[0].image ? (
                                        <img
                                            src={displayCategories[0].image}
                                            alt={displayCategories[0].name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 group-hover:scale-110 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-xl font-semibold text-foreground shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            {displayCategories[0].name}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Column 2 - 2 stacked */}
                        <div className="space-y-6">
                            {displayCategories[1] && (
                                <Link href={`/chuyen-muc/${displayCategories[1].slug}`}>
                                    <div className="relative h-[188px] rounded-2xl overflow-hidden group shadow-lg">
                                        {displayCategories[1].image ? (
                                            <img
                                                src={displayCategories[1].image}
                                                alt={displayCategories[1].name}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 group-hover:scale-110 transition-transform duration-700" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-xl font-semibold text-foreground shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                {displayCategories[1].name}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )}
                            {displayCategories[2] && (
                                <Link href={`/chuyen-muc/${displayCategories[2].slug}`}>
                                    <div className="relative h-[188px] rounded-2xl overflow-hidden group shadow-lg">
                                        {displayCategories[2].image ? (
                                            <img
                                                src={displayCategories[2].image}
                                                alt={displayCategories[2].name}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-500 group-hover:scale-110 transition-transform duration-700" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-xl font-semibold text-foreground shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                {displayCategories[2].name}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* Column 3 */}
                        {displayCategories[3] && (
                            <Link href={`/chuyen-muc/${displayCategories[3].slug}`}>
                                <div className="relative h-[400px] rounded-2xl overflow-hidden group shadow-lg">
                                    {displayCategories[3].image ? (
                                        <img
                                            src={displayCategories[3].image}
                                            alt={displayCategories[3].name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 group-hover:scale-110 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-xl font-semibold text-foreground shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            {displayCategories[3].name}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION 5: Main Feed (2-Column) */}
            <section className="py-12 border-t">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left: Latest Articles with Infinite Scroll */}
                        <LatestArticlesFeed
                            initialArticles={displayLatestArticles.map(a => ({
                                ...a,
                                publishedAt: a.publishedAt
                                    ? (typeof a.publishedAt === 'string' ? a.publishedAt : a.publishedAt.toISOString())
                                    : null
                            }))}
                            excludeIds={displayLatestArticles.map(a => a.id)}
                        />

                        {/* Right: Category Boxes */}
                        <div className="space-y-8">
                            {categoryBoxesData.map((categoryData, index) => {
                                if (!categoryData || categoryData.articles.length === 0) return null;

                                const { category, articles } = categoryData;

                                if (index === 0) {
                                    // Style 1: Featured + List
                                    return (
                                        <div key={category.id} className="border rounded-lg p-4">
                                            <h3 className="font-bold uppercase border-b pb-2 mb-4">
                                                {category.name}
                                            </h3>
                                            <div className="space-y-3">
                                                {/* Featured */}
                                                {articles[0] && (
                                                    <Link href={`/bai-viet/${articles[0].slug}`}>
                                                        <div className="flex gap-3 group">
                                                            <div className="w-[120px] h-[80px] flex-shrink-0 rounded overflow-hidden">
                                                                {articles[0].featuredImage ? (
                                                                    <img
                                                                        src={articles[0].featuredImage}
                                                                        alt={articles[0].title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
                                                                    {articles[0].title}
                                                                </h5>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                                    {articles[0].excerpt}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )}
                                                {/* List */}
                                                <ul className="space-y-2 pt-2 border-t">
                                                    {articles.slice(1).map((article) => (
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
                                        <div key={category.id} className="border rounded-lg p-4">
                                            <h3 className="font-bold uppercase border-b pb-2 mb-4">
                                                {category.name}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Big image */}
                                                {articles[0] && (
                                                    <Link href={`/bai-viet/${articles[0].slug}`}>
                                                        <div className="group">
                                                            <div className="aspect-square rounded overflow-hidden mb-2">
                                                                {articles[0].featuredImage ? (
                                                                    <img
                                                                        src={articles[0].featuredImage}
                                                                        alt={articles[0].title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 group-hover:scale-105 transition" />
                                                                )}
                                                            </div>
                                                            <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
                                                                {articles[0].title}
                                                            </h5>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                                {articles[0].excerpt}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                )}
                                                {/* Small items */}
                                                <div className="space-y-3">
                                                    {articles.slice(1).map((article) => (
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
                    </div>
                </div>
            </section>
        </>
    );
}
