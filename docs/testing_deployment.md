# Testing & Deployment Strategy

## 1. Testing Strategy

### 1.1 Unit Tests
**Framework**: Jest + React Testing Library

#### Business Logic Tests
```typescript
// __tests__/utils/pricing.test.ts
import { calculatePrice } from '@/utils/pricing';

describe('calculatePrice', () => {
  const product = { price: 100000, salePrice: 80000 };
  
  it('should use sale price when available', () => {
    expect(calculatePrice(product, 1)).toBe(80000);
  });
  
  it('should apply 5% discount for quantity >= 5', () => {
    expect(calculatePrice(product, 5)).toBe(380000); // 80k * 5 * 0.95
  });
  
  it('should apply 10% discount for quantity >= 10', () => {
    expect(calculatePrice(product, 10)).toBe(720000); // 80k * 10 * 0.90
  });
});
```

#### Component Tests
```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';

describe('ProductCard', () => {
  const product = {
    id: '1',
    name: 'Vitamin C',
    price: 250000,
    salePrice: 199000,
    images: ['/img.jpg']
  };
  
  it('renders product name and prices', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    expect(screen.getByText('199,000đ')).toBeInTheDocument();
    expect(screen.getByText('250,000đ')).toHaveClass('line-through');
  });
  
  it('calls onAddToCart when button clicked', () => {
    const mockAddToCart = jest.fn();
    render(<ProductCard product={product} onAddToCart={mockAddToCart} />);
    fireEvent.click(screen.getByText('Thêm vào giỏ'));
    expect(mockAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### 1.2 Integration Tests
**Framework**: Supertest + Jest

```typescript
// __tests__/api/orders.test.ts
import request from 'supertest';
import { app } from '@/server';
import { prisma } from '@/lib/prisma';

describe('POST /api/orders', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Setup: Create test user and get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = res.body.data.accessToken;
  });
  
  it('should create order and reserve stock', async () => {
    const productBefore = await prisma.product.findUnique({
      where: { id: 'product-uuid' }
    });
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{ productId: 'product-uuid', quantity: 2 }],
        shippingInfo: {
          name: 'Test User',
          phone: '0901234567',
          address: '123 Test St'
        },
        paymentMethod: 'cod'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.order.status).toBe('pending');
    
    // Verify stock reservation created
    const reservation = await prisma.stockReservation.findFirst({
      where: { orderId: response.body.data.order.id }
    });
    expect(reservation?.quantity).toBe(2);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

### 1.3 E2E Tests
**Framework**: Playwright

```typescript
// e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('user can complete purchase from article', async ({ page }) => {
    // Step 1: Read article
    await page.goto('/article/vitamin-c-benefits');
    await expect(page.locator('h1')).toContainText('Vitamin C');
    
    // Step 2: Click product in sidebar
    await page.click('[data-testid="sidebar-product-0"]');
    
    // Step 3: Quick view popup - Add to cart
    await expect(page.locator('[data-testid="quick-view-modal"]')).toBeVisible();
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Step 4: Verify cart updated
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');
    
    // Step 5: Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL('/cart');
    
    // Step 6: Proceed to checkout
    await page.click('text=Thanh toán');
    await expect(page).toHaveURL('/checkout');
    
    // Step 7: Fill shipping info
    await page.fill('[name="shippingName"]', 'Test User');
    await page.fill('[name="shippingPhone"]', '0901234567');
    await page.fill('[name="shippingAddress"]', '123 Test Street');
    await page.selectOption('[name="shippingCity"]', 'Hà Nội');
    
    // Step 8: Select COD and place order
    await page.click('text=Thanh toán khi nhận hàng');
    await page.click('text=Đặt hàng');
    
    // Step 9: Verify success
    await expect(page.locator('text=Đặt hàng thành công')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toContainText('ORD-');
  });
});
```

### 1.4 Test Coverage Goals
| Type | Coverage Target |
|------|-----------------|
| Unit Tests | 80%+ |
| Integration Tests | Key API flows |
| E2E Tests | Critical user journeys |

---

## 2. Environment Configuration

### 2.1 Multi-Environment Database Setup

Project supports both MySQL and PostgreSQL:
- **Local/cPanel**: MySQL 8.0+
- **Free Tier (Supabase)**: PostgreSQL with connection pooling

