import { NextRequest, NextResponse } from "next/server";
import { getRedis, CacheKeys } from "./redis";

interface RateLimitConfig {
    windowMs: number;   // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,       // 60 requests per minute
};

const strictConfig: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,       // 10 requests per minute (for auth endpoints)
};

/**
 * Rate limiter using Redis sliding window
 */
export async function rateLimit(
    request: NextRequest,
    endpoint: string,
    config: RateLimitConfig = defaultConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const redis = getRedis();

    // Skip rate limiting if Redis not available
    if (!redis) {
        return { success: true, remaining: config.maxRequests, reset: 0 };
    }

    // Get IP address
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";

    const key = CacheKeys.rateLimit(ip, endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
        // Remove old entries outside the window
        await redis.zremrangebyscore(key, 0, windowStart);

        // Count current requests in window
        const currentRequests = await redis.zcard(key);

        if (currentRequests >= config.maxRequests) {
            // Get oldest entry to calculate reset time
            const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
            const resetTime = oldest.length > 1
                ? parseInt(oldest[1]) + config.windowMs - now
                : config.windowMs;

            return {
                success: false,
                remaining: 0,
                reset: Math.ceil(resetTime / 1000),
            };
        }

        // Add current request
        await redis.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiry on the key
        await redis.expire(key, Math.ceil(config.windowMs / 1000));

        return {
            success: true,
            remaining: config.maxRequests - currentRequests - 1,
            reset: Math.ceil(config.windowMs / 1000),
        };
    } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open - allow request if Redis error
        return { success: true, remaining: config.maxRequests, reset: 0 };
    }
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(
    remaining: number,
    reset: number
): NextResponse {
    return NextResponse.json(
        {
            error: "Too many requests",
            message: `Vui lòng thử lại sau ${reset} giây`,
        },
        {
            status: 429,
            headers: {
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
                "Retry-After": reset.toString(),
            },
        }
    );
}

/**
 * Apply rate limiting to an API handler
 */
export function withRateLimit(
    handler: (request: NextRequest) => Promise<NextResponse>,
    endpoint: string,
    config?: RateLimitConfig
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const result = await rateLimit(request, endpoint, config);

        if (!result.success) {
            return rateLimitResponse(result.remaining, result.reset);
        }

        const response = await handler(request);

        // Add rate limit headers to response
        response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
        response.headers.set("X-RateLimit-Reset", result.reset.toString());

        return response;
    };
}

// Export configs for different endpoints
export const RateLimitConfigs = {
    default: defaultConfig,
    strict: strictConfig,
    api: {
        windowMs: 60 * 1000,
        maxRequests: 100,
    },
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,            // 5 attempts per 15 min
    },
    crawler: {
        windowMs: 60 * 1000,
        maxRequests: 5,
    },
};
