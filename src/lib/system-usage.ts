import { v2 as cloudinary } from "cloudinary";
import Redis from "ioredis";
import prisma from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

// Configure Cloudinary if not already configured
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export interface UsageMetric {
    used: number;
    limit: number;
    unit: string;
}

export interface SystemUsage {
    cloudinary: {
        storage: UsageMetric;
        bandwidth: UsageMetric;
        transformations: UsageMetric;
    } | null;
    resend: {
        emails: UsageMetric;
    } | null;
    redis: {
        memory: UsageMetric;
    } | null;
    database: {
        size: UsageMetric;
    } | null;
    lastUpdated: string;
}

const CACHE_KEY = "system:usage";
const CACHE_TTL = 600; // 10 minutes

/**
 * Get system usage from cache or fetch fresh data
 */
export async function getSystemUsage(): Promise<SystemUsage> {
    const redis = getRedis();

    // Try to get from cache
    if (redis) {
        try {
            const cached = await redis.get(CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error("Cache read error:", e);
        }
    }

    // Fetch fresh data
    const usage = await fetchSystemUsage();

    // Cache the result
    if (redis) {
        try {
            await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(usage));
        } catch (e) {
            console.error("Cache write error:", e);
        }
    }

    return usage;
}

/**
 * Fetch fresh usage data from all services
 */
async function fetchSystemUsage(): Promise<SystemUsage> {
    const [cloudinaryUsage, resendUsage, redisUsage, databaseUsage] = await Promise.allSettled([
        getCloudinaryUsage(),
        getResendUsage(),
        getRedisUsage(),
        getDatabaseUsage(),
    ]);

    return {
        cloudinary: cloudinaryUsage.status === "fulfilled" ? cloudinaryUsage.value : null,
        resend: resendUsage.status === "fulfilled" ? resendUsage.value : null,
        redis: redisUsage.status === "fulfilled" ? redisUsage.value : null,
        database: databaseUsage.status === "fulfilled" ? databaseUsage.value : null,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Get Cloudinary usage
 */
async function getCloudinaryUsage(): Promise<SystemUsage["cloudinary"]> {
    if (!process.env.CLOUDINARY_API_KEY) {
        return null;
    }

    try {
        const usage = await cloudinary.api.usage();

        return {
            storage: {
                used: usage.storage?.usage || 0,
                limit: 25 * 1024 * 1024 * 1024, // 25GB
                unit: "bytes",
            },
            bandwidth: {
                used: usage.bandwidth?.usage || 0,
                limit: 25 * 1024 * 1024 * 1024, // 25GB/month
                unit: "bytes",
            },
            transformations: {
                used: usage.transformations?.usage || 0,
                limit: 25000,
                unit: "count",
            },
        };
    } catch (error) {
        console.error("Cloudinary usage error:", error);
        return null;
    }
}

/**
 * Get Resend usage - count emails sent this month
 * Note: Resend doesn't have a direct usage API, so we estimate from database
 */
async function getResendUsage(): Promise<SystemUsage["resend"]> {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }

    try {
        // Count orders this month (each order = 1 email)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const emailsSent = await prisma.order.count({
            where: {
                createdAt: { gte: startOfMonth },
            },
        });

        return {
            emails: {
                used: emailsSent,
                limit: 3000,
                unit: "emails/month",
            },
        };
    } catch (error) {
        console.error("Resend usage error:", error);
        return null;
    }
}

/**
 * Get Redis memory usage
 */
async function getRedisUsage(): Promise<SystemUsage["redis"]> {
    const redis = getRedis();
    if (!redis) {
        return null;
    }

    try {
        const info = await redis.info("memory");
        const usedMemoryMatch = info.match(/used_memory:(\d+)/);
        const usedMemory = usedMemoryMatch ? parseInt(usedMemoryMatch[1], 10) : 0;

        return {
            memory: {
                used: usedMemory,
                limit: 30 * 1024 * 1024, // 30MB free tier
                unit: "bytes",
            },
        };
    } catch (error) {
        console.error("Redis usage error:", error);
        return null;
    }
}

/**
 * Get database size
 */
async function getDatabaseUsage(): Promise<SystemUsage["database"]> {
    try {
        const result = await prisma.$queryRaw<Array<{ size: bigint }>>`
            SELECT pg_database_size(current_database()) as size
        `;

        const size = Number(result[0]?.size || 0);

        return {
            size: {
                used: size,
                limit: 500 * 1024 * 1024, // 500MB Supabase free
                unit: "bytes",
            },
        };
    } catch (error) {
        console.error("Database usage error:", error);
        return null;
    }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Get percentage and status color
 */
export function getUsageStatus(used: number, limit: number): {
    percentage: number;
    status: "normal" | "warning" | "critical";
    color: string;
} {
    const percentage = Math.round((used / limit) * 100);

    if (percentage >= 80) {
        return { percentage, status: "critical", color: "bg-red-500" };
    } else if (percentage >= 60) {
        return { percentage, status: "warning", color: "bg-yellow-500" };
    }
    return { percentage, status: "normal", color: "bg-green-500" };
}
