import Redis from "ioredis";

// Redis Cloud connection
// Get your Redis URL from https://redis.io/cloud
const redisUrl = process.env.REDIS_URL;

// Create Redis instance with fallback for local development
let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!redisUrl) {
        console.warn("⚠️ REDIS_URL not set, Redis features disabled");
        return null;
    }

    if (!redis) {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            connectTimeout: 10000,
            lazyConnect: true,
        });

        redis.on("connect", () => {
            console.log("✅ Redis connected");
        });

        redis.on("error", (err) => {
            console.error("❌ Redis error:", err.message);
        });
    }

    return redis;
}

// ==================== CACHE UTILITIES ====================

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get cached data or fetch from source
 */
export async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const client = getRedis();

    if (!client) {
        return fetcher();
    }

    try {
        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached) as T;
        }

        const data = await fetcher();
        await client.setex(key, ttl, JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Cache error:", error);
        return fetcher();
    }
}

/**
 * Set cache with TTL
 */
export async function setCache(
    key: string,
    data: unknown,
    ttl: number = DEFAULT_TTL
): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
        await client.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
        console.error("Set cache error:", error);
    }
}

/**
 * Get from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (!client) return null;

    try {
        const cached = await client.get(key);
        return cached ? (JSON.parse(cached) as T) : null;
    } catch (error) {
        console.error("Get cache error:", error);
        return null;
    }
}

/**
 * Delete from cache
 */
export async function deleteCache(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
        await client.del(key);
    } catch (error) {
        console.error("Delete cache error:", error);
    }
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch (error) {
        console.error("Delete pattern error:", error);
    }
}

// ==================== CACHE KEYS ====================

export const CacheKeys = {
    // Articles
    articlesList: (page: number, limit: number) => `articles:list:${page}:${limit}`,
    articleBySlug: (slug: string) => `articles:slug:${slug}`,
    articlesFeatured: () => `articles:featured`,
    articlesByCategory: (categorySlug: string) => `articles:category:${categorySlug}`,

    // Products
    productsList: (page: number, limit: number) => `products:list:${page}:${limit}`,
    productBySlug: (slug: string) => `products:slug:${slug}`,
    productsFeatured: () => `products:featured`,
    productsByCategory: (categorySlug: string) => `products:category:${categorySlug}`,

    // Categories
    articleCategories: () => `categories:article`,
    productCategories: () => `categories:product`,

    // Homepage
    homepageData: () => `homepage:data`,

    // Rate limiting
    rateLimit: (ip: string, endpoint: string) => `rate:${endpoint}:${ip}`,

    // Auth
    tokenBlacklist: (token: string) => `blacklist:${token}`,
    refreshToken: (userId: string) => `refresh:${userId}`,
};

// ==================== TTL CONSTANTS ====================

export const CacheTTL = {
    SHORT: 60,          // 1 minute - for frequently changing data
    DEFAULT: 300,       // 5 minutes - default
    MEDIUM: 900,        // 15 minutes - for semi-static data
    LONG: 3600,         // 1 hour - for rarely changing data
    VERY_LONG: 86400,   // 24 hours - for static data
};

export { getRedis };
export default redis;
