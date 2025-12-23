// Crawler Source Types

export interface CategoryMapping {
    id: string;
    categoryId: string;
    listPageUrl: string;
    status: "draft" | "pending_review" | "published";
    testResult?: {
        linksFound: number;
        linksWithImage: number;
        sampleLinks?: Array<{ url: string; title: string; image?: string }>;
    };
}

export interface PaginationConfig {
    type: "next_button" | "infinite_scroll" | "numbered_url";
    nextSelector?: string;
    scrollTrigger?: "scroll_end" | "click_button";
    loadMoreSelector?: string;
    scrollDelay?: number;
    urlPattern?: string;
    maxPages: number;
}

export interface Transform {
    type: "trim" | "replace" | "regex" | "toNumber" | "removeNonDigit" | "stripTags" | "maxLength" | "addPrefix" | "addSuffix" | "toLower" | "toUpper" | "formatPrice";
    find?: string;
    replace?: string;
    pattern?: string;
    flags?: string;
    max?: number;
    ellipsis?: string;
    prefix?: string;
    suffix?: string;
    separator?: string;
}

export interface FieldConfig {
    transforms?: Transform[];
    removeElements?: string[];
    removeAttributes?: string[];
}

export interface ImageFieldConfig extends FieldConfig {
    lazyLoadEnabled?: boolean;
    lazyLoadAttributes?: string[];
    uploadToCloudinary?: boolean;
    cloudinaryFolder?: string;
    maxSizeMb?: number;
    skipTrackingImages?: boolean;
    skipSmallImages?: boolean;
    minImageSize?: number;
}

export interface ArticleSelectors {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    useFrontContentImageAsFeatured?: boolean;
    contentImages?: string[];
    author?: string;
    publishDate?: string;
    // Per-field configs
    fieldConfigs?: Record<string, FieldConfig | ImageFieldConfig>;
}

export interface ProductSelectors {
    name: string;
    shortDescription?: string;
    description?: string;
    price: string;
    originalPrice?: string;
    variantPrice?: string;
    images?: string[];
    sku?: string;
    // Per-field configs
    fieldConfigs?: Record<string, FieldConfig | ImageFieldConfig>;
}

export interface SeoConfig {
    enabled: boolean;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
}

export interface CrawlSourceFormData {
    // Basic info
    name: string;
    baseUrl: string;
    crawlType: "article" | "product";
    isActive: boolean;

    // Request config
    requestDelayMs: number;
    requestTimeout: number;
    requestHeaders?: Record<string, string>;

    // SEO config
    seoConfig?: SeoConfig;

    // List page config
    listPageEnabled: boolean;
    categoryMappings: CategoryMapping[];
    listItemSelector?: string;
    listLinkSelector?: string;
    listImageSelector?: string;
    listTitleSelector?: string;
    paginationConfig?: PaginationConfig;

    // Detail selectors
    selectors: {
        article?: ArticleSelectors;
        product?: ProductSelectors;
    };
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    children?: Category[];
}
