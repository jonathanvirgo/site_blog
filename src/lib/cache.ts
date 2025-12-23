import { getOrSet, setCache, deleteCache, deleteCachePattern, CacheKeys, CacheTTL } from "./redis";
import prisma from "./prisma";

// ==================== ARTICLE CACHE ====================

export interface CachedArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    featuredImage: string | null;
    publishedAt: Date | null;
    viewCount: number;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    category: { id: string; name: string; slug: string } | null;
    author: { id: string; fullName: string | null } | null;
    tags: { id: string; name: string; slug: string }[];
}

/**
 * Get featured articles with caching
 */
export async function getFeaturedArticles(limit = 10): Promise<CachedArticle[]> {
    return getOrSet(
        CacheKeys.articlesFeatured(),
        async () => {
            const articles = await prisma.article.findMany({
                where: { status: "published", isFeatured: true },
                take: limit,
                orderBy: { publishedAt: "desc" },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    author: { select: { id: true, fullName: true } },
                    tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
                },
            });
            return articles.map((a: typeof articles[0]) => ({
                ...a,
                tags: a.tags.map((t: typeof a.tags[0]) => t.tag),
            }));
        },
        CacheTTL.MEDIUM
    );
}

/**
 * Get latest articles with caching
 */
export async function getLatestArticles(page = 1, limit = 10): Promise<CachedArticle[]> {
    return getOrSet(
        CacheKeys.articlesList(page, limit),
        async () => {
            const articles = await prisma.article.findMany({
                where: { status: "published" },
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { publishedAt: "desc" },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    author: { select: { id: true, fullName: true } },
                    tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
                },
            });
            return articles.map((a: typeof articles[0]) => ({
                ...a,
                tags: a.tags.map((t: typeof a.tags[0]) => t.tag),
            }));
        },
        CacheTTL.SHORT
    );
}

/**
 * Get article by slug with caching
 */
export async function getArticleBySlug(slug: string): Promise<CachedArticle | null> {
    return getOrSet(
        CacheKeys.articleBySlug(slug),
        async () => {
            const article = await prisma.article.findUnique({
                where: { slug },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    author: { select: { id: true, fullName: true } },
                    tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
                },
            });
            if (!article) return null;
            return {
                ...article,
                tags: article.tags.map((t: typeof article.tags[0]) => t.tag),
            };
        },
        CacheTTL.MEDIUM
    );
}

/**
 * Invalidate article cache
 */
export async function invalidateArticleCache(slug?: string): Promise<void> {
    await deleteCachePattern("articles:*");
    await deleteCache(CacheKeys.homepageData());
    if (slug) {
        await deleteCache(CacheKeys.articleBySlug(slug));
    }
}

// ==================== PRODUCT CACHE ====================

export interface CachedProduct {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    images: unknown;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    category: { id: string; name: string; slug: string } | null;
    variants: {
        id: string;
        sku: string;
        price: number;
        salePrice: number | null;
        stockQuantity: number;
        isDefault: boolean;
    }[];
}

/**
 * Get featured products with caching
 */
export async function getFeaturedProducts(limit = 10): Promise<CachedProduct[]> {
    return getOrSet(
        CacheKeys.productsFeatured(),
        async () => {
            const products = await prisma.product.findMany({
                where: { status: "active", isFeatured: true },
                take: limit,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    variants: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            salePrice: true,
                            stockQuantity: true,
                            isDefault: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                },
            });
            return products.map((p: typeof products[0]) => ({
                ...p,
                variants: p.variants.map((v: typeof p.variants[0]) => ({
                    ...v,
                    price: Number(v.price),
                    salePrice: v.salePrice ? Number(v.salePrice) : null,
                })),
            }));
        },
        CacheTTL.MEDIUM
    );
}

/**
 * Get product by slug with caching
 */
export async function getProductBySlug(slug: string): Promise<CachedProduct | null> {
    return getOrSet(
        CacheKeys.productBySlug(slug),
        async () => {
            const product = await prisma.product.findUnique({
                where: { slug },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    variants: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            salePrice: true,
                            stockQuantity: true,
                            isDefault: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                },
            });
            if (!product) return null;
            return {
                ...product,
                variants: product.variants.map((v: typeof product.variants[0]) => ({
                    ...v,
                    price: Number(v.price),
                    salePrice: v.salePrice ? Number(v.salePrice) : null,
                })),
            };
        },
        CacheTTL.MEDIUM
    );
}

/**
 * Invalidate product cache
 */
export async function invalidateProductCache(slug?: string): Promise<void> {
    await deleteCachePattern("products:*");
    await deleteCache(CacheKeys.homepageData());
    if (slug) {
        await deleteCache(CacheKeys.productBySlug(slug));
    }
}

// ==================== CATEGORY CACHE ====================

export interface CachedCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parentId: string | null;
}

/**
 * Get article categories with caching
 */
export async function getArticleCategories(): Promise<CachedCategory[]> {
    return getOrSet(
        CacheKeys.articleCategories(),
        async () => {
            return prisma.articleCategory.findMany({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    image: true,
                    parentId: true,
                },
                orderBy: { sortOrder: "asc" },
            });
        },
        CacheTTL.LONG
    );
}

/**
 * Get product categories with caching
 */
export async function getProductCategories(): Promise<CachedCategory[]> {
    return getOrSet(
        CacheKeys.productCategories(),
        async () => {
            return prisma.productCategory.findMany({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    image: true,
                    parentId: true,
                },
                orderBy: { sortOrder: "asc" },
            });
        },
        CacheTTL.LONG
    );
}

// ==================== HOMEPAGE CACHE ====================

export interface HomepageData {
    featuredArticles: CachedArticle[];
    latestArticles: CachedArticle[];
    featuredProducts: CachedProduct[];
    categories: CachedCategory[];
}

/**
 * Get all homepage data with single cache hit
 */
export async function getHomepageData(): Promise<HomepageData> {
    return getOrSet(
        CacheKeys.homepageData(),
        async () => {
            const [featuredArticles, latestArticles, featuredProducts, categories] = await Promise.all([
                getFeaturedArticles(15), // More for carousel
                getLatestArticles(1, 20), // More for main feed
                getFeaturedProducts(10), // More for carousel
                getArticleCategories(),
            ]);

            return {
                featuredArticles,
                latestArticles,
                featuredProducts,
                categories,
            };
        },
        CacheTTL.SHORT
    );
}
