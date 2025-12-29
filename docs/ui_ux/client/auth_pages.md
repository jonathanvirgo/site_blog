# UI/UX: Authentication Pages

> **Standard**: This document follows [_wireframe_standard.md](./_wireframe_standard.md)

---

## 1. Overview

Authentication pages provide secure login, registration, and password recovery. The design prioritizes simplicity, security indicators, and smooth user experience.

### User Flow
```
Login ←→ Register
  ↓
Forgot Password → Check Email → Reset Password
```

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | New user | Register quickly | I can start shopping |
| US-02 | Returning user | Login with saved credentials | I access my account fast |
| US-03 | User who forgot password | Reset my password | I regain access |
| US-04 | Mobile user | Use social login | I skip typing |

---

## 3. Login Page (`/auth/login`)

### 3.1 Layout
```
┌────────────────────────────────────────────────────────────────┐
│                         [Logo]                                  │
│                         Height: 40px                           │
│                         Margin-bottom: 32px                    │
│                                                                  │
│              ┌────────────────────────────┐                     │
│              │      Đăng nhập             │                     │
│              │      ═══════════           │                     │
│              │      24px / 700            │                     │
│              │                            │                     │
│              │  Email                     │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ user@example.com     │ │                     │
│              │  └──────────────────────┘ │                     │
│              │  48px height, 16px text   │                     │
│              │                            │                     │
│              │  Mật khẩu                  │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ ••••••••       [👁]  │ │                     │
│              │  └──────────────────────┘ │                     │
│              │  Toggle visibility icon   │                     │
│              │                            │                     │
│              │  ☐ Ghi nhớ   [Quên mật khẩu?]                   │
│              │  ──────────────────────   │                     │
│              │  14px checkbox / link     │                     │
│              │                            │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │    Đăng nhập         │ │                     │
│              │  └──────────────────────┘ │                     │
│              │  Primary button, 48px     │                     │
│              │                            │                     │
│              │  ──────── hoặc ────────   │                     │
│              │  14px / Slate-400         │                     │
│              │                            │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ 🔵 Google            │ │                     │
│              │  └──────────────────────┘ │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ 🔵 Facebook          │ │                     │
│              │  └──────────────────────┘ │                     │
│              │  Outline buttons, 44px    │                     │
│              │                            │                     │
│              │  Chưa có tài khoản?        │                     │
│              │  [Đăng ký ngay]            │                     │
│              │  14px / Primary link       │                     │
│              └────────────────────────────┘                     │
│              Card: 400px width, 32px padding                    │
│              Background: White, Shadow-lg                       │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
Page background: Slate-50 or gradient
```

### 3.2 Component Interface
```typescript
interface LoginFormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  onSocialLogin: (provider: 'google' | 'facebook') => void;
  isLoading?: boolean;
  error?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

### 3.3 Validation
| Field | Rules | Error Message |
|-------|-------|---------------|
| email | required, email format | Vui lòng nhập email hợp lệ |
| password | required, min 8 chars | Mật khẩu tối thiểu 8 ký tự |

---

## 4. Register Page (`/auth/register`)

### 4.1 Layout
```
┌────────────────────────────────────────────────────────────────┐
│                         [Logo]                                  │
│                                                                  │
│              ┌────────────────────────────┐                     │
│              │      Tạo tài khoản         │                     │
│              │                            │                     │
│              │  Họ và tên *               │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ Nguyễn Văn A         │ │                     │
│              │  └──────────────────────┘ │                     │
│              │                            │                     │
│              │  Email *                   │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ user@example.com     │ │                     │
│              │  └──────────────────────┘ │                     │
│              │                            │                     │
│              │  Mật khẩu *                │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ ••••••••       [👁]  │ │                     │
│              │  └──────────────────────┘ │                     │
│              │                            │                     │
│              │  PASSWORD STRENGTH         │                     │
│              │  ✓ Ít nhất 8 ký tự (Green) │                     │
│              │  ✓ Có chữ hoa     (Green) │                     │
│              │  ✗ Có số          (Gray)  │                     │
│              │                            │                     │
│              │  Xác nhận mật khẩu *       │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │ ••••••••             │ │                     │
│              │  └──────────────────────┘ │                     │
│              │                            │                     │
│              │  ☑ Tôi đồng ý với          │                     │
│              │    [Điều khoản sử dụng]   │                     │
│              │                            │                     │
│              │  ┌──────────────────────┐ │                     │
│              │  │    Đăng ký           │ │                     │
│              │  └──────────────────────┘ │                     │
│              │                            │                     │
│              │  Đã có tài khoản?          │                     │
│              │  [Đăng nhập]               │                     │
│              └────────────────────────────┘                     │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Interface
```typescript
interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface PasswordStrength {
  minLength: boolean;    // ≥ 8 chars
  hasUppercase: boolean; // A-Z
  hasNumber: boolean;    // 0-9
  hasSpecial?: boolean;  // optional
}
```

### 4.3 Validation Rules
| Field | Rules | Error |
|-------|-------|-------|
| fullName | required, min 2 | Vui lòng nhập họ tên |
| email | required, email, unique | Email đã được sử dụng |
| password | min 8, uppercase, number | Mật khẩu không đủ mạnh |
| confirmPassword | matches password | Mật khẩu không khớp |
| acceptTerms | must be true | Vui lòng đồng ý điều khoản |

