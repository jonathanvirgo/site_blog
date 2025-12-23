/**
 * Content Crawler Library
 * Extracts content from external websites using CSS selectors
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

// ==================== TYPES ====================

export interface CrawlSourceConfig {
    selectors: {
        article?: ArticleSelectors;
        product?: ProductSelectors;
    };
    transforms?: Record<string, Transform[]>;
    removeElements?: string[];
    seoConfig?: SeoConfig;
    imageConfig?: ImageConfig;
    paginationConfig?: PaginationConfig;
    requestHeaders?: Record<string, string>;
    requestDelayMs?: number;
}

export interface ArticleSelectors {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author?: string;
    publishDate?: string;
}

export interface ProductSelectors {
    name: string;
    price: string;
    originalPrice?: string;
    description?: string;
    images?: string;
    sku?: string;
}

export interface Transform {
    type: 'trim' | 'stripTags' | 'replace' | 'regex' | 'maxLength' | 'toNumber' |
    'toLower' | 'toUpper' | 'removeEmptyTags' | 'decodeHtml' | 'addPrefix' | 'addSuffix';
    find?: string;
    replace?: string;
    pattern?: string;
    value?: number | string;
    ellipsis?: string;
}

export interface SeoConfig {
    extractMeta?: boolean;
    metaTitleSelector?: string;
    metaDescriptionSelector?: string;
}

export interface ImageConfig {
    maxSizeMB?: number;
    cloudinaryFolder?: string;
    skipPatterns?: string[];
}

export interface PaginationConfig {
    enabled: boolean;
    type: 'numbered' | 'next_link';
    maxPages?: number;
    nextSelector?: string;
    pageParam?: string;
    delay?: number;
}

export interface ExtractedArticle {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author?: string;
    publishDate?: string;
    metaTitle?: string;
    metaDescription?: string;
    images: string[];
}

export interface ExtractedProduct {
    name: string;
    price: number | null;
    originalPrice?: number | null;
    description?: string;
    images: string[];
    sku?: string;
    metaTitle?: string;
    metaDescription?: string;
}

// ==================== CONSTANTS ====================

// Elements to remove by default
const DEFAULT_REMOVE_ELEMENTS = [
    'script', 'style', 'noscript', 'template',
    'iframe', 'form', 'input', 'button', 'select', 'textarea',
    'nav', 'header', 'footer', 'aside',
    '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
    'video', 'audio', 'canvas', 'object', 'embed', 'svg',
    '.advertisement', '.ads', '.ad-container', '[data-ad]',
    '.social-share', '.share-buttons', '.like-buttons',
    '.comment-section', '.comments', '.fb-comments',
    '.related-posts', '.related-articles',
    '.breadcrumb', '.pagination',
    '.newsletter-signup', '.popup', '.modal',
];

// Attributes to remove
const REMOVE_ATTRIBUTES = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup',
    'data-ga', 'data-gtm', 'data-analytics', 'data-tracking',
    'data-action', 'data-controller', 'data-target', 'data-toggle',
];

// Lazy load attributes to check for real image URLs
const LAZY_LOAD_ATTRS = [
    'data-src', 'data-lazy-src', 'data-original',
    'data-srcset', 'data-lazy-srcset',
    'data-bg', 'data-background-image',
    'nitro-lazy-src',
];

// Patterns to skip when extracting images
const DEFAULT_SKIP_IMAGE_PATTERNS = [
    /1x1\./, /pixel\./, /beacon\./, /\.gif\?/,
    /gravatar/, /avatar/, /icon/i, /logo/i,
    /placeholder/, /blank\./, /spacer\./,
    /doubleclick/, /googlesyndication/,
];

// ==================== MAIN FUNCTIONS ====================

/**
 * Fetch HTML content from a URL
 */
