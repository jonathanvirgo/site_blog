import { NextRequest, NextResponse } from "next/server";
import { uploadImage, deleteImage, getSignedUploadParams } from "@/lib/cloudinary";

/**
 * GET /api/upload - Get signed params for direct browser upload
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get("folder") || "uploads";

        const signedParams = getSignedUploadParams(folder);

        return NextResponse.json(signedParams);
    } catch (error) {
        console.error("Get signed params error:", error);
        return NextResponse.json(
            { error: "Failed to get upload params" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/upload - Upload image (server-side)
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string) || "uploads";
        const publicId = formData.get("publicId") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPG, PNG, GIF, WebP" },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 10MB" },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Upload to Cloudinary
        const result = await uploadImage(base64, folder, {
            publicId: publicId || undefined,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/upload - Delete image
 */
export async function DELETE(request: NextRequest) {
    try {
        const { publicId } = await request.json();

        if (!publicId) {
            return NextResponse.json(
                { error: "Public ID is required" },
                { status: 400 }
            );
        }

        const success = await deleteImage(publicId);

        if (!success) {
            return NextResponse.json(
                { error: "Failed to delete image" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Delete failed" },
            { status: 500 }
        );
    }
}
