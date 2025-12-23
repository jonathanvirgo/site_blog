import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

// Public routes that don't require authentication
const publicRoutes = ["/dang-nhap", "/dang-ky", "/admin/login"];

// Routes that require authentication
const protectedRoutes = ["/admin", "/account", "/checkout", "/api/admin", "/api/menus", "/api/articles", "/api/products", "/api/categories", "/api/tags", "/api/locations", "/api/coupons", "/api/media", "/api/crawler"];

// Routes that require admin/editor role
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    const isPublicRoute = publicRoutes.some((route) => pathname === route);
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check if route needs protection
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    const isApiRoute = pathname.startsWith("/api/");

    // API routes: Allow GET without auth (public read), but still inject headers if token exists
    if (isApiRoute && request.method === "GET") {
        const token =
            request.cookies.get("access_token")?.value ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

        if (token) {
            const payload = await verifyAccessToken(token);
            if (payload) {
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set("x-user-id", payload.userId);
                requestHeaders.set("x-user-email", payload.email);
                requestHeaders.set("x-user-role", payload.role);
                return NextResponse.next({ request: { headers: requestHeaders } });
            }
        }
        return NextResponse.next();
    }

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // Get token from cookie or header
    const token =
        request.cookies.get("access_token")?.value ||
        request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        // Redirect to appropriate login page
        if (isAdminRoute) {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
        const loginUrl = new URL("/dang-nhap", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    if (!payload) {
        // Token invalid or expired - redirect to login
        if (isAdminRoute) {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
        const loginUrl = new URL("/dang-nhap", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check admin access
    if (isAdminRoute && !["admin", "editor"].includes(payload.role)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/account/:path*",
        "/checkout/:path*",
        "/api/admin/:path*",
        "/api/menus",
        "/api/menus/:path*",
        "/api/articles",
        "/api/articles/:path*",
        "/api/products",
        "/api/products/:path*",
        "/api/categories",
        "/api/categories/:path*",
        "/api/tags",
        "/api/tags/:path*",
        "/api/locations",
        "/api/locations/:path*",
        "/api/coupons",
        "/api/coupons/:path*",
        "/api/media",
        "/api/media/:path*",
        "/api/crawler",
        "/api/crawler/:path*",
        "/dang-nhap",
        "/dang-ky",
    ],
};
