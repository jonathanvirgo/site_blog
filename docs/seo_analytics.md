# SEO & Analytics Strategy

## 1. SEO Requirements

### 1.1 Meta Tags (Dynamic per Page)

#### Homepage
```html
<title>YourSite - Tin tức sức khỏe & Sản phẩm chất lượng</title>
<meta name="description" content="Cập nhật tin tức sức khỏe, dinh dưỡng, làm đẹp và mua sắm sản phẩm chất lượng cao.">
```

#### Article Page
```typescript
// app/article/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.featuredImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.fullName],
      section: article.category.name
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.featuredImage]
    }
  };
}
```

#### Product Page
```typescript
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  
  return {
    title: `${product.name} - Mua ngay | YourSite`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      images: product.images.map(img => ({ url: img })),
      type: 'product'
    }
  };
}
```

---

### 1.2 Structured Data (JSON-LD)

#### Article Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "10 cách giảm đau lưng hiệu quả",
  "image": "https://cdn.../featured.jpg",
  "datePublished": "2024-12-15T10:00:00Z",
  "dateModified": "2024-12-16T08:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Dr. Nguyen Van A"
  },
  "publisher": {
    "@type": "Organization",
    "name": "YourSite",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://yoursite.com/article/10-cach-giam-dau-lung"
  }
}
```

#### Product Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Vitamin C 1000mg",
  "image": ["https://cdn.../product1.jpg", "https://cdn.../product2.jpg"],
  "description": "Viên uống bổ sung Vitamin C...",
  "sku": "VIT-C-1000",
  "brand": {
    "@type": "Brand",
    "name": "HealthPlus"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://yoursite.com/shop/vitamin-c-1000mg",
    "priceCurrency": "VND",
    "price": 199000,
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "YourSite"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "24"
  }
}
```

#### Breadcrumb Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://yoursite.com" },
    { "@type": "ListItem", "position": 2, "name": "Sức khỏe", "item": "https://yoursite.com/category/suc-khoe" },
    { "@type": "ListItem", "position": 3, "name": "10 cách giảm đau lưng" }
  ]
}
```

---

### 1.3 URL Structure

#### Good URLs ✅
```
/article/10-cach-giam-dau-lung-hieu-qua
/shop/vitamin-c-1000mg
/category/suc-khoe
/search?q=vitamin
```

#### Bad URLs ❌
```
/article?id=123
/product.php?pid=456
/cat/1/subcat/2
```

---

### 1.4 Technical SEO

#### Sitemap
```xml
<!-- /sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yoursite.com/article/10-cach-giam-dau-lung</loc>
    <lastmod>2024-12-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

#### Robots.txt
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/

Sitemap: https://yoursite.com/sitemap.xml
```

#### Canonical URLs
```html
<link rel="canonical" href="https://yoursite.com/article/current-slug" />
```

---

### 1.5 Admin SEO Configuration

The admin panel provides SEO configuration for all content types. When custom SEO fields are not set, the system automatically uses content-derived fallback values.

#### Configurable Fields

| Content Type | Meta Title Fallback | Meta Description Fallback | OG Image |
|--------------|--------------------|-----------------------------|----------|
| **Article** | `article.title` | `article.excerpt` | `article.featuredImage` |
| **Product** | `product.name` | `product.shortDescription` | `product.images[0]` |
| **Category** | `category.name` | `category.description` | `category.image` |

#### Admin UI Location

- **Articles**: Edit Article → SEO Card (sidebar)
- **Products**: Edit Product → SEO Card (sidebar)
- **Categories**: Category Management → Edit Modal → SEO fields

#### SEO Best Practices for Content Editors

| Field | Recommended Length | Tips |
|-------|-------------------|------|
| **Meta Title** | 50-60 characters | Include primary keyword, brand name optional |
| **Meta Description** | 150-160 characters | Write compelling copy with call-to-action |

> **Note**: If SEO fields are left empty, the system will automatically use the content's title and excerpt/description as fallbacks. This ensures all pages always have proper meta tags.

---

## 2. Performance Targets (Core Web Vitals)

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Main content load time |
| **FID** (First Input Delay) | < 100ms | Interactivity responsiveness |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |
| **FCP** (First Contentful Paint) | < 1.5s | First paint |
| **TTI** (Time to Interactive) | < 3.5s | Full interactivity |
| **Lighthouse Score** | 90+ | All categories |

### Optimization Strategies
- **Image Optimization**: Next.js Image component, WebP format, lazy loading
- **Code Splitting**: Dynamic imports, route-based splitting
- **Caching**: Redis for API, CDN for static assets
- **SSR/SSG**: Use Static Generation for articles, ISR for products
- **Font Optimization**: Use `next/font`, subset fonts

---

## 3. Analytics (Google Analytics 4)

### 3.1 Key Events to Track

#### Content Events
```javascript
// View article
gtag('event', 'view_article', {
  article_id: article.id,
  article_title: article.title,
  category: article.category.name,
  author: article.author.fullName
});

