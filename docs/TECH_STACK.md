# Technology Stack

> Tổng hợp các công nghệ sử dụng trong dự án News-Driven Commerce

---

## 1. Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.10 | React framework với App Router |
| **React** | 19.2.1 | UI library |
| **TypeScript** | 5.9.3 | Type safety |

---

## 2. Package Manager

| Technology | Version | Config |
|------------|---------|--------|
| **pnpm** | 10.26.1 | Fast, disk-efficient package manager |

### Config `.npmrc`:
```ini
shamefully-hoist=true
node-linker=hoisted
```

---

## 3. Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15+ | Primary database |
| **Supabase** | - | Hosted PostgreSQL with Pooling |
| **Prisma** | 7.2.0 | ORM & migrations |
| **@prisma/adapter-pg** | 7.2.0 | PostgreSQL adapter |

### Key Features:
- Soft delete với `deletedAt` field
- UUID primary keys
- Optimized indexes

---

## 4. Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.1.18 | Utility-first CSS |
| **tw-animate-css** | 1.4.0 | Animations |
| **class-variance-authority** | 0.7.1 | Component variants |
| **tailwind-merge** | 3.4.0 | Class merging |
| **lucide-react** | 0.561.0 | Icons |

---

## 5. UI Components

| Technology | Purpose |
|------------|---------|
| **Radix UI** | Accessible primitives |
| - @radix-ui/react-dialog | Modals |
| - @radix-ui/react-dropdown-menu | Menus |
| - @radix-ui/react-select | Select inputs |
| - @radix-ui/react-tabs | Tab navigation |
| - @radix-ui/react-alert-dialog | Confirmations |
| - @radix-ui/react-switch | Toggle switches |
| - @radix-ui/react-tooltip | Tooltips |
| - @radix-ui/react-avatar | User avatars |

---

## 6. Rich Text Editor

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tiptap** | 3.13.0 | WYSIWYG editor |
| Extensions | - | Image, Link, YouTube, Placeholder |

---

## 7. Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **jose** | 6.1.3 | JWT handling |
| **jsonwebtoken** | 9.0.3 | Token generation |
| **bcryptjs** | 3.0.3 | Password hashing |
| **next-auth** | 5.0.0-beta.30 | Auth framework |

### Auth Flow:
- Access Token: 15 min (JWT)
- Refresh Token: 7 days (stored in Redis)
- Blacklist: Redis-based token invalidation

---

## 8. Caching & Rate Limiting

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | Cloud | Caching, sessions |
| **ioredis** | 5.8.2 | Redis client |

### Cache Layers:
- Homepage data: 5 min TTL
- Categories: 1 hour TTL
- Article/Product detail: 15 min TTL

### Rate Limits:
| Endpoint Type | Limit |
|---------------|-------|
| Default API | 60 req/min |
| Auth endpoints | 5 req/15min |
| Strict | 10 req/min |

---

## 9. Image Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **Cloudinary** | 2.8.0 | Image hosting & CDN |
| **next-cloudinary** | 6.17.5 | Next.js integration |

### Features:
- Auto-format (WebP/AVIF)
- Auto-quality optimization
- On-the-fly resize/crop
- Blur placeholder
- 25GB free storage

### Presets:
| Name | Size | Use Case |
|------|------|----------|
| `articleHero` | 1200x630 | Featured images |
| `articleCard` | 400x225 | List thumbnails |
| `productCard` | 300x300 | Product grid |
| `avatar` | 200x200 | User profiles |

---

## 10. Email & Notifications

| Technology | Version | Purpose |
|------------|---------|---------|
| **Resend** | 6.6.0 | Email delivery service |
| **React Email** | 5.1.0 | Email templates |
| **Sonner** | 2.0.7 | Toast notifications |

---

## 11. UI Functionality

| Technology | Version | Purpose |
|------------|---------|---------|
| **Embla Carousel** | 8.6.0 | Carousel/Slider component |
| **Cheerio** | 1.1.2 | HTML parsing (Content Crawling) |

---

## 12. Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 4.2.1 | Schema validation |

---

## 13. Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.39.2 | Code linting |
| **eslint-config-next** | 16.0.10 | Next.js rules |

---

## 14. Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting & Serverless |
| **GitHub Actions** | CI/CD automation |

### Environment Variables:
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NEXTAUTH_SECRET=...

# Redis
REDIS_URL=redis://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

---

## 15. Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (client)/     # Client-facing pages
│   │   ├── admin/        # Admin dashboard
│   │   └── api/          # API routes
│   ├── components/
│   │   ├── ui/           # Shadcn/Radix components
│   │   └── admin/        # Admin components
│   ├── lib/              # Utilities
│   │   ├── prisma.ts     # Database client
│   │   ├── redis.ts      # Cache client
│   │   ├── cache.ts      # Cache service
│   │   ├── cloudinary.ts # Image upload
│   │   └── auth-cache.ts # Token management
│   └── generated/
│       └── prisma/       # Generated Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
├── .npmrc                # pnpm config
└── pnpm-lock.yaml        # Lock file
```

---

## 16. Key Features

| Feature | Technology | Status |
|---------|------------|--------|
| Content Management | Prisma + Tiptap | ✅ |
| Product Catalog | Prisma + Variants | ✅ |
| Shopping Cart | Session + Redis | ✅ |
| Order Management | Prisma + Coupons | ✅ |
| Image Upload | Cloudinary | ✅ |
| Caching | Redis | ✅ |
| Rate Limiting | Redis | ✅ |
| Soft Delete | deletedAt field | ✅ |
| Trash Management | Admin UI | ✅ |
| SEO | Meta fields + Schema | ✅ |

---

## 17. Build Info

| Metric | Value |
|--------|-------|
| **Total Pages** | 35 |
| **Static Pages** | 19 |
| **Dynamic Pages** | 16 |
| **Build Time** | ~8.8s |
