import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as cheerio from "cheerio";
import { uploadImage } from "@/lib/cloudinary";

// Helper to generate slug from Vietnamese title
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .slice(0, 100);
}

// Fetch page content
async function fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.text();
}

// Extract text from selector
function extractText($: cheerio.CheerioAPI, selector: string): string {
    if (!selector) return "";
    return $(selector).first().text().trim();
}

// Extract HTML from selector
function extractHtml($: cheerio.CheerioAPI, selector: string): string {
    if (!selector) return "";
    return $(selector).first().html() || "";
}

// Resolve lazy load images
function resolveLazyImages($: cheerio.CheerioAPI) {
    const lazyAttrs = ["data-src", "data-lazy-src", "data-original", "data-srcset", "data-lazy"];
    $("img").each((_, el) => {
        const $img = $(el);
        for (const attr of lazyAttrs) {
            const lazySrc = $img.attr(attr);
            if (lazySrc && !lazySrc.startsWith("data:")) {
                $img.attr("src", lazySrc);
                break;
            }
        }
    });
}

// Remove unwanted elements
function cleanHtml($: cheerio.CheerioAPI, removeSelectors: string[]) {
    const defaultRemove = ["script", "style", "noscript", "iframe", ".ads", ".advertisement", ".social-share"];
    const allSelectors = [...defaultRemove, ...removeSelectors];
    allSelectors.forEach(sel => {
        try { $(sel).remove(); } catch { /* ignore */ }
    });
}

// Upload image to Cloudinary and return new URL
async function uploadImageToCloudinary(imageUrl: string, folder: string): Promise<string | null> {
    try {
        // Skip data URIs and SVGs
        if (imageUrl.startsWith("data:") || imageUrl.endsWith(".svg")) {
            return imageUrl;
        }
        const result = await uploadImage(imageUrl, folder);
        return result.secureUrl;
    } catch (error) {
        console.error("Failed to upload image:", imageUrl, error);
        return null;
    }
}

// Process content images - upload to Cloudinary and replace URLs
async function processContentImages(
    $: cheerio.CheerioAPI,
    contentSelector: string,
    folder: string,
    uploadEnabled: boolean
): Promise<{ content: string; images: string[]; uploadedCount: number }> {
    const images: string[] = [];
    let uploadedCount = 0;
    
    const $content = $(contentSelector).first();
    
    if (uploadEnabled) {
        const imgElements = $content.find("img").toArray();
        
        for (const el of imgElements) {
            const $img = $(el);
            const src = $img.attr("src");
            if (!src) continue;
            
            images.push(src);
            const newUrl = await uploadImageToCloudinary(src, folder);
            if (newUrl && newUrl !== src) {
                $img.attr("src", newUrl);
                uploadedCount++;
            }
        }
    } else {
        $content.find("img").each((_, el) => {
            const src = $(el).attr("src");
            if (src) images.push(src);
        });
    }
    
    return {
        content: $content.html() || "",
        images,
        uploadedCount,
    };
}

interface QuickImportRequest {
    url?: string;
    html?: string;
    htmlTitle?: string;
    type: "article" | "product";
    selectors: {
        title: string;
        content: string;
        excerpt?: string;
        featuredImage?: string;
        price?: string;
        originalPrice?: string;
    };
    categoryId: string;
    status: string;
    uploadImages: boolean;
    removeSelectors?: string[];
    cloudinaryFolder?: string;
}

