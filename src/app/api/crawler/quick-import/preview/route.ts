import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

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

interface PreviewRequest {
    url?: string;
    html?: string;
    type: "article" | "product";
    selectors: {
        title: string;
        content: string;
        excerpt?: string;
        featuredImage?: string;
        price?: string;
        originalPrice?: string;
    };
    removeSelectors?: string[];
}

// POST /api/crawler/quick-import/preview - Preview extracted content without saving
export async function POST(request: NextRequest) {
    try {
        const body: PreviewRequest = await request.json();
        const { url, html, type, selectors, removeSelectors } = body;

        // Validate - need either URL or HTML
        if (!url && !html) {
            return NextResponse.json({ error: "URL hoặc HTML là bắt buộc" }, { status: 400 });
        }

        let pageHtml: string;
        if (html) {
            pageHtml = html;
        } else if (url) {
            pageHtml = await fetchPage(url);
        } else {
            return NextResponse.json({ error: "URL hoặc HTML là bắt buộc" }, { status: 400 });
        }

        const $ = cheerio.load(pageHtml);

        // Clean HTML
        cleanHtml($, removeSelectors || []);
        resolveLazyImages($);

        // Extract data
        const title = selectors.title ? extractText($, selectors.title) : "";
        const excerpt = selectors.excerpt ? extractText($, selectors.excerpt) : "";
        
        // Get content HTML
        const $content = selectors.content ? $(selectors.content).first() : null;
        const content = $content ? $content.html() || "" : "";
        
        // Count images in content
        const images: string[] = [];
        if ($content) {
            $content.find("img").each((_, el) => {
                const src = $(el).attr("src");
                if (src) images.push(src);
            });
        }

        // Featured image
        let featuredImage: string | null = null;
        if (selectors.featuredImage) {
            const $featImg = $(selectors.featuredImage).first();
            featuredImage = $featImg.attr("src") || $featImg.attr("data-src") || null;
        }

        // Price for products
        let price: string | null = null;
        let originalPrice: string | null = null;
        if (type === "product") {
            if (selectors.price) {
                price = extractText($, selectors.price);
            }
            if (selectors.originalPrice) {
                originalPrice = extractText($, selectors.originalPrice);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                title,
                excerpt,
                content,
                featuredImage,
                images,
                imagesCount: images.length,
                price,
                originalPrice,
            },
        });
    } catch (error) {
        console.error("Preview error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Preview thất bại" },
            { status: 500 }
        );
    }
}

