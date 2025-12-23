import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================== UPLOAD UTILITIES ====================

export interface UploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

/**
 * Upload image from base64 or URL
 */
export async function uploadImage(
    file: string, // base64 or URL
    folder: string = "uploads",
    options: {
        publicId?: string;
        transformation?: object;
    } = {}
): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(file, {
        folder: folder,
        public_id: options.publicId,
        transformation: options.transformation || [
            { quality: "auto", fetch_format: "auto" },
        ],
        resource_type: "auto",
    });

    return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
    };
}

/**
 * Delete image by public ID
 */
export async function deleteImage(publicId: string): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === "ok";
    } catch (error) {
        console.error("Delete image error:", error);
        return false;
    }
}

/**
 * Generate optimized image URL
 */
export function getOptimizedUrl(
    publicId: string,
    options: {
        width?: number;
        height?: number;
        crop?: "fill" | "fit" | "scale" | "thumb";
        quality?: "auto" | number;
        format?: "auto" | "webp" | "avif" | "jpg" | "png";
    } = {}
): string {
    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    transformations.push(`q_${options.quality || "auto"}`);
    transformations.push(`f_${options.format || "auto"}`);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const transform = transformations.join(",");

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

/**
 * Generate blur placeholder URL (for lazy loading)
 */
export function getBlurPlaceholder(publicId: string): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_10,e_blur:1000,q_auto:low/${publicId}`;
}

/**
 * Generate signed upload params for direct browser upload
 */
export function getSignedUploadParams(
    folder: string = "uploads"
): { signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string } {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = {
        folder,
        timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!
    );

    return {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
}

// ==================== IMAGE PRESETS ====================

export const ImagePresets = {
    // Thumbnails
    thumbnail: { width: 150, height: 150, crop: "fill" as const },
    thumbnailSmall: { width: 80, height: 80, crop: "fill" as const },

    // Article images
    articleCard: { width: 400, height: 225, crop: "fill" as const },
    articleHero: { width: 1200, height: 630, crop: "fill" as const },
    articleContent: { width: 800, crop: "scale" as const },

    // Product images
    productCard: { width: 300, height: 300, crop: "fill" as const },
    productGallery: { width: 600, height: 600, crop: "fill" as const },
    productZoom: { width: 1200, height: 1200, crop: "fill" as const },

    // Category images
    categoryBanner: { width: 800, height: 400, crop: "fill" as const },

    // User avatars
    avatar: { width: 200, height: 200, crop: "fill" as const },
    avatarSmall: { width: 40, height: 40, crop: "fill" as const },
};

// ==================== ADMIN API ====================

export interface CloudinaryResource {
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    resourceType: "image" | "video" | "raw";
    createdAt: string;
    folder: string;
}

export interface ListResourcesOptions {
    folder?: string;
    resourceType?: "image" | "video" | "raw";
    maxResults?: number;
    nextCursor?: string;
}

export interface ListResourcesResult {
    resources: CloudinaryResource[];
    nextCursor?: string;
    totalCount: number;
}

/**
 * List resources from Cloudinary using Admin API
 */
export async function listResources(
    options: ListResourcesOptions = {}
): Promise<ListResourcesResult> {
    const { folder, resourceType = "image", maxResults = 30, nextCursor } = options;

    const params: Record<string, unknown> = {
        type: "upload",
        max_results: maxResults,
        resource_type: resourceType,
    };

    if (folder) {
        params.prefix = folder;
    }

    if (nextCursor) {
        params.next_cursor = nextCursor;
    }

    const result = await cloudinary.api.resources(params);

    return {
        resources: result.resources.map((r: {
            public_id: string;
            url: string;
            secure_url: string;
            width: number;
            height: number;
            format: string;
            bytes: number;
            resource_type: string;
            created_at: string;
            folder: string;
        }) => ({
            publicId: r.public_id,
            url: r.url,
            secureUrl: r.secure_url,
            width: r.width,
            height: r.height,
            format: r.format,
            bytes: r.bytes,
            resourceType: r.resource_type as "image" | "video" | "raw",
            createdAt: r.created_at,
            folder: r.folder || "",
        })),
        nextCursor: result.next_cursor,
        totalCount: result.rate_limit_remaining,
    };
}

/**
 * Get all folders from Cloudinary
 */
export async function getFolders(): Promise<string[]> {
    try {
        const result = await cloudinary.api.root_folders();
        return result.folders.map((f: { name: string }) => f.name);
    } catch {
        return [];
    }
}

/**
 * Get subfolders of a folder
 */
export async function getSubFolders(folder: string): Promise<string[]> {
    try {
        const result = await cloudinary.api.sub_folders(folder);
        return result.folders.map((f: { path: string }) => f.path);
    } catch {
        return [];
    }
}

/**
 * Move/rename a resource to a new folder
 * @param fromPublicId - Current public_id of the resource
 * @param toFolder - Target folder path
 * @returns New public_id after move
 */
export async function moveResource(
    fromPublicId: string,
    toFolder: string,
    resourceType: "image" | "video" | "raw" = "image"
): Promise<{ success: boolean; newPublicId: string; error?: string }> {
    try {
        // Extract filename from publicId
        const parts = fromPublicId.split("/");
        const filename = parts[parts.length - 1];

        // Create new public_id with target folder
        const toPublicId = toFolder ? `${toFolder}/${filename}` : filename;

        // Skip if same location
        if (fromPublicId === toPublicId) {
            return { success: true, newPublicId: fromPublicId };
        }

        // Use Cloudinary rename API
        const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
            resource_type: resourceType,
            overwrite: false,
        });

        return {
            success: true,
            newPublicId: result.public_id,
        };
    } catch (error) {
        console.error("Move resource error:", error);
        return {
            success: false,
            newPublicId: fromPublicId,
            error: error instanceof Error ? error.message : "Move failed",
        };
    }
}

/**
 * Create a new folder in Cloudinary
 */
export async function createFolder(folderPath: string): Promise<boolean> {
    try {
        await cloudinary.api.create_folder(folderPath);
        return true;
    } catch (error) {
        console.error("Create folder error:", error);
        return false;
    }
}

export { cloudinary };

