import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAccessToken, verifyPassword, hashPassword } from "@/lib/auth";

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
    try {
        const token =
            request.cookies.get("access_token")?.value ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
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

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Get profile error:", error);
        return NextResponse.json(
            { error: "Failed to get profile" },
            { status: 500 }
        );
    }
}

// PUT /api/auth/profile - Update current user profile
export async function PUT(request: NextRequest) {
    try {
        const token =
            request.cookies.get("access_token")?.value ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
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

        const body = await request.json();
        const { fullName, phone, avatarUrl } = body;

        const updateData: Record<string, unknown> = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                avatarUrl: true,
            },
        });

        return NextResponse.json({
            message: "Cập nhật thông tin thành công",
            user,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
