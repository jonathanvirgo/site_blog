import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// Cookie configuration for Vercel deployment
const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
    try {
        // Get token from cookie (priority) or header
        const token =
            request.cookies.get("access_token")?.value ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "No token provided" },
                { status: 401 }
            );
        }

        const payload = await verifyAccessToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        // Delete all refresh tokens for this user
        await prisma.refreshToken.deleteMany({
            where: { userId: payload.userId },
        });

        // Create response and clear cookies
        const response = NextResponse.json({
            message: "Đăng xuất thành công",
        });

        // Clear access_token cookie
        response.cookies.set("access_token", "", {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        // Clear refresh_token cookie
        response.cookies.set("refresh_token", "", {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Failed to logout" },
            { status: 500 }
        );
    }
}
