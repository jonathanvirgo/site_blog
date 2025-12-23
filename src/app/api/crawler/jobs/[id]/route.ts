import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/crawler/jobs/[id] - Get single job with extracted data
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const job = await prisma.crawlJob.findUnique({
            where: { id },
            include: {
                source: true,
                user: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ job });
    } catch (error) {
        console.error("Get crawl job error:", error);
        return NextResponse.json(
            { error: "Failed to fetch crawl job" },
            { status: 500 }
        );
    }
}

// DELETE /api/crawler/jobs/[id] - Delete/cancel job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const job = await prisma.crawlJob.findUnique({
            where: { id },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        // Can only delete if not processing
        if (job.status === "processing") {
            return NextResponse.json(
                { error: "Cannot delete job while processing" },
                { status: 400 }
            );
        }

        await prisma.crawlJob.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Đã xóa job" });
    } catch (error) {
        console.error("Delete crawl job error:", error);
        return NextResponse.json(
            { error: "Failed to delete crawl job" },
            { status: 500 }
        );
    }
}
