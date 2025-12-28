import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Lazy load attributes to check for real image URLs
const LAZY_LOAD_ATTRS = [
    'data-src', 'data-lazy-src', 'data-original',
    'data-srcset', 'data-lazy-srcset', 'nitro-lazy-src',
];

// Common tracking/placeholder image patterns to skip
const SKIP_PATTERNS = [
    /scorecardresearch/i,
    /facebook\.com\/tr/i,
    /google-analytics/i,
    /pixel\./i,
    /beacon\./i,
    /1x1/i,
    /spacer/i,
    /placeholder/i,
    /loading\.gif/i,
];

interface DetectedImage {
    url: string;
    selector: string;
    type: 'og:image' | 'content' | 'article' | 'gallery' | 'other';
    width?: number;
    height?: number;
}

interface DetectedSelector {
    selector: string;
    type: 'featured' | 'content';
    count: number;
    sampleImages: string[];
    description: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: "Missing URL" },
                { status: 400 }
            );
        }

        // Fetch the page
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch URL" },
                { status: 400 }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const baseUrl = new URL(url).origin;

        // Helper to resolve relative URLs
        const resolveUrl = (src: string): string => {
            if (!src) return "";
            if (src.startsWith("http://") || src.startsWith("https://")) return src;
            if (src.startsWith("//")) return "https:" + src;
            try {
                return new URL(src, baseUrl).href;
            } catch {
                return src;
            }
        };

        // Helper to check if should skip image
        const shouldSkip = (url: string): boolean => {
            return SKIP_PATTERNS.some(pattern => pattern.test(url));
        };

        // Helper to get image URL from element
        const getImageUrl = ($img: cheerio.Cheerio<cheerio.Element>): string => {
            let src = $img.attr("src") || "";
            if (!src || src.startsWith("data:")) {
                for (const attr of LAZY_LOAD_ATTRS) {
                    src = $img.attr(attr) || "";
                    if (src && !src.startsWith("data:")) break;
                }
            }
            return resolveUrl(src);
        };

        const featuredSelectors: DetectedSelector[] = [];
        const contentSelectors: DetectedSelector[] = [];

        // 1. Check og:image (most common for featured image)
        const ogImage = $('meta[property="og:image"]').attr("content");
        if (ogImage) {
            featuredSelectors.push({
                selector: "meta[property='og:image']::attr(content)",
                type: 'featured',
                count: 1,
                sampleImages: [resolveUrl(ogImage)],
                description: "OpenGraph image (khuyên dùng)"
            });
        }

        // 2. Check twitter:image
        const twitterImage = $('meta[name="twitter:image"]').attr("content") ||
                             $('meta[property="twitter:image"]').attr("content");
        if (twitterImage && twitterImage !== ogImage) {
            featuredSelectors.push({
                selector: "meta[name='twitter:image']::attr(content)",
                type: 'featured',
                count: 1,
                sampleImages: [resolveUrl(twitterImage)],
                description: "Twitter card image"
            });
        }

        // 3. Common featured image selectors
        const featuredPatterns = [
            { sel: '.featured-image img', desc: 'Featured image container' },
            { sel: '.post-thumbnail img', desc: 'Post thumbnail' },
            { sel: '.entry-image img', desc: 'Entry image' },
            { sel: 'article header img', desc: 'Article header image' },
            { sel: '.hero-image img', desc: 'Hero image' },
            { sel: '[data-role="content"] > figure:first-child img', desc: 'First figure image' },
        ];

        for (const pattern of featuredPatterns) {
            const $imgs = $(pattern.sel);
            if ($imgs.length > 0) {
                const sampleUrl = getImageUrl($imgs.first());
                if (sampleUrl && !shouldSkip(sampleUrl)) {
                    featuredSelectors.push({
                        selector: pattern.sel,
                        type: 'featured',
                        count: $imgs.length,
                        sampleImages: [sampleUrl],
                        description: pattern.desc
                    });
                }
            }
        }

        // 4. Detect content image selectors
        const contentPatterns = [
            { sel: '[data-role="content"] img', desc: 'Content images (data-role)' },
            { sel: 'article.fck_detail img', desc: 'VnExpress/Soha content images' },
            { sel: '.article-content img', desc: 'Article content images' },
            { sel: '.post-content img', desc: 'Post content images' },
            { sel: '.entry-content img', desc: 'Entry content images' },
            { sel: 'article img', desc: 'All article images' },
            { sel: '.content img', desc: 'Content images' },
            { sel: 'img[data-author]', desc: 'Images with data-author (Soha)' },
        ];

        for (const pattern of contentPatterns) {
            const $imgs = $(pattern.sel);
            const validImages: string[] = [];
            
            $imgs.each((_, img) => {
                const imgUrl = getImageUrl($(img));
                if (imgUrl && !shouldSkip(imgUrl) && validImages.length < 5) {
                    validImages.push(imgUrl);
                }
            });

            if (validImages.length > 0) {
                contentSelectors.push({
                    selector: pattern.sel,
                    type: 'content',
                    count: validImages.length,
                    sampleImages: validImages,
                    description: `${pattern.desc} (${validImages.length} ảnh)`
                });
            }
        }

        return NextResponse.json({
            success: true,
            featuredSelectors,
            contentSelectors,
            pageTitle: $('title').text() || $('h1').first().text(),
        });
    } catch (error) {
        console.error("Error detecting images:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

