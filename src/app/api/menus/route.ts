import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/menus - List all menus (hierarchical)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const where: Record<string, unknown> = {};
        if (activeOnly) {
            where.isActive = true;
        }

        // Get top-level menus with children
        const menus = await prisma.menu.findMany({
            where: {
                ...where,
                parentId: null,
            },
            include: {
                children: {
                    where: activeOnly ? { isActive: true } : {},
                    orderBy: { sortOrder: "asc" },
                },
            },
            orderBy: { sortOrder: "asc" },
        });

        console.log("Fetched menus:", JSON.stringify(menus, null, 2));
        return NextResponse.json({ menus });
    } catch (error) {
        console.error("List menus error:", error);
        return NextResponse.json(
            { error: "Failed to fetch menus" },
            { status: 500 }
        );
    }
}

// POST /api/menus - Create new menu item
export async function POST(request: NextRequest) {
    try {
        const userRole = request.headers.get("x-user-role");
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, url, sortOrder, isActive, parentId } = body;

        if (!title || !url) {
            return NextResponse.json(
                { error: "Title and URL are required" },
                { status: 400 }
            );
        }

        const menu = await prisma.menu.create({
            data: {
                title,
                url,
                sortOrder: sortOrder || 0,
                isActive: isActive ?? true,
                parentId: parentId || null,
            },
        });

        console.log("Created menu:", JSON.stringify(menu, null, 2));
        return NextResponse.json(
            { message: "Tạo menu thành công", menu },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create menu error:", error);
        return NextResponse.json(
            { error: "Failed to create menu" },
            { status: 500 }
        );
    }
}
