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

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        const auth = await getUserRole(request);
        if (!auth || !["admin", "editor"].includes(auth.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const role = searchParams.get("role");
        const search = searchParams.get("search");

        const where: Record<string, unknown> = {};

        if (role && role !== "all") {
            where.role = role;
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    avatarUrl: true,
                    emailVerifiedAt: true,
                    createdAt: true,
                    _count: {
                        select: {
                            orders: true,
                            articles: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("List users error:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const auth = await getUserRole(request);
        if (!auth || auth.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email, password, fullName, phone, role } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email và mật khẩu là bắt buộc" },
                { status: 400 }
            );
        }

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email đã tồn tại" },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phone,
                role: role || "customer",
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            { message: "Tạo người dùng thành công", user },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
