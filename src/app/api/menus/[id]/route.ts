import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/menus/:id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const menu = await prisma.menu.findUnique({
            where: { id },
            include: {
                children: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        if (!menu) {
            return NextResponse.json(
                { error: "Menu not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ menu });
    } catch (error) {
        console.error("Get menu error:", error);
        return NextResponse.json(
            { error: "Failed to fetch menu" },
            { status: 500 }
        );
    }
}

// PUT /api/menus/:id
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = request.headers.get("x-user-role");
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, url, sortOrder, isActive, parentId } = body;

        const menu = await prisma.menu.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(url !== undefined && { url }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
                ...(parentId !== undefined && { parentId: parentId || null }),
            },
        });

        return NextResponse.json({ message: "Cập nhật menu thành công", menu });
    } catch (error) {
        console.error("Update menu error:", error);
        return NextResponse.json(
            { error: "Failed to update menu" },
            { status: 500 }
        );
    }
}

// DELETE /api/menus/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = request.headers.get("x-user-role");
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.menu.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Xóa menu thành công" });
    } catch (error) {
        console.error("Delete menu error:", error);
        return NextResponse.json(
            { error: "Failed to delete menu" },
            { status: 500 }
        );
    }
}