### 2.2 Environment Variables

```bash
# .env.example

# ============ Database (Choose One) ============
# For MySQL (local/cPanel):
DATABASE_URL="mysql://user:password@localhost:3306/blog_commerce"
DB_PROVIDER="mysql"

# For PostgreSQL (Supabase free tier):
# DATABASE_URL="postgresql://postgres.[id]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.[id]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
# DB_PROVIDER="postgresql"

# ============ Redis (Upstash for production) ============
REDIS_URL="redis://localhost:6379"
# Or for Upstash:
# UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
# UPSTASH_REDIS_REST_TOKEN="AYxxxx"

# ============ JWT ============
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# ============ Cloudinary ============
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ============ MeiliSearch ============
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-master-key"

# ============ Payment ============
VNPAY_TMN_CODE="your-tmn-code"
VNPAY_HASH_SECRET="your-hash-secret"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="https://yoursite.com/payment/vnpay/callback"

MOMO_PARTNER_CODE="your-partner-code"
MOMO_ACCESS_KEY="your-access-key"
MOMO_SECRET_KEY="your-secret-key"

# ============ Email (Resend) ============
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="noreply@yoursite.com"

# ============ App URLs ============
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"

# ============ Monitoring ============
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

---

## 3. CI/CD Pipeline (GitHub Actions)

### 3.1 Pull Request Workflow
```yaml
# .github/workflows/pr.yml
name: Pull Request Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/test_db
      
      - name: Build
        run: npm run build
```

### 3.2 Deploy to Production
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Generate Prisma Client
        run: |
          if [ "${{ secrets.DB_PROVIDER }}" = "mysql" ]; then
            npm run db:mysql
          else
            npm run db:postgres
          fi
      
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Deploy Backend to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 4. Deployment Architecture

### Free Tier Architecture (Vercel + Render + Supabase)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FREE TIER PRODUCTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐       ┌───────────────┐                      │
│  │    Vercel     │       │    Render     │                      │
│  │  (Frontend)   │ ───►  │  (Backend)    │                      │
│  │   Next.js     │       │  Express.js   │                      │
│  │ Free: 100GB/mo│       │ Free: 750hrs  │                      │
│  └───────────────┘       └───────────────┘                      │
│         │                       │                                │
│         │                       ├──────────────────┐            │
│         │                       │                  │            │
│         ▼                       ▼                  ▼            │
│  ┌───────────────┐       ┌───────────────┐ ┌───────────────┐   │
│  │  Cloudinary   │       │   Supabase    │ │    Upstash    │   │
│  │    (CDN)      │       │ (PostgreSQL)  │ │   (Redis)     │   │
│  │ Free: 25GB    │       │ Free: 500MB   │ │ Free: 10K/day │   │
│  └───────────────┘       └───────────────┘ └───────────────┘   │
│                                 │                                │
│                                 ▼                                │
│                          ┌───────────────┐                      │
│                          │  MeiliSearch  │                      │
│                          │   (Cloud)     │                      │
│                          │ Free: 100K doc│                      │
│                          └───────────────┘                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       MONITORING                           │  │
│  │  Sentry (Errors) │ Vercel Analytics │ Google Analytics    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ⚠️ Cold Start Note (Render Free Tier)

- Service sleeps after 15 minutes of inactivity
- First request after sleep takes 20-30 seconds
- **Solution**: Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 14 minutes

---

## 5. Database Migrations

### Using Prisma
```bash
# Create migration
npx prisma migrate dev --name add_user_avatar

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Seed data
npx prisma db seed
```

### Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@yoursite.com' },
    update: {},
    create: {
      email: 'admin@yoursite.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      fullName: 'Admin User',
      role: 'admin'
    }
  });
  
  // Create categories
  const categories = ['Sức khỏe', 'Dinh dưỡng', 'Làm đẹp', 'Mẹ & Bé'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) }
    });
  }
}

main();
```

---

## 6. Backup Strategy

| Component | Strategy | Retention |
|-----------|----------|-----------|
| **Database (Supabase)** | Daily automated backup | 7 days (free tier) |
| **Database (MySQL)** | Manual backup via cron | Custom |
| **Media** | Cloudinary auto-backup | Indefinite |
| **Code** | GitHub repository | Indefinite |
| **Secrets** | GitHub Secrets + 1Password | Indefinite |
