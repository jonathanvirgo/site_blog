# UI/UX: Product Detail Page (★ CRITICAL)

> **Standard**: This document follows [_wireframe_standard.md](./_wireframe_standard.md)

---

## 1. Overview

The Product Detail page is the **critical conversion point** for e-commerce. Users evaluate product information, select variants, and make purchase decisions. The goal is to provide comprehensive product information while making the purchase process frictionless.

### User Journey
```
Browse Shop → Product Detail → Select Variant → Add to Cart → Checkout
```

---

## 2. User Stories

- As a **buyer**, I want to see all product details clearly before purchasing
- As a **comparison shopper**, I want to understand product specifications and pricing
- As a **mobile user**, I want to easily add products to cart with one tap
- As a **returning visitor**, I want to quickly find the variant I previously viewed
- As an **SEO crawler**, I want proper structured data for rich snippets in search results

---

## 3. Layout Specification

### 3.1 Desktop Layout (≥1024px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                               HEADER (64px)                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Breadcrumb: Trang chủ > Cửa hàng > [Category] > [Product Name]            │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                     │  │                              │ │
│  │        [MAIN IMAGE - 1:1]           │  │  [Category Badge]            │ │
│  │                                     │  │                              │ │
│  │        Zoom on hover                │  │  Product Name (H1)           │ │
│  │        Lightbox on click            │  │  Max 3 lines, 36px font      │ │
│  │                                     │  │                              │ │
│  │                                     │  │  ⭐⭐⭐⭐☆ 4.5 (124 đánh giá) │ │
│  │                                     │  │  [Xem đánh giá]              │ │
│  │        [Discount Badge: -20%]       │  │                              │ │
│  │                                     │  │  SKU: PRD-001                │ │
│  └─────────────────────────────────────┘  │                              │ │
│                                           │  ────────────────────────── │ │
│  THUMBNAIL GALLERY (Scrollable)           │                              │ │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │  VARIANT SELECTION           │ │
│  │[Th1]│ │[Th2]│ │[Th3]│ │[Th4]│ │[Th5]│ │                              │ │
│  │  ●  │ │     │ │     │ │     │ │     │ │  Kích thước:                 │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │  ┌────┐ ┌────┐ ┌────┐       │ │
│  (Click to change main image)            │  │ S  │ │ M ●│ │ L  │       │ │
│                                           │  └────┘ └────┘ └────┘       │ │
│                                           │                              │ │
│                                           │  Màu sắc:                    │ │
│                                           │  ┌────┐ ┌────┐ ┌────┐       │ │
│                                           │  │ Đỏ│ │Xanh│ │Đen●│       │ │
│                                           │  └────┘ └────┘ └────┘       │ │
│                                           │                              │ │
│                                           │  ────────────────────────── │ │
│                                           │                              │ │
│                                           │  PRICING                     │ │
│                                           │  ┌──────────────────────────┐│ │
│                                           │  │ 250,000đ   199,000đ      ││ │
│                                           │  │ ─────────  (Tiết kiệm 20%)│ │
│                                           │  └──────────────────────────┘│ │
│                                           │                              │ │
│                                           │  Tình trạng: ✓ Còn hàng (50)│ │
│                                           │                              │ │
│                                           │  QUANTITY SELECTOR           │ │
│                                           │  ┌───────────────────────┐  │ │
│                                           │  │  [−]      1      [+]  │  │ │
│                                           │  └───────────────────────┘  │ │
│                                           │                              │ │
│                                           │  ACTION BUTTONS              │ │
│                                           │  ┌──────────────────────────┐│ │
│                                           │  │ 🛒 Thêm vào giỏ hàng     ││ │
│                                           │  └──────────────────────────┘│ │
│                                           │  ┌──────────────────────────┐│ │
│                                           │  │ ⚡ Mua ngay               ││ │
│                                           │  └──────────────────────────┘│ │
│                                           │                              │ │
│                                           │  ❤️ Yêu thích | 📤 Chia sẻ  │ │
│                                           │                              │ │
│                                           │  ────────────────────────── │ │
│                                           │                              │ │
│                                           │  TRUST BADGES                │ │
│                                           │  🚚 Giao hàng: 2-3 ngày     │ │
│                                           │  🔄 Đổi trả: 7 ngày         │ │
│                                           │  ✓ Chính hãng 100%          │ │
│                                           └──────────────────────────────┘ │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TABS SECTION                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Mô tả]  [Thông số kỹ thuật]  [Đánh giá (124)]  [Bài viết liên quan]     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  TAB CONTENT                                                         │   │
│  │                                                                      │   │
│  │  Mô tả sản phẩm chi tiết ở đây...                                   │   │
│  │  HTML content with rich formatting                                   │   │
│  │  Images, tables, and other media                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔥 SẢN PHẨM LIÊN QUAN (Carousel - 5 items visible)     [Xem tất cả →]    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ← ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ →          │
│    │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │            │
│    │  1:1    │ │  1:1    │ │  1:1    │ │  1:1    │ │  1:1    │            │
│    ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤            │
│    │ Name    │ │ Name    │ │ Name    │ │ Name    │ │ Name    │            │
│    │ 199,000đ│ │ 250,000đ│ │ 320,000đ│ │ 180,000đ│ │ 290,000đ│            │
│    │ [+Giỏ]  │ │ [+Giỏ]  │ │ [+Giỏ]  │ │ [+Giỏ]  │ │ [+Giỏ]  │            │
│    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📖 BÀI VIẾT LIÊN QUAN (Grid 4x2)                       [Xem thêm →]       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │   [Image]     │ │   [Image]     │ │   [Image]     │ │   [Image]     │   │
│  │    16:9       │ │    16:9       │ │    16:9       │ │    16:9       │   │
│  │               │ │               │ │               │ │               │   │
│  │  Title here   │ │  Title here   │ │  Title here   │ │  Title here   │   │
│  │  [Category]   │ │  [Category]   │ │  [Category]   │ │  [Category]   │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👀 SẢN PHẨM ĐÃ XEM GẦN ĐÂY (Horizontal Scroll)                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ← ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ →          │
│    │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │            │
│    │ Name    │ │ Name    │ │ Name    │ │ Name    │ │ Name    │            │
│    │ Price   │ │ Price   │ │ Price   │ │ Price   │ │ Price   │            │
│    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                               FOOTER                                        │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────┐
│  [←]  Logo              [🔍] [🛒]  │
├─────────────────────────────────────┤
│                                     │
│  Breadcrumb: ... > Category > Name  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      [MAIN IMAGE - 1:1]         ││
│  │                                 ││
│  │      Swipeable on touch         ││
│  │                                 ││
│  │      [Discount Badge]           ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│  │Th1│ │Th2│ │Th3│ │Th4│ │Th5│    │
│  └───┘ └───┘ └───┘ └───┘ └───┘    │
│                                     │
│  [Category Badge]                   │
│                                     │
│  Product Name (H1)                  │
│  ⭐⭐⭐⭐☆ 4.5 (124 reviews)       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 250,000đ   199,000đ (-20%)      ││
│  └─────────────────────────────────┘│
│                                     │
│  Kích thước:                        │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │ S │ │ M●│ │ L │                 │
│  └───┘ └───┘ └───┘                 │
│                                     │
│  Màu sắc:                           │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │ Đỏ│ │Xanh│ │Đen│                │
│  └───┘ └───┘ └───┘                 │
│                                     │
│  Tình trạng: ✓ Còn hàng (50)       │
│                                     │
│  Số lượng: [−] 1 [+]               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🛒 Thêm vào giỏ hàng            ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ⚡ Mua ngay                      ││
│  └─────────────────────────────────┘│
│                                     │
│  ❤️ Yêu thích | 📤 Chia sẻ         │
│                                     │
│  ─────────────────────────────────  │
│  🚚 Giao hàng   🔄 Đổi trả   ✓ CT  │
│  ─────────────────────────────────  │
│                                     │
│  TABS: [Mô tả] [Thông số] [Đánh giá]│
│  ─────────────────────────────────  │
│  Tab content here...                │
│                                     │
│  ─────────────────────────────────  │
│  🔥 SẢN PHẨM LIÊN QUAN (3 cols)    │
│  ─────────────────────────────────  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ Product │ │ Product │ │ Product ││
│  └─────────┘ └─────────┘ └─────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 3.3 Mobile Layout (<768px)