export async function fetchPage(
    url: string,
    headers?: Record<string, string>
): Promise<string> {
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        ...headers
    };

    const response = await fetch(url, {
        headers: defaultHeaders,
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
}

/**
 * Extract article content from HTML
 */
export function extractArticle(
    html: string,
    selectors: ArticleSelectors,
    config?: CrawlSourceConfig,
    baseUrl?: string
): ExtractedArticle {
    const $ = cheerio.load(html);

    // Clean the HTML first
    cleanHtml($, config?.removeElements);

    // Resolve lazy-loaded images
    resolveLazyImages($);

    // Extract fields
    const title = extractField($, selectors.title, config?.transforms?.title);
    const content = extractField($, selectors.content, config?.transforms?.content, true);
    const excerpt = selectors.excerpt
        ? extractField($, selectors.excerpt, config?.transforms?.excerpt)
        : undefined;
    const featuredImage = selectors.featuredImage
        ? extractImageUrl($, selectors.featuredImage, baseUrl)
        : undefined;
    const author = selectors.author
        ? extractField($, selectors.author, config?.transforms?.author)
        : undefined;
    const publishDate = selectors.publishDate
        ? extractField($, selectors.publishDate)
        : undefined;

    // Extract SEO metadata
    const seo = extractSeoMetadata($, config?.seoConfig);

    // Extract all images from content
    const images = extractImages($, selectors.content, baseUrl, config?.imageConfig);

    return {
        title,
        content,
        excerpt,
        featuredImage,
        author,
        publishDate,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        images,
    };
}

/**
 * Extract product content from HTML
 */
export function extractProduct(
    html: string,
    selectors: ProductSelectors,
    config?: CrawlSourceConfig,
    baseUrl?: string
): ExtractedProduct {
    const $ = cheerio.load(html);

    // Clean the HTML first
    cleanHtml($, config?.removeElements);

    // Resolve lazy-loaded images
    resolveLazyImages($);

    // Extract fields
    const name = extractField($, selectors.name, config?.transforms?.name);
    const priceText = extractField($, selectors.price, config?.transforms?.price);
    const price = parsePrice(priceText);

    const originalPriceText = selectors.originalPrice
        ? extractField($, selectors.originalPrice, config?.transforms?.originalPrice)
        : undefined;
    const originalPrice = originalPriceText ? parsePrice(originalPriceText) : undefined;

    const description = selectors.description
        ? extractField($, selectors.description, config?.transforms?.description, true)
        : undefined;

    const sku = selectors.sku
        ? extractField($, selectors.sku, config?.transforms?.sku)
        : undefined;

    // Extract SEO metadata
    const seo = extractSeoMetadata($, config?.seoConfig);

    // Extract images
    const images = selectors.images
        ? extractImages($, selectors.images, baseUrl, config?.imageConfig)
        : [];

    return {
        name,
        price,
        originalPrice,
        description,
        images,
        sku,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
    };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Clean HTML by removing unwanted elements and attributes
 */
function cleanHtml($: CheerioAPI, customRemove?: string[]): void {
    // Remove unwanted elements
    const allSelectors = [...DEFAULT_REMOVE_ELEMENTS, ...(customRemove || [])];
    allSelectors.forEach(selector => {
        try {
            $(selector).remove();
        } catch {
            // Ignore invalid selectors
        }
    });

    // Remove unwanted attributes
    $('*').each((_, el) => {
        REMOVE_ATTRIBUTES.forEach(attr => {
            $(el).removeAttr(attr);
        });
    });
}

/**
 * Resolve lazy-loaded images to their actual src
 */
function resolveLazyImages($: CheerioAPI): void {
    $('img').each((_, el) => {
        const $img = $(el);
        for (const attr of LAZY_LOAD_ATTRS) {
            const lazySrc = $img.attr(attr);
            if (lazySrc && (lazySrc.startsWith('http') || lazySrc.startsWith('/'))) {
                $img.attr('src', lazySrc);
                $img.removeAttr(attr);
                break;
            }
        }
    });
}

/**
 * Extract a single field using selector and apply transforms
 */
function extractField(
    $: CheerioAPI,
    selector: string,
    transforms?: Transform[],
    keepHtml: boolean = false
): string {
    const element = $(selector).first();

    if (element.length === 0) {
        return '';
    }

    let value = keepHtml ? element.html() || '' : element.text();

    // Apply transforms
    if (transforms && transforms.length > 0) {
        value = applyTransforms(value, transforms);
    } else {
        // Default trim
        value = value.trim();
    }

    return value;
}

/**
 * Extract image URL from selector (handles various formats)
 */
function extractImageUrl($: CheerioAPI, selector: string, baseUrl?: string): string | undefined {
    // Handle attribute selectors like "meta[property='og:image']::attr(content)"
    if (selector.includes('::attr(')) {
        const [selectorPart, attrPart] = selector.split('::attr(');
        const attr = attrPart.replace(')', '');
        const value = $(selectorPart).first().attr(attr);
        return value ? resolveUrl(value, baseUrl) : undefined;
    }

    const element = $(selector).first();
    if (element.length === 0) return undefined;

    // Try src, then data-src variants
    let src = element.attr('src');
    if (!src) {
        for (const attr of LAZY_LOAD_ATTRS) {
            src = element.attr(attr);
            if (src) break;
        }
    }

    return src ? resolveUrl(src, baseUrl) : undefined;
}

/**
 * Extract all images from a content selector
 */
function extractImages(
    $: CheerioAPI,
    contentSelector: string,
    baseUrl?: string,
    imageConfig?: ImageConfig
): string[] {
    const images = new Set<string>();
    const skipPatterns = imageConfig?.skipPatterns?.map(p => new RegExp(p)) || DEFAULT_SKIP_IMAGE_PATTERNS;

    // Find all images within the content area
    $(contentSelector).find('img').each((_, el) => {
        let src = $(el).attr('src');

        // Try lazy-load attributes if src is missing
        if (!src) {
            for (const attr of LAZY_LOAD_ATTRS) {
                src = $(el).attr(attr);
                if (src) break;
            }
        }

        if (src) {
            const fullUrl = resolveUrl(src, baseUrl);
            if (fullUrl && isValidImageUrl(fullUrl, skipPatterns)) {
                images.add(fullUrl);
            }
        }
    });

    // Also check for OG image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
        const fullUrl = resolveUrl(ogImage, baseUrl);
        if (fullUrl && isValidImageUrl(fullUrl, skipPatterns)) {
            images.add(fullUrl);
        }
    }

    return Array.from(images);
}

/**
 * Extract SEO metadata from page
 */
function extractSeoMetadata($: CheerioAPI, config?: SeoConfig): { metaTitle?: string; metaDescription?: string } {
    if (config?.extractMeta === false) {
        return {};
    }

    // Title priority: og:title > title tag > h1
    const metaTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim() ||
        $('h1').first().text().trim();

    // Description priority: og:description > meta description
    const metaDescription =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content');

    return {
        metaTitle: metaTitle ? metaTitle.slice(0, 200) : undefined,
        metaDescription: metaDescription ? metaDescription.slice(0, 500) : undefined,
    };
}

/**
 * Apply text transforms to a value
 */
export function applyTransforms(value: string, transforms: Transform[]): string {
    let result = value;

    for (const t of transforms) {
        switch (t.type) {
            case 'trim':
                result = result.trim();
                break;
            case 'stripTags':
                result = result.replace(/<[^>]*>/g, '');
                break;
            case 'replace':
                if (t.find !== undefined) {
                    result = result.replaceAll(t.find, t.replace || '');
                }
                break;
            case 'regex':
                if (t.pattern) {
                    try {
                        result = result.replace(new RegExp(t.pattern, 'g'), t.replace || '');
                    } catch {
                        // Invalid regex, skip
                    }
                }
                break;
            case 'maxLength':
                if (typeof t.value === 'number' && result.length > t.value) {
                    result = result.slice(0, t.value) + (t.ellipsis || '');
                }
                break;
            case 'toNumber':
                result = result.replace(/[^\d]/g, '');
                break;
            case 'toLower':
                result = result.toLowerCase();
                break;
            case 'toUpper':
                result = result.toUpperCase();
                break;
            case 'removeEmptyTags':
                result = result.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '');
                break;
            case 'decodeHtml':
                result = decodeHtmlEntities(result);
                break;
            case 'addPrefix':
                if (typeof t.value === 'string') {
                    result = t.value + result;
                }
                break;
            case 'addSuffix':
                if (typeof t.value === 'string') {
                    result = result + t.value;
                }
                break;
        }
    }

    return result;
}

