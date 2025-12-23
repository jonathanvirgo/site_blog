import { getRedis, CacheKeys, CacheTTL } from "./redis";

// ==================== TOKEN BLACKLIST ====================

/**
 * Add token to blacklist (on logout)
 * TTL should match the remaining lifetime of the token
 */
export async function blacklistToken(token: string, ttlSeconds?: number): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = CacheKeys.tokenBlacklist(token);
        await redis.setex(key, ttlSeconds || CacheTTL.LONG, "1");
    } catch (error) {
        console.error("Blacklist token error:", error);
    }
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;

    try {
        const key = CacheKeys.tokenBlacklist(token);
        const result = await redis.get(key);
        return result === "1";
    } catch (error) {
        console.error("Check blacklist error:", error);
        return false;
    }
}

// ==================== REFRESH TOKEN STORAGE ====================

interface StoredRefreshToken {
    token: string;
    userAgent: string;
    ip: string;
    createdAt: number;
}

/**
 * Store refresh token for a user
 * Supports multiple devices
 */
export async function storeRefreshToken(
    userId: string,
    token: string,
    userAgent: string,
    ip: string
): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = CacheKeys.refreshToken(userId);
        const data: StoredRefreshToken = {
            token,
            userAgent,
            ip,
            createdAt: Date.now(),
        };

        // Store as hash field (supports multiple tokens per user)
        await redis.hset(key, token, JSON.stringify(data));

        // Set expiry to 7 days (refresh token lifetime)
        await redis.expire(key, 7 * 24 * 60 * 60);
    } catch (error) {
        console.error("Store refresh token error:", error);
    }
}

/**
 * Validate refresh token exists for user
 */
export async function validateRefreshToken(
    userId: string,
    token: string
): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return true; // Fail open if no Redis

    try {
        const key = CacheKeys.refreshToken(userId);
        const exists = await redis.hexists(key, token);
        return exists === 1;
    } catch (error) {
        console.error("Validate refresh token error:", error);
        return true;
    }
}

/**
 * Remove refresh token (on logout)
 */
export async function removeRefreshToken(
    userId: string,
    token: string
): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = CacheKeys.refreshToken(userId);
        await redis.hdel(key, token);
    } catch (error) {
        console.error("Remove refresh token error:", error);
    }
}

/**
 * Remove all refresh tokens for user (logout all devices)
 */
export async function removeAllRefreshTokens(userId: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = CacheKeys.refreshToken(userId);
        await redis.del(key);
    } catch (error) {
        console.error("Remove all refresh tokens error:", error);
    }
}

/**
 * Get all active sessions for user
 */
export async function getUserSessions(userId: string): Promise<StoredRefreshToken[]> {
    const redis = getRedis();
    if (!redis) return [];

    try {
        const key = CacheKeys.refreshToken(userId);
        const tokens = await redis.hgetall(key);

        return Object.values(tokens).map(t => JSON.parse(t) as StoredRefreshToken);
    } catch (error) {
        console.error("Get user sessions error:", error);
        return [];
    }
}
