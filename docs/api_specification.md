# API Specification

## Base URL
```
Production: https://api.yoursite.com/v1
Development: http://localhost:3001/api/v1
```

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "errors": [] // Only on validation errors
}
```

## Error Codes
| Code | Meaning |
|------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 1. Authentication (`/auth`)

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "Nguyen Van A"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
> Note: `refreshToken` is set as HTTP-only cookie

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "customer" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Cookie: refreshToken=xxx
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_token..."
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

---

## 2. Articles (`/articles`)

### List Articles
```http
GET /articles?page=1&limit=10&category=suc-khoe&featured=true&status=published
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 50) |
| category | string | - | Category slug |
| featured | boolean | - | Filter featured articles |
| status | string | published | draft, published, archived |
| author | string | - | Author ID |
| search | string | - | Full-text search |

**Response**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "10 cách giảm đau lưng hiệu quả",
        "slug": "10-cach-giam-dau-lung-hieu-qua",
        "excerpt": "Đau lưng là vấn đề phổ biến...",
        "featuredImage": "https://cdn.cloudinary.com/...",
        "category": { "id": "uuid", "name": "Sức khỏe", "slug": "suc-khoe" },
        "author": { "id": "uuid", "fullName": "Dr. Nguyen Van A" },
        "publishedAt": "2024-12-15T10:00:00Z",
        "viewCount": 1250,
        "isFeatured": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

### Get Article Detail
```http
GET /articles/:slug
```

**Response**:
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "uuid",
      "title": "10 cách giảm đau lưng hiệu quả",
      "slug": "10-cach-giam-dau-lung-hieu-qua",
      "content": "<p>Full HTML content...</p>",
      "excerpt": "...",
      "featuredImage": "https://...",
      "author": { "id": "uuid", "fullName": "Dr. Nguyen", "avatarUrl": "..." },
      "category": { "id": "uuid", "name": "Sức khỏe", "slug": "suc-khoe" },
      "publishedAt": "2024-12-15T10:00:00Z",
      "viewCount": 1250,
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description",
      "relatedProducts": [
        {
          "id": "uuid",
          "name": "Cao dán giảm đau",
          "slug": "cao-dan-giam-dau",
          "price": 150000,
          "salePrice": 120000,
          "images": ["https://..."],
          "displayPosition": "sidebar"
        }
      ]
    }
  }
}
```

### Create Article (Editor/Admin)
```http
POST /articles
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Tiêu đề bài viết",
  "content": "<p>Nội dung đầy đủ...</p>",
  "excerpt": "Tóm tắt ngắn",
  "categoryId": "uuid",
  "featuredImage": "https://cdn.cloudinary.com/...",
  "status": "draft",
  "isFeatured": false,
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "relatedProducts": [
    { "productId": "uuid", "displayPosition": "sidebar", "sortOrder": 1 }
  ]
}
```

### Update Article (Editor/Admin)
```http
PUT /articles/:id
Authorization: Bearer <accessToken>
```

### Delete Article (Admin)
```http
DELETE /articles/:id
Authorization: Bearer <accessToken>
```

---

## 3. Products (`/products`)

### List Products
```http
GET /products?page=1&limit=12&category=vitamin&minPrice=100000&maxPrice=500000&sort=price_asc
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| page, limit | number | Pagination |
| category | string | Category slug |
| minPrice, maxPrice | number | Price range filter |
| sort | string | price_asc, price_desc, newest, bestselling |
| featured | boolean | Featured products only |
| search | string | Full-text search |

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Vitamin C 1000mg",
        "slug": "vitamin-c-1000mg",
        "shortDescription": "Tăng cường sức đề kháng",
        "price": 250000,
        "salePrice": 199000,
        "stockQuantity": 100,
        "images": ["https://...", "https://..."],
        "category": { "name": "Vitamin", "slug": "vitamin" },
        "isFeatured": true
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Product Detail
```http
GET /products/:slug
```

