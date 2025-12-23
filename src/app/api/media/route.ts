import { NextRequest, NextResponse } from "next/server";
import { listResources, getFolders, CloudinaryResource } from "@/lib/cloudinary";

/**
 * GET /api/media - List media resources from Cloudinary
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get("folder") || undefined;
        const type = searchParams.get("type") as "image" | "video" | "raw" | null;
        const cursor = searchParams.get("cursor") || undefined;
        const limit = parseInt(searchParams.get("limit") || "30", 10);
        const includeFolders = searchParams.get("folders") === "true";

        // Get folders list if requested
        let folders: string[] = [];
        if (includeFolders) {
            folders = await getFolders();
        }

        // Fetch both images and videos if type is "all" or not specified
        let allResources: CloudinaryResource[] = [];
        let nextCursor: string | undefined;

        if (!type || type === "image") {
            const imageResult = await listResources({
                folder,
                resourceType: "image",
                maxResults: limit,
                nextCursor: cursor,
            });
            allResources = [...allResources, ...imageResult.resources];
            nextCursor = imageResult.nextCursor;
        }

        if (!type || type === "video") {
            const videoResult = await listResources({
                folder,
                resourceType: "video",
                maxResults: limit,
                nextCursor: cursor,
            });
            allResources = [...allResources, ...videoResult.resources];
            if (!nextCursor) nextCursor = videoResult.nextCursor;
        }

        // Sort by createdAt descending (newest first)
        allResources.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({
            success: true,
            data: {
                resources: allResources,
                nextCursor,
                folders,
            },
        });
    } catch (error) {
        console.error("List media error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list media" },
            { status: 500 }
        );
    }
}
