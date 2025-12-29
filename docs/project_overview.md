# Project Overview: News-Driven Commerce

## 1. Project Description
This project is a "News-Driven Commerce" platform that combines an electronic magazine with an e-commerce store. The core philosophy is **"Content-First"**: users are attracted by high-quality content and are then naturally guided to relevant products based on the context of what they are reading.

### Core Philosophy
*   **Magazine-Style**: High-quality editorial content is the primary driver.
*   **Contextual Commerce**: Products are suggested based on the article's topic (e.g., reading about back pain -> suggest pain relief patches).

## 2. Goals
1.  **Increase Time-on-Site**: Through engaging, high-quality content.
2.  **Conversion**: Convert Readers into Buyers naturally.
3.  **Seamless Experience**: Blur the line between reading news and shopping.

## 3. Target Audience
*   **Readers**: People seeking information on health, lifestyle, nutrition.
*   **Customers**: Readers who have a need to buy products related to the content.
*   **Admin/Editors**: Staff managing content and products.

## 4. Key Metrics (Homepage Display Ratio)
*   **70%**: News/Content.
*   **30%**: Products (Integrated subtly).

---

## 5. Technology Stack

### 5.1 Frontend
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.x | SSR/SSG, React Server Components, Server Actions |
| **UI Library** | Tailwind CSS | 4.x | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Accessible, customizable UI components |
| **State Management** | Zustand | - | (Minimal use due to Server Components) |
| **Data Fetching** | Server Components | - | Direct DB access in RSC |
| **Forms** | React Hook Form + Zod | Latest | Performance + type-safe validation |
| **Rich Text Editor** | Tiptap | 3.x | WYSIWYG for admin article editor |
| **Icons** | Lucide React | Latest | Consistent icon set |

### 5.2 Backend (Next.js Server Actions / API Routes)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 20+ | Runtime for Next.js Server |
| **Framework** | Next.js | 16.x | API Routes & Server Actions |
| **ORM** | Prisma | 7.x | Type-safe database access, migrations |
| **Authentication** | NextAuth.js (Beta) | 5.x | Auth framework (JWT, Sessions) |
| **Validation** | Zod | 3.x | Schema validation (shared with frontend) |
| **Password Hashing** | bcrypt | 5.x | Secure password storage |
| **Email** | Nodemailer + Resend | - | Transactional emails |

### 5.3 Database & Storage
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary Database** | MySQL 8.0+ / Postgres | Main data storage |
| **Cache** | Redis | Session cache, rate limiting, frequently accessed data |
| **Media Storage** | Cloudinary | Image/video upload, optimization, CDN |
| **Full-text Search** | MeiliSearch | Fast search with Vietnamese language support |

### 5.4 DevOps & Deployment (Multi-Environment)

| Environment | Component | Technology | Purpose |
|-------------|-----------|------------|---------|
| **All** | Frontend Hosting | Vercel | Auto-scaling, edge functions |
| **All** | Backend Hosting | Render / cPanel | Node.js API server |
| **Free Tier** | Database | Supabase (PostgreSQL) | 500MB free, connection pooling |
| **Local/cPanel** | Database | MySQL 8.0+ | Traditional hosting support |
| **All** | CI/CD | GitHub Actions | Automated testing & deployment |
| **All** | Monitoring | Sentry | Error tracking & performance |
| **All** | Analytics | Google Analytics 4 | User behavior tracking |

> **Multi-Database Strategy**: Project supports both MySQL (local dev, cPanel) and PostgreSQL (Supabase free tier) via separate Prisma schemas.

### 5.5 Payment Gateways
| Gateway | Use Case |
|---------|----------|
| **VNPay** | Vietnam domestic payments |
| **MoMo** | Mobile wallet payments |
| **COD** | Cash on delivery |

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│              (Browser / Mobile Browser)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              FULLSTACK APP (Next.js on Vercel)                   │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐       │
│  │ React Client │  │ Server Components│  │ API Routes   │       │
│  │ Components   │  │ & Server Actions │  │ (Webhooks)   │       │
│  └──────────────┘  └────────┬─────────┘  └──────┬───────┘       │
└─────────────────────────────┼───────────────────┼───────────────┘
                              │                   │
                              ▼                   ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐
│  PostgreSQL   │ │    Redis      │ │  Cloudinary   │ │ Resend (Email)│
│  (Supabase)   │ │  (Upstash)    │ │   (Media)     │ │             │
│   or MySQL    │ │   (Cache)     │ │               │ │             │
└───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘
                              │
                              ▼
                      (Optional Search Service)
```

---

## 7. Sitemap Structure

```text
/                           → Homepage (Magazine-style)
├── /category/:slug         → Category Page (e.g., /category/health)
├── /article/:slug          → Article Detail (★ Critical Page)
├── /shop                   → Shop Landing (Product Catalog)
│   └── /shop/:slug         → Product Detail
├── /cart                   → Shopping Cart
├── /checkout               → Checkout Page
├── /search?q=keyword       → Search (Mixed Articles + Products)
├── /auth
│   ├── /auth/login         → Login Page
│   ├── /auth/register      → Register Page
│   └── /auth/forgot        → Forgot Password
├── /account
│   ├── /account/profile    → User Profile
│   └── /account/orders     → Order History
└── /admin                  → Admin Dashboard
    ├── /admin/articles     → Article Management
    ├── /admin/products     → Product Management
    └── /admin/orders       → Order Management
```

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Next.js + Express + Prisma + MySQL)
- [ ] Database schema & migrations
- [ ] Authentication system (JWT + Refresh Token)
- [ ] Basic UI components (Design System)

### Phase 2: Core Features (Week 3-4)
- [ ] Article CRUD + Rich Text Editor
- [ ] Product CRUD
- [ ] Homepage with all sections
- [ ] Category & Search pages

### Phase 3: E-commerce (Week 5-6)
- [ ] Shopping cart functionality
- [ ] Checkout flow
- [ ] Payment integration (VNPay/MoMo/COD)
- [ ] Order management

### Phase 4: Content-Commerce Integration (Week 7)
- [ ] Article-Product relationship
- [ ] In-article product widgets
- [ ] Quick view modal
- [ ] Recommended products algorithm

### Phase 5: Polish & Launch (Week 8)
- [ ] SEO optimization
- [ ] Performance tuning
- [ ] Testing (Unit, Integration, E2E)
- [ ] Deployment & monitoring setup