**Response**:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "Vitamin C 1000mg",
      "slug": "vitamin-c-1000mg",
      "description": "<p>Full description...</p>",
      "shortDescription": "...",
      "price": 250000,
      "salePrice": 199000,
      "stockQuantity": 100,
      "sku": "VIT-C-1000",
      "images": ["https://...", "https://..."],
      "category": { "id": "uuid", "name": "Vitamin" },
      "relatedArticles": [
        { "id": "uuid", "title": "Lợi ích của Vitamin C", "slug": "..." }
      ]
    }
  }
}
```

### Create/Update/Delete Product (Admin)
```http
POST /products
PUT /products/:id
DELETE /products/:id
Authorization: Bearer <accessToken>
```

---

## 4. Categories (`/categories`)

### List Categories
```http
GET /categories?type=article|product|all
```

**Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Sức khỏe",
        "slug": "suc-khoe",
        "description": "...",
        "parentId": null,
        "children": [
          { "id": "uuid", "name": "Tim mạch", "slug": "tim-mach" }
        ],
        "articleCount": 45,
        "productCount": 12
      }
    ]
  }
}
```

---

## 5. Cart (`/cart`)

> **Note:** Cart sử dụng session-based cho guest users và user ID cho authenticated users.

### Get Cart
```http
GET /cart
Authorization: Bearer <accessToken> (optional)
Cookie: session_id=xxx (for guests)
```

**Response**:
```json
{
  "items": [
    {
      "id": "cart_item_id",
      "productId": "product-slug",
      "name": "Vitamin C 1000mg",
      "image": "https://...",
      "variantId": "uuid",
      "sku": "VIT-C-30",
      "price": 199000,
      "quantity": 2,
      "stock": 100
    }
  ],
  "total": 398000
}
```

### Add to Cart
```http
POST /cart
Authorization: Bearer <accessToken> (optional)
Content-Type: application/json

{
  "variantId": "uuid",
  "quantity": 2
}
```

### Update Cart Item
```http
PUT /cart
Authorization: Bearer <accessToken> (optional)
Content-Type: application/json

{
  "itemId": "cart_item_id",
  "quantity": 3
}
```
> Note: Set quantity to 0 to remove item

### Remove from Cart
```http
DELETE /cart?itemId=cart_item_id
Authorization: Bearer <accessToken> (optional)
```

---


## 6. Orders (`/orders`)

### Create Order
```http
POST /orders
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ],
  "shippingInfo": {
    "name": "Nguyen Van A",
    "phone": "0901234567",
    "address": "123 Nguyen Trai",
    "city": "Ha Noi",
    "district": "Thanh Xuan",
    "ward": "Nhan Chinh"
  },
  "paymentMethod": "vnpay",
  "note": "Giao giờ hành chính"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-20241215-001",
      "totalAmount": 728000,
      "status": "pending",
      "paymentStatus": "unpaid",
      "paymentUrl": "https://vnpay.vn/..." // If online payment
    }
  }
}
```

### Get User's Orders
```http
GET /orders?status=pending&page=1&limit=10
Authorization: Bearer <accessToken>
```

### Get Order Detail
```http
GET /orders/:id
Authorization: Bearer <accessToken>
```

### Cancel Order
```http
POST /orders/:id/cancel
Authorization: Bearer <accessToken>
```

### Update Order Status (Admin)
```http
PUT /orders/:id/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "shipping"
}
```

---

## 7. Search (`/search`)

### Mixed Search
```http
GET /search?q=vitamin&type=all&page=1&limit=20
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query (required) |
| type | string | all, articles, products |
| category | string | Filter by category |
| minPrice, maxPrice | number | Price filter (products) |
| sort | string | relevance, newest, price_asc |

**Response**:
```json
{
  "success": true,
  "data": {
    "articles": [
      { "id": "uuid", "title": "Lợi ích của Vitamin C", "type": "article" }
    ],
    "products": [
      { "id": "uuid", "name": "Vitamin C 1000mg", "price": 199000, "type": "product" }
    ],
    "totalArticles": 8,
    "totalProducts": 15
  }
}
```

---

## 8. Upload (`/upload`)

### Upload Image
```http
POST /upload/image
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <binary>
folder: articles | products | avatars
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "articles/abc123",
    "width": 1200,
    "height": 800
  }
}
```

---

## 9. Admin Endpoints (`/admin`)

### Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalArticles": 145,
      "totalProducts": 89,
      "totalOrders": 234,
      "totalRevenue": 15500000,
      "newUsers": 23
    },
    "recentOrders": [...],
    "topProducts": [...],
    "trafficData": [...]
  }
}
```

### Manage Users (Admin)
```http
GET /admin/users
PUT /admin/users/:id
DELETE /admin/users/:id
```
