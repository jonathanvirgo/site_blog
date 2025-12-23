import { NextRequest, NextResponse } from "next/server";
import { testSelectors } from "@/lib/crawler";

// POST /api/crawler/test - Test CSS selectors against a URL
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        if (!body.url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        if (!body.selectors || typeof body.selectors !== "object") {
            return NextResponse.json(
                { error: "Selectors object is required" },
                { status: 400 }
            );
        }

        // Validate URL
        try {
            const parsed = new URL(body.url);
            if (["localhost", "127.0.0.1", "0.0.0.0"].some(h => parsed.hostname.includes(h))) {
                return NextResponse.json(
                    { error: "Cannot test local URLs" },
                    { status: 400 }
                );
            }
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        const results = await testSelectors(
            body.url,
            body.selectors,
            body.headers
        );

        return NextResponse.json({
            url: body.url,
            results,
        });

    } catch (error) {
        console.error("Test selectors error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Failed to test selectors: ${error.message}` },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to test selectors" },
            { status: 500 }
        );
    }
}