```
┌─────────────────────────────────────┐
│  [←]  Logo              [🔍] [🛒]  │
├─────────────────────────────────────┤
│                                     │
│  Trang chủ > Cửa hàng > [Category] │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │      [MAIN IMAGE - 1:1]         ││
│  │                                 ││
│  │      ← Swipe for more →         ││
│  │                                 ││
│  │      [1] [2] [●] [4] [5]        ││
│  │      (dots indicator)           ││
│  │                                 ││
│  │      [Discount Badge: -20%]     ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  [Category Badge]                   │
│                                     │
│  Product Name (H1 - 24px)           │
│  Full name without truncation       │
│                                     │
│  ⭐⭐⭐⭐☆ 4.5 (124)               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  199,000đ                       ││
│  │  250,000đ  (Tiết kiệm 20%)     ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Kích thước                         │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │  S  │ │  M● │ │  L  │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  Màu sắc                            │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ Đỏ │ │Xanh │ │ Đen●│          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Tình trạng: ✓ Còn hàng            │
│                                     │
│  Số lượng                           │
│  ┌─────────────────────────────────┐│
│  │   [−]         1         [+]     ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🚚 Giao hàng miễn phí              │
│  🔄 Đổi trả trong 7 ngày           │
│  ✓ Chính hãng 100%                  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ACCORDION TABS                     │
│  ┌─────────────────────────────────┐│
│  │ ▼ Mô tả sản phẩm                ││
│  │   Content...                    ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ► Thông số kỹ thuật             ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ► Đánh giá (124)                ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│  🔥 SẢN PHẨM LIÊN QUAN             │
│  ─────────────────────────────────  │
│  ← [Product] [Product] [Product] → │
│     (Horizontal scroll)             │
│                                     │
│  ─────────────────────────────────  │
│  📖 BÀI VIẾT LIÊN QUAN             │
│  ─────────────────────────────────  │
│  ┌───────────┐ ┌───────────┐       │
│  │ [Image]   │ │ [Image]   │       │
│  │ Title     │ │ Title     │       │
│  └───────────┘ └───────────┘       │
│                                     │
└─────────────────────────────────────┘

STICKY BOTTOM BAR (Fixed at bottom on mobile)
┌─────────────────────────────────────┐
│  ❤️  │  199,000đ  │ [Thêm vào giỏ] │
└─────────────────────────────────────┘
```

