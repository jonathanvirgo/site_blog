import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Supabase health check - keeps connection active (prevent 7-day inactive timeout)
export async function GET() {
    try {
        // Simple database query to keep Supabase active
        await prisma.$queryRaw`SELECT 1 as ping`;

        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            message: "Supabase connection is active",
            database: "connected",
        });
    } catch (error) {
        console.error("Supabase health check failed:", error);
        return NextResponse.json(
            {
                status: "error",
                timestamp: new Date().toISOString(),
                message: "Database connection failed",
                database: "disconnected",
            },
            { status: 500 }
        );
    }
}
