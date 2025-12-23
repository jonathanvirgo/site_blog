import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, itemSelector, linkSelector, imageSelector, titleSelector } = body;

        if (!url || !itemSelector || !linkSelector) {
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

        const items = $(itemSelector);
        const links: Array<{ url: string; title: string; image?: string }> = [];
        let linksWithImage = 0;

        items.each((_, element) => {
            const $item = $(element);

            // Get link
            const $link = $item.find(linkSelector).first();
            let linkUrl = $link.attr("href") || "";

            // Handle relative URLs
            if (linkUrl && !linkUrl.startsWith("http")) {
                try {
                    const baseUrl = new URL(url);
                    linkUrl = new URL(linkUrl, baseUrl.origin).href;
                } catch {
                    // Keep relative URL if parsing fails
                }
            }

            // Get title
            let title = "";
            if (titleSelector) {
                title = $item.find(titleSelector).first().text().trim();
            }
            if (!title) {
                title = $link.text().trim();
            }

            // Get image
            let image: string | undefined;
            if (imageSelector) {
                const $img = $item.find(imageSelector).first();
                image = $img.attr("src") || $img.attr("data-src") || $img.attr("data-original");

                if (image && !image.startsWith("http")) {
                    try {
                        const baseUrl = new URL(url);
                        image = new URL(image, baseUrl.origin).href;
                    } catch {
                        image = undefined;
                    }
                }

                if (image) {
                    linksWithImage++;
                }
            }

            if (linkUrl) {
                links.push({ url: linkUrl, title, image });
            }
        });

        return NextResponse.json({
            success: true,
            linksFound: links.length,
            linksWithImage,
            sampleLinks: links.slice(0, 5),
        });
    } catch (error) {
        console.error("Error testing list page:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
