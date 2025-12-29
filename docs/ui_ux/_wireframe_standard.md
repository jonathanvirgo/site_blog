# Wireframe Specification Standard

This document defines the **standard format** for all UI/UX wireframe specifications. All page documentation in this folder MUST follow this structure.

---

## 📋 Document Structure Template

Every UI/UX page document should include the following sections:

```markdown
# UI/UX: [Page Name]

## 1. Overview
Brief description of the page purpose and its role in the user journey.

## 2. User Stories
- As a [user type], I want to [action] so that [benefit]

## 3. Layout Specification
### 3.1 Desktop Layout (≥1024px)
[ASCII wireframe or description]

### 3.2 Tablet Layout (768px - 1023px)
[Changes from desktop]

### 3.3 Mobile Layout (<768px)
[Changes for mobile]

## 4. Components
### 4.1 [Component Name]
- **Purpose**: What it does
- **Props/Data**: What data it needs
- **States**: default, hover, active, disabled, loading, error
- **Interactions**: Click, hover, scroll behaviors

## 5. Data Requirements
- API endpoints used
- Data structure expected

## 6. States & Feedback
- Loading states
- Empty states  
- Error states
- Success feedback

## 7. Accessibility
- Keyboard navigation
- Screen reader considerations
- Focus management

## 8. SEO (if applicable)
- Meta tags
- Structured data
```

---

## 🎨 Design Tokens

All pages should reference these design tokens:

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #2563EB | Primary actions, links |
| `--color-primary-hover` | #1D4ED8 | Hover state |
| `--color-secondary` | #64748B | Secondary text |
| `--color-success` | #22C55E | Success states |
| `--color-warning` | #F59E0B | Warning states |
| `--color-error` | #EF4444 | Error states |
| `--color-background` | #FFFFFF | Page background |
| `--color-surface` | #F8FAFC | Card backgrounds |
| `--color-border` | #E2E8F0 | Borders |
| `--color-text` | #1E293B | Primary text |
| `--color-text-muted` | #64748B | Secondary text |

### Typography
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-h1` | 36px | 700 | Page titles |
| `--text-h2` | 28px | 600 | Section headers |
| `--text-h3` | 22px | 600 | Subsection headers |
| `--text-h4` | 18px | 600 | Card titles |
| `--text-body` | 16px | 400 | Body text |
| `--text-small` | 14px | 400 | Helper text |
| `--text-caption` | 12px | 400 | Captions, labels |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing |
| `--space-sm` | 8px | Small gaps |
| `--space-md` | 16px | Default spacing |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Large gaps |
| `--space-2xl` | 48px | Page sections |

### Breakpoints
| Name | Width | Description |
|------|-------|-------------|
| `mobile` | < 768px | Phones |
| `tablet` | 768px - 1023px | Tablets |
| `desktop` | ≥ 1024px | Desktops |
| `wide` | ≥ 1280px | Large screens |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 8px | Cards, buttons |
| `--radius-lg` | 12px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

### Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.1) | Cards |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modals, dropdowns |

---

## 🧱 Common Components

### Button
```
┌─────────────────────┐
│   [Icon] Label      │  Height: 40px (md), 32px (sm), 48px (lg)
└─────────────────────┘  Padding: 16px horizontal
```
**Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`
**States**: default, hover, active, disabled, loading

### Input Field
```
┌─────────────────────────────────────┐
│ Label                               │
│ ┌─────────────────────────────────┐│
│ │ Placeholder text            [🔍]││  Height: 40px
│ └─────────────────────────────────┘│
│ Helper text or error message        │
└─────────────────────────────────────┘
```
**States**: default, focus, filled, error, disabled

