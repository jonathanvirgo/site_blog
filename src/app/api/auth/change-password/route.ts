import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAccessToken, verifyPassword, hashPassword } from "@/lib/auth";

// POST /api/auth/change-password - Change current user password
export async function POST(request: NextRequest) {
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
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "Mật khẩu mới phải có ít nhất 8 ký tự" },
                { status: 400 }
            );
        }

        // Get user with password hash
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                passwordHash: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify current password
        const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Mật khẩu hiện tại không đúng" },
                { status: 400 }
            );
        }

        // Hash new password and update
        const newPasswordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: payload.userId },
            data: { passwordHash: newPasswordHash },
        });

        return NextResponse.json({
            message: "Đổi mật khẩu thành công",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
