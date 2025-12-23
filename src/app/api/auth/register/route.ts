import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    hashPassword,
    createAccessToken,
    createRefreshToken,
    generateRandomToken,
} from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

// Cookie configuration for Vercel deployment
const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { email, password, fullName, phone } = validation.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email đã được sử dụng" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phone,
                role: "customer",
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const accessToken = await createAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshTokenValue = generateRandomToken();
        const refreshToken = await createRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Store refresh token in database
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshTokenValue,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Create response with HttpOnly cookies
        const response = NextResponse.json(
            {
                message: "Đăng ký thành công",
                user,
            },
            { status: 201 }
        );

        // Set access_token cookie (15 minutes)
        response.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60, // 15 minutes
        });

        // Set refresh_token cookie (7 days)
        response.cookies.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi, vui lòng thử lại" },
            { status: 500 }
        );
    }
}