### Card
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐│
│ │         [Image Area]            ││  Aspect: 16:9 or 4:3
│ └─────────────────────────────────┘│
│                                     │
│ [Badge]                             │
│ Title Text (H4)                     │  Max 2 lines
│ Description or excerpt text...      │  Max 3 lines
│                                     │
│ [Meta info]        [Action Button] │
└─────────────────────────────────────┘
```
**Variants**: `article`, `product`, `horizontal`, `minimal`

### Modal/Dialog
```
┌─────────────────────────────────────────┐
│  Title                            [✕]  │
├─────────────────────────────────────────┤
│                                         │
│  Content area                           │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Confirm]        │
└─────────────────────────────────────────┘
```
**Width**: 400px (sm), 560px (md), 720px (lg)
**Backdrop**: Semi-transparent black overlay

### Toast/Notification
```
┌───────────────────────────────────┐
│ [✓] Success message here    [✕]  │  Duration: 3-5 seconds
└───────────────────────────────────┘
```
**Position**: Top-right (desktop), Bottom-center (mobile)
**Variants**: `success`, `error`, `warning`, `info`

### Badge
```
┌──────────┐
│  Label   │  Padding: 4px 8px, Font: 12px
└──────────┘
```
**Variants**: `default`, `success`, `warning`, `error`, `outline`

### Avatar
```
┌───┐
│ A │  Size: 24px (xs), 32px (sm), 40px (md), 56px (lg)
└───┘
```
**Fallback**: First letter of name with background color

### Skeleton Loader
```
┌─────────────────────────────────────┐
│ ████████████████████                │  Shimmer animation
│ ████████████                        │
│ ████████████████████████████        │
└─────────────────────────────────────┘
```

---

## 📐 Layout Patterns

### Container
```
│← 16px →│←───────── Content (max 1280px) ─────────→│← 16px →│
```
- Max width: 1280px
- Side padding: 16px (mobile), 24px (tablet), 32px (desktop)

### Grid System
- **12 columns** for complex layouts
- **Gap**: 16px (mobile), 24px (desktop)

### Common Layout: 2-Column with Sidebar
```
┌────────────────────────────────────────────────────────────────┐
│                            HEADER                               │
├─────────────────────────────────────────┬──────────────────────┤
│                                         │                      │
│              MAIN CONTENT               │      SIDEBAR         │
│                  (8 cols)               │      (4 cols)        │
│                                         │                      │
│                                         │                      │
└─────────────────────────────────────────┴──────────────────────┘
```
Mobile: Sidebar moves below main content

### Common Layout: Full Width
```
┌────────────────────────────────────────────────────────────────┐
│                            HEADER                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         FULL WIDTH CONTENT                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Interaction Patterns

### Loading States
| Element | Loading Indicator |
|---------|-------------------|
| Page | Full-screen skeleton or spinner |
| Section | Section skeleton |
| Button | Spinner inside button, disable click |
| Card | Card skeleton |
| Table | Row skeletons |

### Empty States
```
┌─────────────────────────────────────┐
│             [Icon]                  │
│                                     │
│      No items found                 │
│      Description text explaining    │
│      what to do next                │
│                                     │
│        [Action Button]              │
└─────────────────────────────────────┘
```

### Error States
```
┌─────────────────────────────────────┐
│             [⚠️]                    │
│                                     │
│      Something went wrong           │
│      Error description here         │
│                                     │
│     [Try Again]  [Go Home]          │
└─────────────────────────────────────┘
```

### Form Validation
- **Inline validation**: Show error below field after blur
- **Submit validation**: Scroll to first error, focus field
- **Success**: Show success toast, redirect or reset form

### Navigation Patterns
| Pattern | Usage |
|---------|-------|
| **Tab Bar** | Bottom navigation on mobile |
| **Hamburger Menu** | Mobile menu collapse |
| **Breadcrumb** | Deep navigation paths |
| **Pagination** | Long lists (desktop) |
| **Infinite Scroll** | Long lists (mobile) |

---

## ♿ Accessibility Requirements

### Keyboard Navigation
- All interactive elements must be focusable
- Tab order follows visual order
- Escape closes modals and dropdowns
- Arrow keys for menu navigation

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### ARIA Labels
- Images: `alt` text required
- Buttons without text: `aria-label` required
- Forms: Labels linked to inputs
- Modals: `role="dialog"`, `aria-modal="true"`

### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: 3:1 minimum

---

## 📱 Responsive Behavior

### Mobile-First Approach
1. Design for mobile first
2. Add complexity for larger screens
3. Use progressive enhancement

### Touch Targets
- Minimum size: 44x44px
- Spacing between targets: 8px minimum

### Content Priority
1. Primary action/content first
2. Secondary content below or hidden
3. Navigation accessible via menu

### Image Handling
- Responsive images with `srcset`
- Lazy loading for below-fold images
- WebP format with fallbacks