// Scroll depth
gtag('event', 'scroll_depth', {
  article_id: article.id,
  percent: 50 // 25, 50, 75, 100
});

// Time on page
gtag('event', 'time_on_page', {
  article_id: article.id,
  seconds: 120
});
```

#### E-commerce Events
```javascript
// View product (from article)
gtag('event', 'view_item', {
  currency: 'VND',
  value: product.salePrice || product.price,
  items: [{
    item_id: product.id,
    item_name: product.name,
    item_category: product.category.name,
    price: product.salePrice || product.price
  }],
  source: 'article_sidebar' // or 'article_inline', 'shop_page'
});

// Add to cart
gtag('event', 'add_to_cart', {
  currency: 'VND',
  value: product.price * quantity,
  items: [{
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: quantity
  }]
});

// Begin checkout
gtag('event', 'begin_checkout', {
  currency: 'VND',
  value: cart.total,
  items: cart.items.map(item => ({
    item_id: item.product.id,
    item_name: item.product.name,
    price: item.product.price,
    quantity: item.quantity
  }))
});

// Purchase
gtag('event', 'purchase', {
  transaction_id: order.orderNumber,
  value: order.totalAmount,
  currency: 'VND',
  shipping: order.shippingFee,
  items: order.items.map(item => ({
    item_id: item.productId,
    item_name: item.productName,
    price: item.productPrice,
    quantity: item.quantity
  }))
});
```

### 3.2 Custom Dimensions
| Dimension | Description |
|-----------|-------------|
| `user_type` | guest, customer, editor, admin |
| `article_category` | Category of viewed article |
| `traffic_source` | organic, social, direct, referral |
| `device_type` | desktop, mobile, tablet |

### 3.3 Conversion Funnels
1. **Article to Purchase**
   - View Article → View Product → Add to Cart → Checkout → Purchase

2. **Shop Funnel**
   - Shop Page → Product Detail → Add to Cart → Checkout → Purchase

---

## 4. Custom Dashboard Metrics (Admin)

### Key Metrics Queries

#### Article Performance
```sql
SELECT 
  a.id,
  a.title,
  a.view_count,
  COUNT(DISTINCT ap.product_id) as linked_products,
  COALESCE(SUM(oi.quantity), 0) as products_sold
FROM articles a
LEFT JOIN article_products ap ON a.id = ap.article_id
LEFT JOIN order_items oi ON ap.product_id = oi.product_id
WHERE a.published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY a.id
ORDER BY a.view_count DESC
LIMIT 10;
```

#### Content-to-Commerce Conversion Rate
```sql
-- How many article views lead to product purchases?
SELECT 
  DATE(a.published_at) as date,
  SUM(a.view_count) as total_views,
  COUNT(DISTINCT o.id) as orders,
  ROUND(COUNT(DISTINCT o.id) / SUM(a.view_count) * 100, 2) as conversion_rate
FROM articles a
LEFT JOIN article_products ap ON a.id = ap.article_id
LEFT JOIN order_items oi ON ap.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE a.published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(a.published_at)
ORDER BY date DESC;
```

#### Top Converting Articles
```sql
SELECT 
  a.title,
  a.view_count,
  COUNT(DISTINCT o.id) as orders_generated,
  SUM(o.total_amount) as revenue_generated
FROM articles a
JOIN article_products ap ON a.id = ap.article_id
JOIN order_items oi ON ap.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY a.id
ORDER BY revenue_generated DESC
LIMIT 10;
```
