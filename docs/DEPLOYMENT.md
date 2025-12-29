# Deployment Guide: Vercel + GitHub Actions

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database**: Use Neon, Supabase, or your preferred provider

---

## 1. Database Setup

### Option A: Neon (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy connection strings:
   - `DATABASE_URL` (pooled connection for app)
   - `DIRECT_URL` (direct connection for migrations)

### Option B: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Go to Settings > Database > Connection string
3. Copy both pooled and direct URLs

---

## 2. Vercel Setup

### 2.1 Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: **Next.js**
4. Root Directory: `frontend`

### 2.2 Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
DIRECT_URL=postgresql://user:password@host/database?sslmode=require

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-for-refresh-tokens
NEXTAUTH_SECRET=nextauth-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 2.3 Build Settings
- Build Command: `prisma generate && next build`
- Install Command: `npm install`
- Output Directory: `.next`

---

## 3. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Generate Prisma Client
        working-directory: frontend
        run: npx prisma generate
      
      - name: Run linter
        working-directory: frontend
        run: npm run lint
      
      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  deploy-preview:
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend
      
      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend
      
      - name: Deploy to Vercel (Preview)
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend

  deploy-production:
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend
      
      - name: Deploy to Vercel (Production)
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend
```

---

## 4. GitHub Secrets Setup

Add these secrets in GitHub repository > Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (get from [vercel.com/account/tokens](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | Your Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Project ID (from `.vercel/project.json` after linking) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |

### Get Vercel IDs:
```bash
cd frontend
npx vercel link
cat .vercel/project.json
```

---

## 5. Database Migrations

### First Time Setup:
```bash
# Push schema to database
npx prisma db push

# Seed initial data
npm run db:seed
```

### Production Migrations:
Add to GitHub Actions before deploy:
```yaml
- name: Run Migrations
  working-directory: frontend
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 6. Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Test authentication flow
- [ ] Check API endpoints
- [ ] Verify image/media uploads
- [ ] Test cart and checkout

---

## Quick Commands

```bash
# Local development
npm run dev

# Build production
npm run build

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Generate Prisma client
npx prisma generate
```