---

## 4. Components

### 4.1 Product Image Gallery
- **Purpose**: Display product images with zoom and navigation
- **Data**: Array of image URLs
- **Features**:
  | Feature | Desktop | Tablet | Mobile |
  |---------|---------|--------|--------|
  | Main image | Zoom on hover | Tap to zoom | Swipe carousel |
  | Thumbnails | Click to change | Click to change | Dots indicator |
  | Lightbox | Click for fullscreen | Tap for fullscreen | Pinch to zoom |
- **States**: Loading (skeleton), Error (placeholder), Empty (default image)
- **Interactions**:
  - Thumbnail click → Update main image
  - Main image click → Open lightbox
  - Mobile swipe → Navigate images

### 4.2 Variant Selector
- **Purpose**: Allow users to select product options (size, color, etc.)
- **Data**: Product variants with attributes
- **Layout**: Toggle button group per attribute
- **Behavior**:
  | Action | Effect |
  |--------|--------|
  | Select variant | Update SKU, price, stock, image |
  | Out of stock variant | Disabled state with strikethrough |
  | Single variant | Hide variant selection entirely |
- **States**:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ SELECTED              AVAILABLE             OUT OF STOCK    │
  │ ┌────────────┐       ┌────────────┐       ┌────────────┐   │
  │ │  Size M    │       │  Size L    │       │  Size XL   │   │
  │ │  ● Active  │       │            │       │  ── Hết ── │   │
  │ │  Primary   │       │  Hover     │       │  Disabled  │   │
  │ └────────────┘       └────────────┘       └────────────┘   │
  │  Primary border       Gray border         Strikethrough     │
  │  + bg color           + hover bg          + 50% opacity     │
  └─────────────────────────────────────────────────────────────┘
  ```

### 4.3 Quantity Selector
- **Purpose**: Allow users to set purchase quantity
- **Data**: Current quantity, stock limit
- **Layout**: Button group with +/- and number input
- **Validation**:
  - Minimum: 1
  - Maximum: Stock quantity or 99
  - Disabled at limits
- **Interactions**:
  - Click +/- → Increment/decrement
  - Direct input → Validate and update
  - Exceeds stock → Show error toast

### 4.4 Add to Cart / Buy Now Buttons
- **Purpose**: Primary conversion actions
- **Layout**:
  | Button | Style | Action |
  |--------|-------|--------|
  | Add to Cart | Primary, full width | Add to cart, show toast |
  | Buy Now | Secondary, full width | Add to cart, redirect to checkout |
- **States**: Default, Loading (spinner), Disabled (out of stock), Success (checkmark)
- **Loading behavior**: Show spinner, disable button, prevent double-click

### 4.5 Product Tabs / Accordion
- **Purpose**: Display detailed product information
- **Tabs**:
  | Tab | Content |
  |-----|---------|
  | Mô tả | Rich HTML description |
  | Thông số kỹ thuật | Specification table |
  | Đánh giá | User reviews with ratings |
  | Bài viết liên quan | Related articles grid |
- **Desktop**: Horizontal tabs
- **Mobile**: Accordion (collapsible sections)
- **Default**: "Mô tả" tab open

### 4.6 Trust Badges
- **Purpose**: Build customer confidence
- **Items**:
  | Icon | Text |
  |------|------|
  | 🚚 Truck | Giao hàng: 2-3 ngày |
  | 🔄 Return | Đổi trả: 7 ngày |
  | ✓ Shield | Chính hãng 100% |
- **Layout**: 3-column grid (desktop), vertical list (mobile)

### 4.7 Related Products Carousel
- **Purpose**: Cross-sell and upsell
- **Data**: Products from same category
- **Layout**: Embla carousel with autoplay
- **Item design**: Product card with image, name, price, add-to-cart button
- **Count**: 8-10 products, 5 visible on desktop
- **Controls**: Prev/Next arrows, dots indicator

### 4.8 Related Articles Section
- **Purpose**: Content marketing, SEO boost
- **Data**: Articles mentioning or tagged with product
- **Layout**: 4-column grid (desktop), 2-column (tablet/mobile)
- **Item design**: Article card with image, title, category badge
- **Count**: 4-8 articles

### 4.9 Recently Viewed Products
- **Purpose**: Help users find previously viewed items
- **Data**: From localStorage/session
- **Layout**: Horizontal scroll carousel
- **Item design**: Compact product card
- **Behavior**: Exclude current product

### 4.10 Sticky Mobile Bottom Bar
- **Purpose**: Always-visible purchase action on mobile
- **Layout**: Fixed at bottom, 60px height
- **Contents**: Wishlist button | Price | Add to Cart button
- **Visibility**: Show after scrolling past main CTA buttons
- **Animation**: Slide up on appear

---

## 5. Data Requirements

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/products/:slug` | Product detail with variants |
| `GET /api/products?category=X&exclude=Y` | Related products |
| `GET /api/articles?productTag=X` | Related articles |
| `POST /api/cart` | Add item to cart |
| `POST /api/wishlist` | Add to wishlist |

