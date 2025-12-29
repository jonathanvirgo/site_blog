# Common UI Components

> **Standard**: This document follows [../_wireframe_standard.md](../_wireframe_standard.md)

Shared components used across both Admin and Client interfaces.

---

## 1. Buttons

### Variants
| Variant | Use Case | Style |
|---------|----------|-------|
| Primary | Main actions | Filled, brand color |
| Secondary | Secondary actions | Outline |
| Ghost | Tertiary/Cancel | Text only |
| Danger | Destructive actions | Red filled |

### Sizes
| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px | 12px 16px | 14px |
| md | 40px | 12px 20px | 14px |
| lg | 48px | 16px 24px | 16px |

### States
| State | Style |
|-------|-------|
| Default | Normal |
| Hover | Darken 10% |
| Active | Darken 15% |
| Disabled | Opacity 50%, no pointer |
| Loading | Spinner, disabled |

---

## 2. Form Inputs

### Text Input
```typescript
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel';
}
```

**Dimensions:**
- Height: 44px (48px mobile)
- Border-radius: 8px
- Font size: 16px (prevents zoom on iOS)

### Select Dropdown
```typescript
interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}
```

---

## 3. Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showClose?: boolean;
}
```

**Sizes:**
| Size | Max Width |
|------|-----------|
| sm | 400px |
| md | 600px |
| lg | 800px |
| full | 100vw - 32px |

**Animation:**
```css
.modal-overlay { animation: fadeIn 150ms ease; }
.modal-content { animation: slideUp 200ms ease; }
```

---

## 4. Toast Notifications

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ms, default 3000
}
```

**Position:** Bottom-right (desktop), Bottom-center (mobile)

---

## 5. Loading States

### Spinner
- Sizes: 16px, 24px, 32px, 48px
- Color: Primary or inherit

### Skeleton
- Background: Slate-200
- Animation: Shimmer left-to-right
- Border-radius: Match content

---

## 6. Empty States

```
┌────────────────────────────────────┐
│            [Icon/Illustration]     │
│                                    │
│         Primary Message            │
│         ═══════════════            │
│         20px / 600                 │
│                                    │
│         Secondary description      │
│         16px / 400 / Slate-500     │
│                                    │
│         [Primary Action Button]    │
└────────────────────────────────────┘
```

---

## 7. Card

```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}
```

**Styles:**
- Background: White
- Border: 1px Slate-200
- Border-radius: 12px
- Shadow: None (hover: sm)

---

## 8. Pagination

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}
```

**Layout:**
```
[←] [1] [2] [3] ... [10] [→]    Trang 1 / 10
```

---

## 9. Accessibility Requirements

| Component | Requirement |
|-----------|-------------|
| Button | `aria-disabled`, `aria-busy` for loading |
| Modal | Focus trap, `aria-modal`, Escape to close |
| Toast | `role="alert"`, `aria-live="polite"` |
| Form | Labels linked via `htmlFor` + `id` |
