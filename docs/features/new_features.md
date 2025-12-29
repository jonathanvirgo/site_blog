# Tính năng mới - Phase 9-13

> Tài liệu bổ sung cho các tính năng được thêm vào Phase 9-13

---

## 1. Redis Integration (Phase 9)

### 1.1 Mục đích
- **Caching**: Giảm load database, tăng tốc response
- **Rate Limiting**: Chống spam/DDOS
- **Token Management**: Blacklist JWT, lưu refresh tokens

### 1.2 Configuration
```env
# .env
REDIS_URL="redis://default:password@redis-xxxxx.region.redis.io:6379"
```

### 1.3 Files
| File | Mô tả |
|------|-------|
| `src/lib/redis.ts` | Redis client, cache utilities |
| `src/lib/cache.ts` | Cache service cho articles, products |
| `src/lib/rate-limit.ts` | Rate limiter middleware |
| `src/lib/auth-cache.ts` | Token blacklist, refresh token storage |

### 1.4 Cache Keys
```typescript
CacheKeys = {
  articlesList: (page, limit) => `articles:list:${page}:${limit}`,
  articleBySlug: (slug) => `articles:slug:${slug}`,
  productsFeatured: () => `products:featured`,
  homepageData: () => `homepage:data`,
  rateLimit: (ip, endpoint) => `rate:${endpoint}:${ip}`,
  tokenBlacklist: (token) => `blacklist:${token}`,
}
```

### 1.5 Cache TTL
| Constant | Time | Use Case |
|----------|------|----------|
| `SHORT` | 1 min | Frequently changing data |
| `MEDIUM` | 15 min | Semi-static data |
| `LONG` | 1 hour | Rarely changing data |
| `VERY_LONG` | 24 hours | Static data |

---

## 2. Cloudinary Image Upload (Phase 10)

### 2.1 Mục đích
- **Storage**: 25GB free trên cloud
- **Auto-optimize**: WebP/AVIF conversion
- **CDN**: Global delivery
- **Transformations**: Resize, crop on-the-fly

### 2.2 Configuration
```env
# .env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### 2.3 Files
| File | Mô tả |
|------|-------|
| `src/lib/cloudinary.ts` | Upload, delete, URL generation |
| `src/app/api/upload/route.ts` | Upload API endpoint |
| `src/components/ui/image-upload.tsx` | Upload component |
| `src/components/ui/cloudinary-image.tsx` | Optimized image display |

### 2.4 API Endpoints
```
GET  /api/upload         → Signed params for browser upload
POST /api/upload         → Server-side upload (FormData)
DELETE /api/upload       → Delete image by publicId
```

### 2.5 Image Presets
```typescript
ImagePresets = {
  thumbnail: { width: 150, height: 150, crop: "fill" },
  articleCard: { width: 400, height: 225, crop: "fill" },
  articleHero: { width: 1200, height: 630, crop: "fill" },
  productCard: { width: 300, height: 300, crop: "fill" },
  avatar: { width: 200, height: 200, crop: "fill" },
}
```

### 2.6 Usage Example
```tsx
import { ImageUpload } from "@/components/ui/image-upload";

<ImageUpload
  value={imageUrl}
  onChange={(url, publicId) => setImage({ url, publicId })}
  folder="articles"
  aspectRatio="16/9"
/>
```

---

## 3. Soft Delete & Trash (Phase 11)

### 3.1 Mục đích
- **Data Safety**: Không xóa vĩnh viễn ngay
- **Recovery**: Có thể khôi phục trong 30 ngày
- **Storage Optimization**: Xóa ảnh Cloudinary khi xóa vĩnh viễn

### 3.2 Schema Changes
```prisma
model Article {
  // ... existing fields
  deletedAt DateTime? @map("deleted_at")
  
  @@index([deletedAt])
}

model Product {
  // ... existing fields
  deletedAt DateTime? @map("deleted_at")
  
  @@index([deletedAt])
}
```

### 3.3 API Endpoints
| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/articles/[id]` | DELETE | Soft delete → Thùng rác |
| `/api/articles/[id]?permanent=true` | DELETE | Xóa vĩnh viễn + ảnh |
| `/api/articles/[id]` | PATCH | Khôi phục từ thùng rác |
| `/api/products/[id]` | DELETE/PATCH | Tương tự articles |
| `/api/trash` | GET | Danh sách thùng rác |
| `/api/trash?type=all` | DELETE | Xóa hết thùng rác |

### 3.4 Admin UI
- **Route**: `/admin/trash`
- **Tabs**: Bài viết / Sản phẩm
- **Actions per item**: Khôi phục / Xóa vĩnh viễn
- **Bulk action**: Xóa tất cả vĩnh viễn

### 3.5 Flow
```
User clicks "Delete"
        ↓
  Soft Delete (set deletedAt = now())
        ↓
  Item appears in Trash
        ↓
  ┌─────────────────┬─────────────────┐
  │ User: "Restore" │ User: "Delete"  │
  ↓                 ↓                 │
  Clear deletedAt   Permanent Delete  ←┘
                    ↓
              Delete from DB
                    ↓
              Delete Cloudinary images
```

---

## 4. Environment Variables Summary

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# Redis
REDIS_URL="redis://..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."

# Resend Email
RESEND_API_KEY="re_xxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Telegram Bot
TELEGRAM_BOT_TOKEN="1234567890:ABCxxx"
TELEGRAM_CHAT_ID="123456789"
```

---

## 5. pnpm Migration (Phase 12)

### 5.1 Mục đích
- **Disk Space**: 50% ít hơn npm
- **Speed**: 2-3x nhanh hơn install
- **Strict deps**: Không phantom dependencies

### 5.2 Configuration
```ini
# .npmrc
shamefully-hoist=true
node-linker=hoisted
```

### 5.3 Commands
```bash
# Install dependencies
pnpm install

# Add package
pnpm add <package>

# Run scripts
pnpm dev
pnpm build
```

---

## 6. Email & Telegram Notifications (Phase 13)

### 6.1 Email (Resend)
- **Service**: Resend (3,000 emails/month free)
- **Template**: Beautiful HTML order confirmation

### 6.2 Files
| File | Mô tả |
|------|-------|
| `src/lib/email.ts` | Resend client, sendOrderConfirmationEmail |
| `src/lib/telegram.ts` | Telegram bot utilities |

### 6.3 Telegram Functions
```typescript
// New order notification
notifyNewOrder({ id, customerName, customerPhone, totalAmount, itemCount })

// Server error (500) alert
notifyServerError({ endpoint, method, statusCode, message, stack })

// Low stock warning
notifyLowStock({ name, sku, currentStock })
```

### 6.4 Order Creation Flow
```
POST /api/orders
        ↓
  Create order in DB
        ↓
  Update stock quantity
        ↓
  Apply coupon (if any)
        ↓
  ┌────────────────────────┐
  │ Async (non-blocking):  │
  │ • Send email to customer│
  │ • Notify admin Telegram │
  └────────────────────────┘
        ↓
  Return success response
```

### 6.5 Error Handling
```typescript
// On 500 error, notify admin via Telegram
catch (error) {
    notifyServerError({
        endpoint: "/api/orders",
        method: "POST",
        statusCode: 500,
        message: error.message,
        stack: error.stack,
    });
}
```

---

## 7. Build Info
- **Total Pages**: 35
- **Package Manager**: pnpm 10.26.1
- **New Routes**: 
  - `/admin/trash`
  - `/api/trash`
  - `/api/upload`
  - `/api/articles/[id]`
  - `/api/products/[id]`
  - `/api/orders` (POST)
