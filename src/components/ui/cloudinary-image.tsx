"use client";

import Image, { ImageProps } from "next/image";

interface CloudinaryImageProps extends Omit<ImageProps, "src" | "loader"> {
    publicId: string;
    cloudName?: string;
}

/**
 * Cloudinary-optimized Image component
 * Automatically uses Cloudinary's CDN and transformations
 */
export function CloudinaryImage({
    publicId,
    cloudName,
    width,
    height,
    alt,
    ...props
}: CloudinaryImageProps) {
    const cloud = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // Build optimized URL with auto format and quality
    const transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push("c_fill", "q_auto", "f_auto");

    const src = `https://res.cloudinary.com/${cloud}/image/upload/${transformations.join(",")}/${publicId}`;

    // Blur placeholder for lazy loading
    const blurDataURL = `https://res.cloudinary.com/${cloud}/image/upload/w_10,e_blur:1000,q_auto:low/${publicId}`;

    return (
        <Image
            src={src}
            width={typeof width === "number" ? width : parseInt(width as string)}
            height={typeof height === "number" ? height : parseInt(height as string)}
            alt={alt}
            placeholder="blur"
            blurDataURL={blurDataURL}
            {...props}
        />
    );
}

/**
 * Get responsive srcSet for different screen sizes
 */
export function getResponsiveSrcSet(
    publicId: string,
    sizes: number[] = [320, 640, 1024, 1280, 1920]
): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    return sizes
        .map((size) => {
            const url = `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},q_auto,f_auto/${publicId}`;
            return `${url} ${size}w`;
        })
        .join(", ");
}

/**
 * Simple img tag with Cloudinary optimization
 */
interface OptimizedImageProps {
    publicId: string;
    alt: string;
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "scale" | "thumb";
    className?: string;
    priority?: boolean;
}

export function OptimizedImage({
    publicId,
    alt,
    width,
    height,
    crop = "fill",
    className,
}: OptimizedImageProps) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const transforms = ["q_auto", "f_auto"];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);

    const src = `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
    const blurSrc = `https://res.cloudinary.com/${cloudName}/image/upload/w_20,e_blur:500/${publicId}`;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            style={{
                backgroundImage: `url(${blurSrc})`,
                backgroundSize: "cover",
            }}
        />
    );
}
