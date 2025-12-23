import { NextResponse } from "next/server";
import { getSystemUsage } from "@/lib/system-usage";

/**
 * GET /api/admin/system-usage
 * Returns usage statistics for all services
 */
export async function GET() {
    try {
        const usage = await getSystemUsage();

        return NextResponse.json(usage);
    } catch (error) {
        console.error("System usage error:", error);
        return NextResponse.json(
            { error: "Failed to fetch system usage" },
            { status: 500 }
        );
    }
}
