import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Lazy load attributes to check for real image URLs
const LAZY_LOAD_ATTRS = [
    'data-src', 'data-lazy-src', 'data-original',
    'data-srcset', 'data-lazy-srcset',
    'nitro-lazy-src',
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, selector, isMultiple } = body;

        if (!url || !selector) {
            return NextResponse.json(
                { error: "Missing required parameters" },
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

        // Parse selector - handle special ::attr() syntax
        let selectorPart = selector;
        let attribute: string | null = null;

        const attrMatch = selector.match(/::attr\(([^)]+)\)$/);
        if (attrMatch) {
            selectorPart = selector.replace(/::attr\([^)]+\)$/, "").trim();
            attribute = attrMatch[1];
        }

        const elements = $(selectorPart);

        if (elements.length === 0) {
            return NextResponse.json({
                success: false,
                value: null,
                count: 0,
            });
        }

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

        if (isMultiple) {
            // Return all values for multiple items
            const values: string[] = [];
            const images: string[] = [];

            elements.each((_, el) => {
                const $el = $(el);
                let val: string;

                if (attribute) {
                    val = $el.attr(attribute) || "";
                } else if ($el.is("img")) {
                    // Get image src with lazy-load support
                    let src = $el.attr("src") || "";
                    if (!src) {
                        for (const attr of LAZY_LOAD_ATTRS) {
                            src = $el.attr(attr) || "";
                            if (src) break;
                        }
                    }
                    val = resolveUrl(src);
                    if (val) images.push(val);
                } else {
                    val = $el.text().trim();
                }

                if (val) {
                    values.push(val);
                }
            });

            return NextResponse.json({
                success: true,
                count: values.length,
                values: values,
                images: images,
            });
        } else {
            // Return full value for single selector
            const $first = elements.first();
            let value: string;
            let htmlContent: string | null = null;
            const images: string[] = [];
            const links: Array<{ url: string; text: string }> = [];

            if (attribute) {
                value = $first.attr(attribute) || "";
                // If it's an image URL, add to images
                if (value && (attribute === "src" || attribute === "content") &&
                    (value.includes(".jpg") || value.includes(".png") || value.includes(".webp") || value.includes(".gif"))) {
                    images.push(resolveUrl(value));
                }
            } else if ($first.is("img")) {
                let src = $first.attr("src") || "";
                if (!src) {
                    for (const attr of LAZY_LOAD_ATTRS) {
                        src = $first.attr(attr) || "";
                        if (src) break;
                    }
                }
                value = resolveUrl(src);
                if (value) images.push(value);
            } else if ($first.is("meta")) {
                value = $first.attr("content") || "";
            } else {
                // Get text content
                value = $first.text().trim();

                // Get HTML content for content fields
                htmlContent = $first.html() || null;

                // Extract all images from within the element
                $first.find("img").each((_, img) => {
                    const $img = $(img);
                    let src = $img.attr("src") || "";
                    if (!src) {
                        for (const attr of LAZY_LOAD_ATTRS) {
                            src = $img.attr(attr) || "";
                            if (src) break;
                        }
                    }
                    if (src) {
                        const fullUrl = resolveUrl(src);
                        if (fullUrl && !images.includes(fullUrl)) {
                            images.push(fullUrl);
                        }
                    }
                });

                // Extract all links from within the element
                $first.find("a[href]").each((_, link) => {
                    const $link = $(link);
                    const href = $link.attr("href");
                    const text = $link.text().trim();
                    if (href && text && !href.startsWith("#") && !href.startsWith("javascript:")) {
                        links.push({
                            url: resolveUrl(href),
                            text: text.substring(0, 100),
                        });
                    }
                });
            }

            return NextResponse.json({
                success: true,
                value,
                htmlContent,
                images,
                links: links.slice(0, 20), // Limit to 20 links
                charCount: value.length,
                htmlCharCount: htmlContent?.length || 0,
            });
        }
    } catch (error) {
        console.error("Error testing selector:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

