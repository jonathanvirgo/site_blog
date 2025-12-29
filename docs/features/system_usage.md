# System Usage Dashboard

> Trang quản lý theo dõi dung lượng và giới hạn của các dịch vụ miễn phí

---

## 1. Mục đích

Theo dõi usage của các dịch vụ miễn phí để:
- Tránh vượt quá giới hạn
- Lập kế hoạch nâng cấp khi cần
- Giám sát tài nguyên hệ thống

---

## 2. Các dịch vụ được theo dõi

| Service | Free Tier | Metrics | API Available |
|---------|-----------|---------|---------------|
| **Cloudinary** | 25GB storage, 25GB bandwidth/month | Storage, Bandwidth, Transformations | ✅ Yes |
| **Resend** | 3,000 emails/month | Emails sent | ✅ Yes |
| **Redis Cloud** | 30MB memory | Memory used | ✅ Via INFO |
| **Supabase** | 500MB database | Database size | ✅ Via SQL |
| **Vercel** | 100GB bandwidth/month | - | ❌ No API |

---

## 3. API Endpoint

### `GET /api/admin/system-usage`

**Response:**
```json
{
  "cloudinary": {
    "storage": { "used": 18500000000, "limit": 25000000000 },
    "bandwidth": { "used": 5000000000, "limit": 25000000000 },
    "transformations": { "used": 1200, "limit": 25000 }
  },
  "resend": {
    "emails": { "used": 1500, "limit": 3000 }
  },
  "redis": {
    "memory": { "used": 15000000, "limit": 30000000 }
  },
  "database": {
    "size": { "used": 50000000, "limit": 500000000 }
  },
  "lastUpdated": "2024-12-19T10:00:00Z"
}
```

---

## 4. UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                    [Refresh 🔄]               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SYSTEM USAGE                                                                │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐             │
│  │  ☁️ Cloudinary Storage    │  │  ☁️ Cloudinary Bandwidth  │             │
│  │                            │  │                            │             │
│  │  ████████████████░░░░ 72% │  │  ██████░░░░░░░░░░░░░░ 20%  │             │
│  │  18.0 GB / 25.0 GB        │  │  5.0 GB / 25.0 GB          │             │
│  └────────────────────────────┘  └────────────────────────────┘             │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐             │
│  │  📧 Resend Emails          │  │  🔴 Redis Memory          │             │
│  │                            │  │                            │             │
│  │  ██████████░░░░░░░░░░ 50% │  │  ████████████░░░░░░░░ 50%  │             │
│  │  1,500 / 3,000 emails     │  │  15.0 MB / 30.0 MB         │             │
│  └────────────────────────────┘  └────────────────────────────┘             │
│                                                                              │
│  ┌────────────────────────────┐                                             │
│  │  🐘 Database Size          │                                             │
│  │                            │                                             │
│  │  ██░░░░░░░░░░░░░░░░░░ 10% │                                             │
│  │  50.0 MB / 500.0 MB       │                                             │
│  └────────────────────────────┘                                             │
│                                                                              │
│  Last updated: 2 minutes ago                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation

### 5.1 Files

| File | Description |
|------|-------------|
| `src/app/api/admin/system-usage/route.ts` | API endpoint |
| `src/app/admin/page.tsx` | Dashboard UI (updated) |
| `src/lib/system-usage.ts` | Usage fetching utilities |

### 5.2 Caching Strategy

- **Cache TTL**: 10 phút (tránh rate limit từ external APIs)
- **Cache Key**: `system:usage`
- **Storage**: Redis

### 5.3 API Integration

#### Cloudinary
```typescript
import { v2 as cloudinary } from "cloudinary";
const usage = await cloudinary.api.usage();
```

#### Resend
```typescript
// Count emails từ database hoặc dùng Resend API
const { data } = await resend.emails.list();
```

#### Redis
```typescript
const info = await redis.info("memory");
// Parse: used_memory, maxmemory
```

#### Database
```sql
SELECT pg_database_size(current_database()) as size;
```

---

## 6. Warning Thresholds

| Level | Threshold | Color |
|-------|-----------|-------|
| Normal | < 60% | Green |
| Warning | 60-80% | Yellow |
| Critical | > 80% | Red |

---

## 7. Environment Variables

Không cần thêm biến mới - sử dụng các biến đã có:
- `CLOUDINARY_*` - Cloudinary API
- `RESEND_API_KEY` - Resend API
- `REDIS_URL` - Redis connection
- `DATABASE_URL` - PostgreSQL connection