---

## 5. Forgot Password (`/auth/forgot`)

### 5.1 Step 1: Enter Email
```
┌────────────────────────────────┐
│      Quên mật khẩu?            │
│      ═══════════════           │
│                                │
│  Nhập email để nhận link       │
│  đặt lại mật khẩu              │
│  ────────────────────────────  │
│  16px / 400 / Slate-600       │
│                                │
│  Email                         │
│  ┌──────────────────────────┐ │
│  │ user@example.com         │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │  Gửi link đặt lại        │ │
│  └──────────────────────────┘ │
│                                │
│  [← Quay lại đăng nhập]        │
│  Link, 14px                    │
└────────────────────────────────┘
```

### 5.2 Step 2: Email Sent
```
┌────────────────────────────────┐
│           ✉️                    │
│      Icon: 64px, Primary       │
│                                │
│  Kiểm tra email của bạn        │
│  ═══════════════════════       │
│  24px / 700                    │
│                                │
│  Chúng tôi đã gửi link đặt    │
│  lại mật khẩu đến:             │
│  user@example.com              │
│  (Bold)                        │
│                                │
│  Không nhận được email?        │
│  ┌──────────────────────────┐ │
│  │  Gửi lại (60s)           │ │
│  └──────────────────────────┘ │
│  Disabled with countdown       │
│                                │
│  [← Quay lại đăng nhập]        │
└────────────────────────────────┘
```

---

## 6. Reset Password (`/auth/reset?token=xxx`)

### 6.1 Valid Token
```
┌────────────────────────────────┐
│      Đặt mật khẩu mới          │
│                                │
│  Mật khẩu mới                  │
│  ┌──────────────────────────┐ │
│  │ ••••••••       [👁]      │ │
│  └──────────────────────────┘ │
│  PASSWORD STRENGTH INDICATOR   │
│  ✓ Ít nhất 8 ký tự            │
│  ✓ Có chữ hoa                 │
│  ✓ Có số                      │
│                                │
│  Xác nhận mật khẩu             │
│  ┌──────────────────────────┐ │
│  │ ••••••••                 │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │  Đặt mật khẩu mới        │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

### 6.2 Invalid/Expired Token
```
┌────────────────────────────────┐
│           ⚠️                    │
│      Icon: 64px, Red           │
│                                │
│  Link đã hết hạn               │
│  ═════════════════             │
│  24px / 700 / Red              │
│                                │
│  Link đặt lại mật khẩu đã     │
│  hết hạn hoặc không hợp lệ.   │
│                                │
│  ┌──────────────────────────┐ │
│  │  Gửi link mới            │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

---

## 7. Components

### 7.1 Password Input
```typescript
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
  error?: string;
  placeholder?: string;
}
```

### 7.2 Social Login Buttons
```typescript
interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onClick: () => void;
  isLoading?: boolean;
}
```

---

## 8. Design Guidelines

### 8.1 Colors
| Element | Color |
|---------|-------|
| Primary button | Primary-600 (#2563EB) |
| Google button | White bg, #4285F4 icon |
| Facebook button | #1877F2 bg |
| Error text | Red-500 (#EF4444) |
| Success | Green-500 (#22C55E) |
| Helper text | Slate-500 |

### 8.2 Typography
| Element | Style |
|---------|-------|
| Page title | 24px / 700 / Slate-900 |
| Labels | 14px / 500 / Slate-700 |
| Input text | 16px / 400 (prevents zoom) |
| Helper/Error | 12px / 400 |
| Links | Primary-600, underline on hover |

### 8.3 Spacing
| Element | Value |
|---------|-------|
| Card padding | 32px (desktop), 24px (mobile) |
| Input margin-bottom | 16px |
| Button height | 48px |
| Gap between fields | 20px |

---

## 9. States & Feedback

### Loading
```css
.btn-loading {
  pointer-events: none;
}
.btn-loading::after {
  content: '';
  animation: spin 1s linear infinite;
}
```

### Success
- Register → Toast "Đăng ký thành công" + redirect to login
- Reset password → Toast + redirect to login

### Errors
- Inline below field (red, 12px)
- General error: Alert box above form

---

## 10. Animations

### Form Entrance
```css
.auth-card {
  animation: fadeSlideUp 300ms ease;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

### Password Strength Transition
```css
.strength-item {
  transition: color 200ms ease;
}
.strength-item.valid {
  color: var(--green-500);
}
```

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Form labels | Visible labels for all inputs |
| Error association | `aria-describedby` linking |
| Focus visible | 2px primary outline |
| Password toggle | Accessible button with label |
| Screen reader | Announce validation errors |

---

## 12. Mobile Responsiveness

| Element | Desktop | Mobile |
|---------|---------|--------|
| Card | Centered, 400px | Full width, no card |
| Padding | 32px | 24px |
| Background | Gradient | Solid white |
| Touch targets | 44px min | 48px min |

---

## 13. Performance

| Metric | Target |
|--------|--------|
| LCP | < 1.5s |
| FID | < 50ms |
| CLS | < 0.05 |

### Optimizations
- Preload logo image
- Minimal JS bundle
- No third-party fonts blocking
