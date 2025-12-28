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
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.text();
}

interface ExtractLinksRequest {
    url: string;
    linkSelector?: string;  // CSS selector for links, default "a[href]"
    containerSelector?: string;  // Optional container selector
    filterPattern?: string;  // Regex pattern to filter URLs
    excludePattern?: string;  // Regex pattern to exclude URLs
    limit?: number;  // Max number of links to return
}

interface ExtractedLink {
    url: string;
    title: string;
    index: number;
}

// POST /api/crawler/extract-links - Extract links from a category/list page
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId || !["admin", "editor"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ExtractLinksRequest = await request.json();
        const { 
            url, 
            linkSelector = "a[href]", 
            containerSelector,
            filterPattern,
            excludePattern,
            limit = 100 
        } = body;

        if (!url) {
            return NextResponse.json({ error: "URL là bắt buộc" }, { status: 400 });
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
            if (["localhost", "127.0.0.1", "0.0.0.0"].some(h => parsedUrl.hostname.includes(h))) {
                return NextResponse.json({ error: "Cannot extract from local URLs" }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: "URL không hợp lệ" }, { status: 400 });
        }

        const baseUrl = parsedUrl.origin;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        const links: ExtractedLink[] = [];
        const seenUrls = new Set<string>();
        
        // Compile regex patterns
        let filterRegex: RegExp | null = null;
        let excludeRegex: RegExp | null = null;
        
        if (filterPattern) {
            try {
                filterRegex = new RegExp(filterPattern, "i");
            } catch {
                return NextResponse.json({ error: "Filter pattern không hợp lệ" }, { status: 400 });
            }
        }
        
        if (excludePattern) {
            try {
                excludeRegex = new RegExp(excludePattern, "i");
            } catch {
                return NextResponse.json({ error: "Exclude pattern không hợp lệ" }, { status: 400 });
            }
        }

        // Select container if specified
        const $container = containerSelector ? $(containerSelector) : $("body");
        
        // Find all links
        $container.find(linkSelector).each((index, element) => {
            if (links.length >= limit) return false;
            
            const $el = $(element);
            let href = $el.attr("href");
            
            if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
                return;
            }

            // Resolve relative URLs
            if (!href.startsWith("http")) {
                try {
                    href = new URL(href, baseUrl).href;
                } catch {
                    return;
                }
            }

            // Apply filters
            if (filterRegex && !filterRegex.test(href)) return;
            if (excludeRegex && excludeRegex.test(href)) return;

            // Skip duplicates
            if (seenUrls.has(href)) return;
            seenUrls.add(href);

            const title = $el.text().trim() || $el.attr("title") || "";
            
            links.push({
                url: href,
                title: title.substring(0, 200),
                index: links.length,
            });
        });

        return NextResponse.json({
            success: true,
            sourceUrl: url,
            linksFound: links.length,
            links,
        });

    } catch (error) {
        console.error("Extract links error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Lỗi khi trích xuất links" },
            { status: 500 }
        );
    }
}