### Data Structure
```typescript
interface ProductDetailData {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string; // HTML content
    shortDescription: string;
    images: string[];
    category: { id, name, slug };
    isFeatured: boolean;
    metaTitle: string;
    metaDescription: string;
    variants: ProductVariant[];
    attributes: ProductAttribute[];
  };
  relatedProducts: Product[];
  relatedArticles: Article[];
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  isDefault: boolean;
  attributeValues: Record<string, string>;
  images?: string[];
}

interface ProductAttribute {
  id: string;
  name: string; // e.g. "Kích thước", "Màu sắc"
  values: { id: string; value: string }[];
}
```

---

## 6. States & Feedback

### Loading States
| Element | Loading Indicator |
|---------|-------------------|
| Product info | Full skeleton layout |
| Main image | Shimmer placeholder |
| Variants | Toggle skeleton |
| Related products | Carousel skeleton |
| Related articles | Grid skeleton |

### Empty States
| Scenario | Handling |
|----------|----------|
| No variant selected | Show first variant as default |
| No related products | Hide section entirely |
| No related articles | Hide section entirely |
| No reviews | Show "Chưa có đánh giá" message |

### Error States
| Scenario | Handling |
|----------|----------|
| Product not found | 404 page |
| Add to cart fails | Error toast with retry |
| Image load fails | Placeholder image |
| Network error | Error message with retry button |