/**
 * Parse price from string (Vietnamese format)
 */
function parsePrice(priceText: string): number | null {
    if (!priceText) return null;

    // Remove all non-numeric characters except decimal point
    const cleaned = priceText.replace(/[^\d.,]/g, '');

    // Handle Vietnamese format (1.000.000 or 1,000,000)
    // Remove thousand separators and keep decimal
    const normalized = cleaned
        .replace(/\./g, '') // Remove dots as thousand separator
        .replace(/,/g, ''); // Remove commas as thousand separator

    const price = parseInt(normalized, 10);
    return isNaN(price) ? null : price;
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl?: string): string {
    if (!url) return '';

    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Protocol-relative
    if (url.startsWith('//')) {
        return 'https:' + url;
    }

    // Relative URL
    if (baseUrl) {
        try {
            return new URL(url, baseUrl).href;
        } catch {
            return url;
        }
    }

    return url;
}

/**
 * Check if image URL is valid (not a tracking pixel, etc.)
 */
function isValidImageUrl(url: string, skipPatterns: RegExp[]): boolean {
    return !skipPatterns.some(pattern => pattern.test(url));
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
    };

    return text.replace(/&[^;]+;/g, match => entities[match] || match);
}

/**
 * Test selectors against a URL (for preview)
 */
export async function testSelectors(
    url: string,
    selectors: Record<string, string>,
    headers?: Record<string, string>
): Promise<Record<string, { found: boolean; value: string; count: number }>> {
    const html = await fetchPage(url, headers);
    const $ = cheerio.load(html);

    const results: Record<string, { found: boolean; value: string; count: number }> = {};

    for (const [field, selector] of Object.entries(selectors)) {
        try {
            const elements = $(selector);
            const count = elements.length;
            const value = count > 0 ? elements.first().text().trim().slice(0, 200) : '';

            results[field] = {
                found: count > 0,
                value,
                count,
            };
        } catch {
            results[field] = {
                found: false,
                value: 'Invalid selector',
                count: 0,
            };
        }
    }

    return results;
}

/**
 * Check if a URL has already been crawled
 */
export function normalizeUrl(url: string, ignoreParams: string[] = []): string {
    try {
        const parsed = new URL(url);

        // Remove tracking parameters
        const defaultIgnore = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ref'];
        [...defaultIgnore, ...ignoreParams].forEach(param => {
            parsed.searchParams.delete(param);
        });

        // Normalize
        return parsed.href.toLowerCase().replace(/\/$/, '');
    } catch {
        return url.toLowerCase();
    }
}
