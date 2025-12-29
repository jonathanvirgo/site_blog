# Authentication & Authorization

## 1. Authentication Strategy: JWT + Refresh Token

### Why JWT + Refresh Token?
- **Stateless**: No session storage on server
- **Scalable**: Works across multiple server instances
- **Secure**: Short-lived access tokens + long-lived refresh tokens

### Token Configuration
| Token Type | Lifetime | Storage |
|------------|----------|---------|
| Access Token | 15 minutes | Memory / HTTP-only Cookie |
| Refresh Token | 7 days | HTTP-only Cookie + Database |

---

## 2. Authentication Flow

### 2.1 Registration
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Fill registration form
    F->>B: POST /api/auth/register
    B->>B: Validate input (Zod)
    B->>B: Hash password (bcrypt)
    B->>DB: Create user record
    DB-->>B: User created
    B->>B: Generate tokens
    B-->>F: { accessToken, user }
    Note over B,F: Set refreshToken in HTTP-only cookie
    F->>F: Store accessToken
    F-->>U: Redirect to homepage
```

### 2.2 Login
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter email & password
    F->>B: POST /api/auth/login
    B->>DB: Find user by email
    DB-->>B: User data
    B->>B: Compare password (bcrypt)
    alt Password valid
        B->>B: Generate Access Token (15min)
        B->>B: Generate Refresh Token (7d)
        B->>DB: Store Refresh Token
        B-->>F: { accessToken, user }
        Note over B,F: Set refreshToken in HTTP-only cookie
    else Invalid
        B-->>F: 401 Unauthorized
    end
```

### 2.3 Token Refresh
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    Note over F: Access token expired
    F->>B: POST /api/auth/refresh
    Note over F,B: Refresh token sent via cookie
    B->>DB: Find refresh token
    alt Token valid & not expired
        B->>B: Generate new Access Token
        B->>B: Generate new Refresh Token (rotation)
        B->>DB: Revoke old, store new
        B-->>F: { accessToken }
    else Invalid/Expired
        B-->>F: 401 - Force re-login
    end
```

### 2.4 Logout
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    F->>B: POST /api/auth/logout
    B->>DB: Revoke refresh token
    B-->>F: Clear cookies
    F->>F: Clear accessToken from memory
```

---

## 3. Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant E as Email Service

    U->>F: Click "Forgot Password"
    F->>B: POST /api/auth/forgot-password { email }
    B->>DB: Find user by email
    alt User exists
        B->>B: Generate reset token (random, expires 1h)
        B->>DB: Store reset token
        B->>E: Send reset email with link
    end
    B-->>F: "Check your email" (always, even if not found)
    
    Note over U: User clicks email link
    U->>F: Open /auth/reset-password?token=xxx
    F->>B: POST /api/auth/reset-password { token, newPassword }
    B->>DB: Validate token
    alt Token valid
        B->>B: Hash new password
        B->>DB: Update user password
        B->>DB: Invalidate reset token
        B->>DB: Revoke all refresh tokens
        B-->>F: Success
    else Invalid/Expired
        B-->>F: 400 Invalid token
    end
```

---

## 4. Social Login (Optional - Google/Facebook)

### Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as Google OAuth
    participant B as Backend
    participant DB as Database

    U->>F: Click "Login with Google"
    F->>G: Redirect to Google OAuth
    U->>G: Authorize
    G-->>F: Redirect with auth code
    F->>B: POST /api/auth/google { code }
    B->>G: Exchange code for tokens
    G-->>B: { id_token, access_token }
    B->>B: Verify & decode id_token
    B->>DB: Find or create user
    B->>B: Generate JWT tokens
    B-->>F: { accessToken, user }
```

---

## 5. Authorization (Role-Based Access Control)

### Roles
| Role | Description |
|------|-------------|
| `customer` | Default. Can read content, purchase, comment |
| `editor` | Can create/edit articles, manage categories |
| `admin` | Full access: users, products, orders, settings |

### Permission Matrix
| Resource | Action | customer | editor | admin |
|----------|--------|----------|--------|-------|
| Articles | Read | ✅ | ✅ | ✅ |
| Articles | Create | ❌ | ✅ | ✅ |
| Articles | Update | ❌ | ✅ (own) | ✅ |
| Articles | Delete | ❌ | ❌ | ✅ |
| Products | Read | ✅ | ✅ | ✅ |
| Products | Create/Update/Delete | ❌ | ❌ | ✅ |
| Orders | Create | ✅ | ✅ | ✅ |
| Orders | View own | ✅ | ✅ | ✅ |
| Orders | View all | ❌ | ❌ | ✅ |
| Orders | Update status | ❌ | ❌ | ✅ |
| Users | Manage | ❌ | ❌ | ✅ |

### Middleware Example
```typescript
// middleware/auth.ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage
router.post('/articles', requireAuth, requireRole('editor', 'admin'), createArticle);
```

---

## 6. Security Best Practices

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Hash with bcrypt (12 salt rounds)

### Token Security
- Access Token: Short-lived (15 min)
- Refresh Token: HTTP-only, Secure, SameSite=Strict cookie
- Refresh Token Rotation: New token on each refresh

### Rate Limiting
```typescript
// Login: 5 attempts per 15 minutes per IP
// Password reset: 3 requests per hour per email
// Register: 10 per hour per IP
```

### CORS Configuration
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Allow cookies
}));
```