// POST /api/crawler/quick-import - Import content from URL or HTML
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: QuickImportRequest = await request.json();
        const { url, html, htmlTitle, type, selectors, categoryId, status, uploadImages, removeSelectors, cloudinaryFolder } = body;

        // Validate - need either URL or HTML
        if (!url && !html) {
            return NextResponse.json(
                { error: "URL hoặc HTML là bắt buộc" },
                { status: 400 }
            );
        }

        let pageHtml: string;
        let baseUrl: string | undefined;

        if (html) {
            // Direct HTML input
            pageHtml = html;
        } else if (url) {
            // Fetch from URL
            pageHtml = await fetchPage(url);
            baseUrl = url;
        } else {
            return NextResponse.json({ error: "URL hoặc HTML là bắt buộc" }, { status: 400 });
        }

        const $ = cheerio.load(pageHtml);

        // Clean HTML
        cleanHtml($, removeSelectors || []);
        resolveLazyImages($);

        // Extract data
        let title: string;
        if (html && htmlTitle) {
            // Use provided title for HTML input
            title = htmlTitle;
        } else {
            title = extractText($, selectors.title);
        }

        if (!title) {
            return NextResponse.json(
                { error: "Không tìm thấy tiêu đề. Vui lòng nhập tiêu đề hoặc kiểm tra selector: " + selectors.title },
                { status: 400 }
            );
        }

        const excerpt = selectors.excerpt ? extractText($, selectors.excerpt) : "";
        const folder = cloudinaryFolder || (type === "article" ? "articles" : "products");

        // Process content and images
        const { content, images, uploadedCount } = await processContentImages(
            $,
            selectors.content,
            folder,
            uploadImages
        );

        if (!content) {
            return NextResponse.json(
                { error: "Không tìm thấy nội dung với selector: " + selectors.content },
                { status: 400 }
            );
        }

        // Featured image
        let featuredImage: string | null = null;
        if (selectors.featuredImage) {
            const $featImg = $(selectors.featuredImage).first();
            featuredImage = $featImg.attr("src") || $featImg.attr("data-src") || null;

            if (featuredImage && uploadImages) {
                const uploaded = await uploadImageToCloudinary(featuredImage, folder);
                if (uploaded) featuredImage = uploaded;
            }
        }

        // Price for products
        let price: number | null = null;
        let originalPrice: number | null = null;
        if (type === "product") {
            if (selectors.price) {
                const priceText = extractText($, selectors.price);
                price = parseFloat(priceText.replace(/[^\d]/g, "")) || null;
            }
            if (selectors.originalPrice) {
                const origText = extractText($, selectors.originalPrice);
                originalPrice = parseFloat(origText.replace(/[^\d]/g, "")) || null;
            }
        }

        // Generate slug
        const slug = generateSlug(title);

        // Check for duplicates (only for URL imports)
        if (url) {
            const existingByUrl = type === "article"
                ? await prisma.article.findFirst({ where: { sourceUrl: url } })
                : await prisma.product.findFirst({ where: { sourceUrl: url } });

            if (existingByUrl) {
                return NextResponse.json(
                    { error: "URL này đã được import trước đó", duplicate: true },
                    { status: 400 }
                );
            }
        }

        const existingBySlug = type === "article"
            ? await prisma.article.findUnique({ where: { slug } })
            : await prisma.product.findUnique({ where: { slug } });

        if (existingBySlug) {
            return NextResponse.json(
                { error: `Slug "${slug}" đã tồn tại`, slugConflict: true },
                { status: 400 }
            );
        }

        // Create record
        let createdItem;
        if (type === "article") {
            createdItem = await prisma.article.create({
                data: {
                    title,
                    slug,
                    excerpt: excerpt || null,
                    content,
                    featuredImage,
                    authorId: userId,
                    categoryId: categoryId || null,
                    status: status as "draft" | "published",
                    sourceUrl: url,
                    publishedAt: status === "published" ? new Date() : null,
                },
            });
        } else {
            createdItem = await prisma.product.create({
                data: {
                    name: title,
                    slug,
                    description: content,
                    images: JSON.stringify(images),
                    categoryId: categoryId || null,
                    status: status as "draft" | "active",
                    sourceUrl: url,
                },
            });

            // Create variant if price exists
            if (price) {
                await prisma.productVariant.create({
                    data: {
                        productId: createdItem.id,
                        sku: `SKU-${Date.now()}`,
                        price,
                        salePrice: originalPrice || null,
                        stockQuantity: 0,
                        isDefault: true,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Đã import thành công: ${title}`,
            data: {
                id: createdItem.id,
                title,
                slug,
                excerpt,
                featuredImage,
                imagesFound: images.length,
                imagesUploaded: uploadedCount,
                price,
                originalPrice,
            },
        });
    } catch (error) {
        console.error("Quick import error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Import thất bại" },
            { status: 500 }
        );
    }
}

