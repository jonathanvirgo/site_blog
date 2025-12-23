import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAccessToken } from "@/lib/auth";

// Helper to get user role from request (cookie or header)
async function getUserRole(request: NextRequest): Promise<{ userId: string; role: string } | null> {
    // First try from middleware header
    const headerRole = request.headers.get("x-user-role");
    const headerUserId = request.headers.get("x-user-id");
    if (headerRole && headerUserId) {
        return { userId: headerUserId, role: headerRole };
    }

    // Fallback to cookie verification
    const token = request.cookies.get("access_token")?.value;
    if (token) {
        const payload = await verifyAccessToken(token);
        if (payload) {
            return { userId: payload.userId, role: payload.role };
        }
    }

    return null;
}

// GET /api/admin/users/:id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserRole(request);
        if (!auth || auth.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                avatarUrl: true,
                emailVerifiedAt: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        orders: true,
                        articles: true,
                    },
                },
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
        console.error("Get user error:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/users/:id
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserRole(request);
        if (!auth || auth.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { fullName, phone, role, password } = body;

        const updateData: Record<string, unknown> = {};

        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ message: "Cập nhật thành công", user });
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/users/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserRole(request);
        if (!auth || auth.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Prevent self-deletion
        if (id === auth.userId) {
            return NextResponse.json(
                { error: "Không thể xóa tài khoản của chính bạn" },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Xóa người dùng thành công" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