### Success Feedback
| Action | Feedback |
|--------|----------|
| Add to Cart | Toast: "Đã thêm vào giỏ hàng!" with cart icon |
| Add to Wishlist | Heart icon fills, toast confirmation |
| Share | Share dialog or copy success toast |

---

## 7. Interactions

### Image Gallery
- **Desktop hover**: Zoom cursor, inner zoom effect
- **Desktop click**: Open lightbox modal
- **Mobile swipe**: Navigate between images
- **Thumbnail click**: Smooth transition to selected image

### Variant Selection
- **Click variant**: 
  1. Update selected state
  2. Fetch new price/stock
  3. Update main image if variant has image
  4. Update SKU display
- **Disabled variant**: Show tooltip explaining "Hết hàng"

### Add to Cart Flow
```
1. User clicks "Thêm vào giỏ hàng"
2. Button shows loading spinner
3. POST /api/cart with productId, variantId, quantity
4. On success:
   - Button shows checkmark briefly
   - Toast: "Đã thêm vào giỏ hàng!"
   - Update cart count in header
5. On error:
   - Toast: "Không thể thêm. Vui lòng thử lại."
   - Button returns to default state
```

### Buy Now Flow
```
1. User clicks "Mua ngay"
2. Add to cart (same as above)
3. Redirect to /gio-hang or /thanh-toan
```

---

## 8. Accessibility

### Keyboard Navigation
- Tab order: Images → Variants → Quantity → Add to Cart → Buy Now → Tabs
- Arrow keys: Navigate variant options
- Enter: Select variant, click buttons
- Escape: Close lightbox

### Screen Reader Support
- Image alt text: Product name + variant info
- Variant buttons: "Size M, selected" or "Size XL, out of stock"
- Price: Read as currency with proper formatting
- Stock: Announce availability status

### ARIA Labels
```html
<div role="group" aria-label="Chọn kích thước">
  <button aria-pressed="true" aria-label="Size M, đã chọn">M</button>
  <button aria-pressed="false" aria-label="Size L">L</button>
  <button aria-disabled="true" aria-label="Size XL, hết hàng">XL</button>
</div>

<div role="region" aria-label="Số lượng sản phẩm">
  <button aria-label="Giảm số lượng">−</button>
  <input type="number" aria-label="Số lượng" value="1" />
  <button aria-label="Tăng số lượng">+</button>
</div>
```

### Focus Management
- Lightbox: Trap focus inside, return focus on close
- Tabs: Focus moves to tab panel on tab change
- Toast: Announced via aria-live region

---

## 9. SEO

### Meta Tags
```html
<title>{{product.metaTitle}} | YourStore</title>
<meta name="description" content="{{product.metaDescription}}">
<link rel="canonical" href="https://yourstore.com/san-pham/{{slug}}">
<meta name="robots" content="index, follow">
```

### Open Graph
```html
<meta property="og:type" content="product">
<meta property="og:title" content="{{product.name}}">
<meta property="og:description" content="{{product.shortDescription}}">
<meta property="og:image" content="{{product.images[0]}}">
<meta property="og:url" content="https://yourstore.com/san-pham/{{slug}}">
<meta property="product:price:amount" content="{{price}}">
<meta property="product:price:currency" content="VND">
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{product.name}}",
  "image": ["{{product.images}}"],
  "description": "{{product.shortDescription}}",
  "sku": "{{variant.sku}}",
  "brand": {
    "@type": "Brand",
    "name": "YourStore"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://yourstore.com/san-pham/{{slug}}",
    "priceCurrency": "VND",
    "price": "{{salePrice || price}}",
    "availability": "{{inStock ? 'InStock' : 'OutOfStock'}}",
    "itemCondition": "https://schema.org/NewCondition"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "124"
  }
}
```

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s (Main product image) |
| CLS | < 0.1 |
| INP | < 200ms |
| FCP | < 1.5s |

### Optimizations
- **Images**: 
  - Main image: Priority loading, WebP format
  - Thumbnails: Lazy load
  - Related products: Lazy load with intersection observer
- **Data fetching**:
  - Product data: Server-side cached
  - Related products: Parallel fetch
  - Recently viewed: Client-side localStorage
- **JavaScript**:
  - Variant selector: Client component
  - Image gallery: Dynamic import
  - Reviews section: Lazy load on scroll
- **CSS**:
  - Critical CSS inlined
  - Non-critical deferred
