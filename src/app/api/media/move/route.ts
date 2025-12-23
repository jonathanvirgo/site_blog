import { NextRequest, NextResponse } from "next/server";
import { moveResource, createFolder, getFolders } from "@/lib/cloudinary";

/**
 * POST /api/media/move - Move files to a folder
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { publicIds, targetFolder, resourceType = "image" } = body;

        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "No files selected" },
                { status: 400 }
            );
        }

        const results = await Promise.all(
            publicIds.map((publicId: string) =>
                moveResource(publicId, targetFolder, resourceType)
            )
        );

        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Đã di chuyển ${successCount} file${failedCount > 0 ? `, ${failedCount} file lỗi` : ""}`,
            results,
        });
    } catch (error) {
        console.error("Move files error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to move files" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/media/move - Create a new folder
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { folderName } = body;

        if (!folderName || typeof folderName !== "string") {
            return NextResponse.json(
                { success: false, error: "Folder name is required" },
                { status: 400 }
            );
        }

        // Validate folder name
        const validName = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
        if (!validName) {
            return NextResponse.json(
                { success: false, error: "Invalid folder name" },
                { status: 400 }
            );
        }

        const created = await createFolder(validName);

        if (created) {
            // Get updated folder list
            const folders = await getFolders();
            return NextResponse.json({
                success: true,
                message: `Đã tạo folder "${validName}"`,
                folders,
            });
        } else {
            return NextResponse.json(
                { success: false, error: "Folder may already exist" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Create folder error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create folder" },
            { status: 500 }
        );
    }
}
