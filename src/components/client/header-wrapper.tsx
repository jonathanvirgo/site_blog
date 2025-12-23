import prisma from "@/lib/prisma";
import { HeaderClient } from "./header-client";

interface MenuItem {
    id: string;
    title: string;
    url: string;
    children?: MenuItem[];
}

// Fetch menus server-side
async function getMenus(): Promise<MenuItem[]> {
    try {
        const menus = await prisma.menu.findMany({
            where: {
                isActive: true,
                parentId: null,
            },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                },
            },
            orderBy: { sortOrder: "asc" },
        });

        return menus.map((menu) => ({
            id: menu.id,
            title: menu.title,
            url: menu.url,
            children: menu.children?.map((child) => ({
                id: child.id,
                title: child.title,
                url: child.url,
            })),
        }));
    } catch (error) {
        console.error("Failed to fetch menus:", error);
        return [];
    }
}

// Fallback menus if no menus configured
const FALLBACK_MENUS: MenuItem[] = [
    { id: "home", title: "Trang chủ", url: "/" },
    { id: "products", title: "Sản phẩm", url: "/san-pham" },
];

export async function Header() {
    const menus = await getMenus();
    const menuItems = menus.length > 0 ? menus : FALLBACK_MENUS;

    return <HeaderClient initialMenuItems={menuItems} />;
}
