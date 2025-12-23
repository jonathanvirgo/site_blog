import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    verifyRefreshToken,
    createAccessToken,
    createRefreshToken,
    generateRandomToken,
} from "@/lib/auth";

// Cookie configuration for Vercel deployment
const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
    try {
        // Get refresh token from cookie (priority) or body
        let refreshToken = request.cookies.get("refresh_token")?.value;

        // Fallback to body for backward compatibility
        if (!refreshToken) {
            try {
                const body = await request.json();
                refreshToken = body.refreshToken;
            } catch {
                // No body or invalid JSON
            }
        }

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Refresh token is required" },
                { status: 400 }
            );
        }

        // Verify the refresh token JWT
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            // Clear invalid cookies
            const errorResponse = NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
            errorResponse.cookies.set("access_token", "", { maxAge: 0, path: "/" });
            errorResponse.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
            return errorResponse;
        }

        // Check if user still exists and is valid
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 401 }
            );
        }

        // Generate new tokens
        const newAccessToken = await createAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const newRefreshTokenValue = generateRandomToken();
        const newRefreshToken = await createRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Update refresh token in database
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: newRefreshTokenValue,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Create response with new HttpOnly cookies
        const response = NextResponse.json({
            message: "Token refreshed successfully",
        });

        // Set new access_token cookie (15 minutes)
        response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60,
        });

        // Set new refresh_token cookie (7 days)
        response.cookies.set("refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Refresh token error:", error);
        return NextResponse.json(
            { error: "Failed to refresh token" },
            { status: 500 }
        );
    }
}
