# FashionAI Mobile Design System

This document defines the mobile UI language for `FashionAI_Mobile`. It establishes the target visual language, tokens, shared component contracts, screen patterns, and implementation guidelines for the Expo React Native mobile application.

The app is built on Expo React Native. Implement screens with React Native primitives, NativeWind classes, gluestack-compatible shared components in `src/components/ui`, and tokens from `src/constants/theme.ts` / `tailwind.config.js`. Do not use DOM APIs, Material Symbols web fonts, or HTML patterns directly.

## Product Direction

FashionAI Mobile is a premium Vietnamese office-wear shopping app with AI try-on and styling as its main differentiators.

Core experience:

- Shop office wear quickly on mobile.
- Try before buying with photo/camera try-on.
- Ask AI Stylist for complete outfits by occasion, weather, style, and budget.
- Chat with AI Chatbot for product advice and style questions.
- Move smoothly from discovery to product detail, cart, checkout, and order completion.

Brand personality:

- **Atelier Paper – Saigon Editorial**: warm, tactile, high-end editorial commerce.
- Quiet luxury: warm paper/ivory surfaces, deep obsidian ink, oxblood primary actions, restrained brass and sage accents.
- Product imagery first, interface chrome second: clean 3:4 photography, square/2px framing, zero decorative drop shadows.
- AI feels useful, tailored, and refined, never playful or gimmicky.

## Relationship to FE's Design System

> [!NOTE]
> **Alignment with Frontend (`FashionAI_FE`)**
> 
> The target visual direction documented in this file is aligned with `FashionAI_FE/docs/design-system.md` ("Atelier Paper – Saigon Editorial") and `FashionAI_FE/docs/product-card-design.md`.
> 
> - **Unified Visual Language**: Both FE and Mobile share the same palette intent (paper `#EFE9E1`, ivory `#FDF8F6`, obsidian `#11100F`, oxblood `#5D1C34`, brass `#A67D44`, sage `#899481`, hairline border), typography hierarchy (Playfair Display for headlines/product names ≥16px, Be Vietnam Pro for body/forms/lists, Monospace for prices/numbers), and shape language (square or 2px corners, no card drop shadows, underline text tabs instead of pill chips).
> - **Scope and Status**: This document records the **target design contract**. The existing code in `FashionAI_Mobile` currently runs on the burgundy/cream tokens in `src/constants/theme.ts`. Token additions (`paper`, `ivory`, `obsidian`, `brass`, `brassInk`, `taupe`, `sage`, `sageInk`, `line`) and component styling updates are queued for a dedicated implementation phase.
> - **Desktop Table Spec Non-Applicability**: `FashionAI_FE/docs/table-design.md` specifies desktop TanStack data tables for desktop web viewports. Mobile uses focused lists, cards, and bottom sheets; it intentionally does not mirror the desktop table specification.

## Visual References

The mobile experience translates the Atelier Paper editorial direction into tactile touch-first mobile screens:

| Reference | Design Intent |
| --- | --- |
| Home | Editorial commerce home with search, collection hero, category underline tabs, try-on promo, personalized products, AI Stylist, new arrivals, and style guide. |
| Product Discovery | Readable 2-column product grid, sticky compact header, search, horizontal category underline tabs, filter/sort bottom sheets. |
| Product Detail | Large product gallery, clear color selection, made-to-measure guidance, try-on banner, accordions, stylist recommendations, sticky action bar. |
| Photo Try-On | 3:4 viewport, source toggle, compare original/result, selected garment row, result CTAs, secure photo reassurance. |
| Camera Try-On | Camera-dominant fitting room, alignment guide, session state, garment picker, prominent live try-on CTA. |
| AI Stylist | Chat-like outfit recommendation, lookbook card, set breakdown, follow-up prompt chips, sticky composer. |
| Cart | Compact product list, quantity stepper, save-for-later, voucher row, cross-sell carousel, sticky checkout bar. |
| Checkout | Focused single-column payment flow with address, products, shipping, payment, summary, sticky order CTA. |

## Current Implementation Constraint

P11 Shop and Product Detail follow the deployed mobile viewport audit in `P11_VISUAL_AUDIT.md`. They use white `surfaceLowest` canvases and additive catalog tokens: `catalogMuted` (`#F9F7F5`), `catalogMutedText` (`#8B8880`), `catalogLine` (`#F0EEE9`), and `catalogTailoring` (`#FDFBF7`). NativeWind exposes these as `catalog-muted`, `catalog-muted-text`, `catalog-line`, and `catalog-tailoring`. Catalog cards use 12px radius, detail galleries 16px, and listing gaps 10px (`SPACING.catalogGap` / `gap-catalog-gap`). Detail title and price roles are `text-product-title` (32/40) and `text-product-price` (22/28). Other screens retain the existing palette and roles below.

`src/constants/theme.ts` currently holds the burgundy/cream palette below and is the single source of color values in existing code. `GluestackUIProvider` exposes it to NativeWind as CSS variables; see *NativeWind Tokens* for class names.

P11 Home/Collections adds `editorialBackground` (`#0E161C`) and `editorialShade` (`#000000`) for the deployed editorial surround and image scrim. Existing defaults remain intact. `h-collection-hero` is 440px; `w-collection-card` is a fixed 280px, with 3:4 cards and 16px gaps/corners. `CollectionCover` uses the existing SVG dependency for the image gradient. Home and Collection Detail opt into the existing catalog cards. Native member/quota and feature access remain below Home's collection/product presentation. No season, sale claim, or collection is fabricated when it is absent from the API.

`theme.ts` also carries legacy aliases (`commerceSurface`, `surfaceMuted`, `textPrimary`, `textSecondary`, `textMuted`, `textInverse`, `border`, `borderDark`) still referenced by older StyleSheet code. New screens must not use these legacy aliases.

Rules:

- Use NativeWind, `StyleSheet.create`, and imported theme constants where each is appropriate.
- Keep new shared primitives and gluestack components in `src/components/ui` when reused across screens.
- Keep feature-specific UI inside the relevant `src/features/<feature>/screens` directory until it is reused across features.
- NativeWind is configured for utility-first mobile UI. Keep Tailwind tokens aligned with this document and avoid copying HTML classes blindly.
- Do not add a new component library without updating this file and `AGENTS.md`.

## Color System

### 1. Atelier Paper Palette (Target Design Contract)

This palette mirrors `FashionAI_FE`'s "Atelier Paper – Saigon Editorial" visual system. It uses mobile camelCase token names ready for the upcoming `theme.ts` token expansion.

| Token | Hex / Value | Status | Target Mobile Role |
| --- | --- | --- | --- |
| `colors.paper` | `#EFE9E1` | *Pending `theme.ts`* | Primary screen canvas / paper surface. |
| `colors.ivory` | `#FDF8F6` | *Pending `theme.ts`* | Raised surface, card backgrounds, product metadata panels. |
| `colors.obsidian` | `#11100F` | *Pending `theme.ts`* | Primary ink, dark contrast panels, quick-action base, footer. |
| `colors.oxblood` | `#5D1C34` | **Existing** (`primaryContainer`) | Primary brand action, active states, focus indicator, current price. |
| `colors.brass` | `#A67D44` | *Pending `theme.ts`* | Decorative lines, rating stars, ornaments, labels on dark surfaces. |
| `colors.brassInk` | `#7C5722` | *Pending `theme.ts`* | High-contrast brass text on paper surfaces. |
| `colors.taupe` | `#CDBCAB` | *Pending `theme.ts`* | Secondary dividers, subtle borders, placeholder strokes. |
| `colors.sage` | `#899481` | *Pending `theme.ts`* | New product badge background (`Mới`), quiet support tint. |
| `colors.sageInk` | `#59654F` | *Pending `theme.ts`* | Accessible sage text on light surfaces, quiet success. |
| `colors.muted` | `#6B625A` | *Pending `theme.ts`* | Secondary and caption text on paper/ivory. |
| `colors.line` / `hairline` | `rgba(166, 125, 68, 0.38)` | *Pending `theme.ts`* | 1px hairline rules, card borders, subtle separators. |

> [!IMPORTANT]
> **Token Status Note**:
> `oxblood` (`#5D1C34`) is already present in `src/constants/theme.ts` under the key `primaryContainer` — there is zero value conflict.
> The tokens `paper`, `ivory`, `obsidian`, `brass`, `brassInk`, `taupe`, `sage`, `sageInk`, `muted`, and `line` represent the agreed target system and will be implemented in `theme.ts` in the token implementation pass.

### 2. Current Mobile Code Palette (In `src/constants/theme.ts`)

The current runtime palette powering active components:

| Token | Value | Current Usage |
| --- | --- | --- |
| `colors.surface` | `#FBF9F7` | Current screen background canvas. |
| `colors.background` | `#FBF9F7` | Alias for screen background. |
| `colors.surfaceLowest` | `#FFFFFF` | Current card background, sheets, active segmented control. |
| `colors.surfaceLow` | `#F5F3F1` | Search fields, chips, soft panels. |
| `colors.surfaceContainer` | `#EFEDEC` | Neutral controls and inactive segmented tracks. |
| `colors.surfaceHigh` | `#EAE8E6` | Raised subtle panels and secondary chips. |
| `colors.surfaceHighest` | `#E4E2E0` | Stronger dividers and nested surfaces. |
| `colors.surfaceLine` | `#E5DFD5` | Borders, separators, checkout section lines. |
| `colors.outlineVariant` | `#D7C1C5` | Soft outlines for sheets, chips, cards. |
| `colors.outline` | `#857276` | Disabled/secondary outlines. |
| `colors.primary` | `#41051F` | Deep burgundy, pressed/strong brand surfaces. |
| `colors.primaryContainer` | `#5D1C34` | Main CTA, active tab, badges, selected states (= `oxblood`). |
| `colors.primarySoft` | `#FFD9E1` | Soft selected background and AI hint tint; focused tab icon background. |
| `colors.primarySoftStrong` | `#FFB1C6` | Stronger pink tint, rare highlight. |
| `colors.onPrimary` | `#FFFFFF` | Text/icons on burgundy / oxblood. |
| `colors.onSurface` | `#1B1C1B` | Primary text. |
| `colors.onSurfaceStrong` | `#1A1917` | Strong heading text. |
| `colors.onSurfaceVariant` | `#534346` | Secondary text. |
| `colors.secondary` | `#645D5C` | Body-secondary, inactive tab labels. |
| `colors.inverseSurface` | `#30302F` | Toast background, dark camera controls. |
| `colors.inverseOnSurface` | `#F2F0EE` | Text on inverse surface. |
| `colors.tertiary` | `#705D00` | Warm gold/brown accent. |
| `colors.tertiaryFixed` | `#FFE173` | AI sparkle/gold highlight on dark overlays. |
| `colors.success` | `#10B981` | Success dots, camera ready state, valid shipping. |
| `colors.warning` | `#F59E0B` | Alignment warning, low quota. |
| `colors.danger` | `#BA1A1A` | Errors and destructive actions. |

### Color Rules

- **Oxblood (`#5D1C34` / `primaryContainer`)** is the sole primary action color for main CTAs, active bottom-tabs, focus states, and current product prices.
- **Paper (`#EFE9E1`) and Ivory (`#FDF8F6`)** carry the target screen surfaces; avoid pure harsh whites except where contrast framing demands.
- **Obsidian (`#11100F`)** is used for deep typography, lookbook dark panels, and quick-action icon buttons on product cards.
- **Brass (`#A67D44`)** is reserved for decorative hairlines, dark-surface accents, and review stars. Small text on light surfaces must use `brassInk` (`#7C5722`) for accessible contrast.
- **Sage (`#899481`)** is used strictly for the `Mới` (New) badge and soft supportive accents. Never use sage for a primary CTA.
- **Error / Destructive** actions use `danger` (`#BA1A1A`). Success messages on paper use `sageInk` (`#59654F`) or `success` (`#10B981`).
- Error, success, and warning states must be paired with clear text or an icon, never conveyed by color alone.

## NativeWind Tokens

### Current NativeWind Class Map

gluestack components hard-code shadcn-style names (`primary`, `muted`, `border`, ...), so those names take precedence in shared primitives:

| `theme.ts` (`COLORS.*`) | NativeWind class | Notes |
| --- | --- | --- |
| `primaryContainer` | `bg-primary` / `bg-primary-container` | Main action color (`oxblood`). |
| `primary` | `bg-primary-strong` | Pressed burgundy (`#41051F`). |
| `primarySoft`, `primarySoftStrong` | `bg-primary-soft`, `bg-primary-soft-strong` | |
| `onPrimary` | `text-primary-foreground` / `text-on-primary` | Text on oxblood. |
| `surface` | `bg-background` / `bg-surface` | Current screen canvas. |
| `surfaceLowest` | `bg-card` / `bg-surface-lowest` | Current cards, sheets (`bg-popover`). |
| `surfaceLow` | `bg-muted` / `bg-surface-low` | Search fields, chips. |
| `surfaceContainer` | `bg-accent` / `bg-surface-container` | Segmented tracks, ghost pressed. |
| `surfaceHigh` | `bg-secondary` / `bg-surface-high` | Secondary button background. |
| `surfaceHighest` | `bg-surface-highest` | High-contrast surfaces. |
| `surfaceLine` | `border-border` / `border-input` / `border-surface-line` | Divider / border. |
| `outline`, `outlineVariant` | `border-outline`, `border-outline-variant` | Outlines (`ring` = `outline`). |
| `onSurface` | `text-foreground` / `text-on-surface` | Primary text. |
| `onSurfaceStrong`, `onSurfaceVariant` | `text-on-surface-strong`, `text-on-surface-variant` | Strong / secondary text. |
| `secondary` | `text-muted-foreground` | Inactive tabs, muted body. |
| `inverseSurface`, `inverseOnSurface` | `bg-inverse-surface`, `text-inverse-on-surface` | Toasts. |
| `tertiary`, `tertiaryFixed` | `text-tertiary`, `text-tertiary-fixed` | AI accents. |
| `danger` | `bg-destructive` / `text-danger` | Destructive actions. |
| `success`, `warning` | `text-success`, `text-warning` | Status colors. |

### Target Atelier Paper Utility Classes (Pending Configuration)

Once tokens are integrated into `tailwind.config.js` and `GluestackUIProvider`:

| Target Utility | Value / Color | Role |
| --- | --- | --- |
| `bg-paper` | `#EFE9E1` | Main paper background canvas. |
| `bg-ivory` | `#FDF8F6` | Card backgrounds, raised sections, metadata panels. |
| `bg-obsidian` / `text-obsidian` | `#11100F` | Dark panels, ink text, add-to-cart base. |
| `bg-oxblood` / `text-oxblood` | `#5D1C34` | Brand CTA, active indicator, current price. |
| `text-brass` / `border-brass` | `#A67D44` | Decorative borders, stars, dark-surface labels. |
| `text-brass-ink` | `#7C5722` | High-contrast brass text on paper. |
| `border-taupe` | `#CDBCAB` | Soft dividers, structural lines. |
| `bg-sage` | `#899481` | New product badge (`Mới`). |
| `text-sage-ink` | `#59654F` | Accessible quiet success text. |
| `text-muted` | `#6B625A` | Secondary text on paper. |
| `border-line` | `rgba(166,125,68,0.38)` | 1px hairline card borders and dividers. |

## Typography

The Atelier Paper system establishes a clear three-family typographic role division:

1. **Display / Serif (`Playfair Display`)**: Editorial headlines, collection titles, screen hero headers, and product names ≥16px.
2. **Sans (`Be Vietnam Pro`)**: Default readable text, UI navigation, forms, body copy, and compact list items (cart, checkout, search).
3. **Monospace (`JetBrains Mono` / Tabular Monospace)**: Product prices, quantities, counts, step numbers, order IDs, and chapter/frame labels.

### Font Family Status

- **`Be Vietnam Pro` (`400`, `500`, `600`, `700`)**: Embedded at build time by the `expo-font` plugin in `app.json` (from `@expo-google-fonts/be-vietnam-pro`). Fully operational.
- **`Playfair Display`**: Currently used via system serif for the `AppHeader` "StAele." wordmark. Expanding full Playfair Display weights across headlines and product cards is part of the target implementation.
- **`JetBrains Mono` (or system tabular monospace)**: Planned for prices and numerical metadata to guarantee exact tabular alignment without layout shifts.

### Typographic Hierarchy & Roles

| Role | Font Family | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- | --- |
| **Display** | Playfair Display / Serif | `32-34` | `40-42` | `700` | Major hero headlines, editorial lookbook titles. |
| **Headline LG** | Playfair Display / Serif | `24-26` | `32-34` | `700` | Feature headers, collection titles. |
| **Headline MD** | Playfair Display / Serif | `18-20` | `26-28` | `600` | Section titles, sheet headings. |
| **Headline SM** | Playfair Display / Serif | `16-17` | `22-24` | `600` | Product card titles (grid/detail), screen sub-headers. |
| **Body LG** | Be Vietnam Pro | `16` | `24` | `400` | Editorial introductions, lead paragraphs. |
| **Body MD** | Be Vietnam Pro | `14` | `20` | `400` / `500` | Default body text, form fields, compact lists. |
| **Body SM** | Be Vietnam Pro | `12` | `16` | `400` | Secondary copy, helper text, timestamps. |
| **Label LG** | Be Vietnam Pro | `13` | `18` | `600` | Button labels, selected tabs, uppercase tags. |
| **Label MD** | Be Vietnam Pro | `11` | `14` | `600` | Badges, category underline tabs, metadata. |
| **Price LG** | Monospace | `18-20` | `22-24` | `700` | Checkout totals, detail page primary prices in oxblood. |
| **Price SM** | Monospace | `13-14` | `16-18` | `600` | Product card listing prices in oxblood. |

### Typography Rules

- User-facing copy is Vietnamese with proper diacritics. Ensure adequate line height (minimum `1.15-1.2` for display, `1.4-1.6` for body) to protect Vietnamese marks.
- Product titles on cards: maximum 2 lines (`numberOfLines={2}`). Use `Playfair Display` (≥16px) for standalone product cards; use `Be Vietnam Pro 500/14px` for dense rows (cart, checkout, search list).
- Prices are always formatted with monospace styling and colored in `oxblood` (`#5D1C34`). Struck-through original prices are rendered in `muted` (`#6B625A`) at a smaller scale.
- Avoid all-caps for long Vietnamese text; restrict uppercase to short labels, chapter markers, and badges (`tracking-widest`).

## Spacing, Radius, Shadow & Hairline

### Spacing Scale

The spacing scale is built on a 4px base (`inlineRem: 16`):

| Token | Value | Usage |
| --- | --- | --- |
| `spacing.xs` | `4` | Tight icon/text gap, micro padding. |
| `spacing.sm` | `8` | Internal gaps, chip padding, badge padding. |
| `spacing.md` | `12` | Card gutters, list item separation. |
| `spacing.lg` | `16` | Standard screen horizontal padding / margin. |
| `spacing.xl` | `20` | Section vertical padding. |
| `spacing.xxl` | `24` | Section separation, product card vertical gap. |
| `spacing.xxxl` | `32` | Major editorial section division. |
| `spacing.giant` | `48` | Rare hero spacing. |

### Radius: The Atelier Paper Shape Rule

> [!IMPORTANT]
> **Atelier Paper Shape Contract:**
> The older "rounded 6–24px everywhere + pill everything" visual language is replaced with crisp, architectural lines:
> - **Square or 2px corners (`rounded-none` or `rounded-[2px]`)** for product images, cards, input fields, and primary buttons.
> - **`rounded-full`** is strictly reserved for status dots, user avatars, and circular 44x44 icon buttons.
> - Pills are **never** the default shape for cards, containers, or category controls.

| Token | Value | Target Atelier Paper Usage |
| --- | --- | --- |
| `radius.none` | `0` | Collection panels, hero viewports, full-width banners. |
| `radius.subtle` | `2` (`rounded-[2px]`) | **Default control & card shape**: product media, cards, inputs, primary/secondary buttons. |
| `radius.sheet` | `16-20` | Top corners of modal bottom sheets (for ergonomic gesture handling). |
| `radius.full` | `9999` | Status indicators, user profile avatars, circular icon-only buttons. |

### Hairlines & Borders

Depth and separation in Atelier Paper come from contrast and hairlines, not heavy shadows:

- **Hairline Rule**: `1px` solid `rgba(166, 125, 68, 0.38)` (`border-line`) for card outlines, horizontal dividers, and quiet borders.
- **Dark Hairline**: `1px` solid `rgba(239, 233, 225, 0.15)` for borders on obsidian/dark panels.
- **Strong Outline**: `1px` solid `#11100F` (`obsidian`) for high-contrast frames.
- **Selected State Inset Rule**: A `2px` inset brass or oxblood line for selected collections, swatches, or options—**never** a blurry shadow ring.

### Shadow Policy

- **No decorative drop shadows on product cards or content cards.** Cards stay flat, structured by hairline borders (`border-line`) and surface contrast (paper canvas vs. ivory card).
- Header and bottom navigation bars may use an imperceptible structural hairline divider (`border-b border-line`) rather than elevation shadows.
- Bottom sheets and action modals may use focused backdrop dimming (`rgba(17, 16, 15, 0.5)`) and subtle elevation for modal layering.

## Screen Shells

### Mobile Tab Shell

Used for Home, Product Discovery, Try-On, AI Stylist, and Profile tabs:

- **AppHeader** (`src/components/common/AppHeader.tsx`): StAele. wordmark, Search icon, NotificationBell, Cart bag with badge.
- **Fixed Bottom Tab Bar** (`78px` height + safe area insets):
  - Background: `paper` (`#EFE9E1`) or `surface` with a 1px top hairline border (`border-t border-line`).
  - Active tab: `oxblood` (`#5D1C34`) icon stroke and label with a 4x4 oxblood indicator dot below.
  - Inactive tab: `muted` (`#6B625A`) icon stroke and label.
  - Icons: `lucide-react-native` (`Home`, `Package`, `Sparkles`, `WandSparkles`, `User`).

| Tab | Route | Label | Icon |
| --- | --- | --- | --- |
| Home | `HomeTab` | `Trang chủ` | `<Home>` |
| Shop | `ShopTab` | `Sản phẩm` | `<Package>` |
| Try-On | `TryOnTab` | `Thử đồ` | `<Sparkles>` |
| AI Stylist | `StylistTab` | `AI Stylist` | `<WandSparkles>` |
| Profile | `ProfileTab` | `Tài khoản` | `<User>` |

### Stack Shell

Used for Cart, Checkout, Product Detail, Orders, and Modal screens:

- Header with back button on the left (`ArrowLeft`), centered title in Playfair Display or Be Vietnam Pro 600, optional action on the right.
- Sticky bottom action bar with safe area padding: elevated with a top hairline border, housing the primary CTA button in oxblood.

## Navigation And Headers

- **Commerce Header (`AppHeader`)**: StAele. wordmark left, Search + NotificationBell + Cart right.
- **Try-On Header (`TryOnHeader`)**: Brand mark plus `Ảnh / Camera / Stylist` segmented mode switch.
- **Checkout Header**: Back button, centered `Thanh toán`, no distracting actions.
- **Product Detail Header**: Back button, product title or category, share/bag actions right.
- Header height: `52-56px` plus safe area. Bottom border: `border-line` hairline.

> [!NOTE]
> **Navigation Options Styling Exception:**
> React Navigation `screenOptions` (`tabBarStyle`, `headerStyle`) only accept plain JS style objects. Always read token values from `src/constants/theme.ts` (`COLORS.*`) rather than hard-coding bare hex literals.

## Core Components

### AppHeader (`src/components/common/AppHeader.tsx`)

- **Left**: Back button (optional), followed by "StAele." wordmark (Playfair Display / serif, 24-26px bold, `oxblood` / `primaryContainer`).
- **Right**: Search (`<Search>` 22px), NotificationBell, Cart (`<ShoppingBag>` 22px) with numeric count badge.
- **Cart Badge**: Compact badge with `danger` background and white bold monospace count.
- **Touch targets**: `44x44px` minimum (`min-h-11 min-w-11`).
- **Bottom border**: 1px hairline `border-line`.

### CategoryTabs / Filter Tabs (Underline Text Tabs)

> [!IMPORTANT]
> **Target Shape Update:**
> Replace filled pill chips for category navigation with **Underline Text Tabs**, mirroring FE's `CategoryTabs` pattern:
> - Layout: Horizontal scrollable row with `gap-6` or `gap-8`.
> - Active tab: `text-obsidian` (or `text-oxblood`), `font-semibold`, with an active bottom border/underline (`2px` solid oxblood or brass).
> - Inactive tab: `text-muted` (`#6B625A`), `font-normal`, no underline.
> - Accessibility: `accessibilityRole="tab"`, `accessibilityState={{ selected: isActive }}`.

### SegmentedControl (`src/components/ui/SegmentedControl.tsx`)

Used for mode switches (`Ảnh / Camera`, `1 Món / Set đồ`, `Ảnh của bạn / Người mẫu AI`):

- Track: `bg-surface-container` or `bg-ivory`, 2px or 4px radius, `p-1`.
- Active segment: `bg-primary-container` (`oxblood`) with light text, `rounded-[2px]`.
- Inactive segment: Transparent background with `text-muted`.
- Height: `min-h-11` (44px touch target).

### Search Bar

- Height: `44px`.
- Radius: `rounded-[2px]` (Atelier Paper target) or subtle 6px.
- Background: `ivory` (`#FDF8F6`) or `surfaceLow` with a 1px hairline border (`border-line`).
- Placeholder text: `text-muted` (`Tim sản phẩm, chất liệu, phong cách...`).
- Left icon: `<Search>` 20px in `muted`.

### Buttons

Aligned with Atelier Paper square/2px visual treatment:

- **Primary Button** (`src/components/ui/Button.tsx`):
  - Background: `bg-primary-container` (`oxblood` `#5D1C34`).
  - Text: `text-primary-foreground` (light/paper), `font-semibold`.
  - Height: `min-h-11` (44px) to `48-50px` for checkout actions (`size="lg"`).
  - Radius: `rounded-[2px]` (target) / `rounded-md` (legacy).
- **Secondary / Outline Button**:
  - Background: Transparent or `bg-ivory`.
  - Border: `1px solid` `border-line` (or `border-outline-variant`).
  - Text: `text-obsidian` / `text-on-surface`.
  - Radius: `rounded-[2px]`.
- **Ghost Button**:
  - Background: Transparent. Text: `text-obsidian` or `text-oxblood`.
- **Icon Button**:
  - Size: `44x44px` minimum. Radius: `rounded-full` (for circular icon buttons).
  - Always provide `accessibilityLabel`.

### Cards And Product Media

#### 1. ProductCard Contract (Aligned with `FashionAI_FE/docs/product-card-design.md`)

- **Aspect Ratio**: Strict `3:4` aspect ratio, `object-cover` and `object-top` for garment photography.
- **Card Framing**: Flat card on `paper` or `ivory` canvas. Corners are `rounded-[2px]` or `rounded-none`. **No decorative drop shadows.**
- **Product Badges** (top-left of image):
  - **Sale badge**: `oxblood` (`#5D1C34`) background, light text, displaying discount percentage (`-20%`).
  - **New badge (`Mới`)**: `sage` (`#899481`) background, `obsidian` text. Displayed when product is new and no sale badge takes priority.
  - Keep badges compact; do not stack redundant promotional text.
- **Quick Actions** (bottom of image, accessible on touch):
  - **Add to Cart**: `obsidian` background with light text and shopping bag icon (`Thêm giỏ`), oxblood pressed feedback.
  - **AI Try-On**: Light/ivory background with subtle hairline border and `<Sparkles>` icon, navigating to `/try-on?productId={id}`.
- **Product Information** (beneath image):
  - **Brand**: Small uppercase muted text (`tracking-widest`).
  - **Product Name**: `Playfair Display` (display/serif role), ~15-16px, maximum 2 lines (`numberOfLines={2}`).
  - **Pricing**: Current price in **Monospace** in `oxblood` (`#5D1C34`). Original price smaller, in `muted` (`#6B625A`), struck through.
  - **Rating**: Brass star icon with numerical average and review count when valid reviews exist. Never fabricate ratings.

#### 2. Visual Distinction: ProductCard vs. CollectionCard

- **ProductCard**: Full commerce card with 3:4 image, quick action bar, name, monospace price, rating, and swatch options.
- **CollectionCard / EditorialCard**: Distinct visual treatment featuring large editorial imagery (3:4 or 4:5), overlay headline/caption text, and a direct collection link. It **must not** include price tags, rating stars, or an add-to-cart button.

### Bottom Sheets

- Backdrop: Black `40-50%` (`rgba(17, 16, 15, 0.45)`).
- Panel Background: `ivory` (`#FDF8F6`) or `surface`.
- Top Corners: `rounded-t-2xl` (`16-20px`) for smooth touch dragging.
- Drag Handle: `40x4px`, centered, `taupe` / neutral muted.
- Header: Title in Playfair Display or bold Be Vietnam Pro, with a dedicated close icon button.
- Footer CTAs: Fixed above safe area, guaranteeing primary action visibility.

### Toasts & Reassurance Banners

- Position: Float above bottom action bar or near top of viewport.
- Background: `obsidian` (`#11100F`) with light/paper text, or `ivory` with a 1px hairline border and `oxblood` accent.
- Radius: `rounded-[2px]` or compact pill.
- Duration: `2500-3500ms`.

## Screen Patterns

### Home

- **Announce Strip**: Minimal text strip on ivory surface.
- **Collection Hero**: Full-bleed or inset editorial hero with title in Playfair Display, subtitle, and primary CTA.
- **Category Navigation**: Underline text tabs (`Tất cả`, `Áo sơ mi`, `Đầm công sở`, `Blazer`, `Quần âu`).
- **AI Try-On Promo**: Clean 3:4 side-by-side comparison preview with quick try-on action.
- **Featured Products**: 2-column grid utilizing the Atelier Paper `ProductCard`.
- **Editorial Lookbook**: Curated style guides with quiet obsidian/ivory framing.

### Product Discovery (Shop)

- Sticky header with search input.
- Horizontal category underline tabs.
- Filter & Sort toolbar showing product count in monospace (`128 sản phẩm`), filter button with active count badge, and sort selector.
- 2-column product grid: horizontal gap `12px`, vertical gap `20-24px`.
- Out-of-stock items: Dimmed opacity, badge `Tạm hết hàng`, action `Báo khi có hàng`.

### Product Detail

- **3:4 Image Gallery**: High-resolution gallery carousel with clean hairline indicators and zoom modal.
- **Product Header**: Brand category, product name in Playfair Display (22-26px), monospace price in oxblood, and discount tag.
- **Color Selection**: Square/2px color swatch cards with a 2px inset rule when selected.
- **Made-to-Measure Guidance**: Clarifying that garments are crafted to personal body measurements, with a direct link to the Measurement flow.
- **AI Try-On Banner**: Distinct module inviting the user to test the garment on their virtual model.
- **Accordions**: Clean hairline dividers separating Material, Fit, Tailoring, and Shipping policies.
- **Sticky Bottom Action Bar**: Quick `Thử đồ ảo` secondary button + `Thêm vào giỏ` primary button in oxblood.

### Photo Try-On (`TryOnScreen`)

- Header with `Ảnh / Camera` mode segmented control.
- Source Selector: `Ảnh của bạn` vs. `Người mẫu AI`.
- 3:4 Workspace Viewport: Displays user photo or AI generation with processing overlay when active.
- Comparison Toggle: Switch between `Ảnh gốc` and `Kết quả`.
- Selected Garment Row: Compact card previewing selected apparel.
- Privacy Reassurance: Explicit, honest copy (`Ảnh của bạn được bảo mật và chỉ sử dụng cho phiên thử đồ này`).

### Camera / Live Try-On (`TryOnLiveScreen`)

- Camera-dominant viewport utilizing `expo-camera`.
- Alignment guide displaying detected pose state (Ready / Aligning / Not detected).
- Garment selector sheet allowing real-time switching of tested items.
- Session indicator and clear privacy statement.

### AI Stylist (`StylistScreen`, `StylistResultScreen`)

- **Consultation Form**: Occasion, style preference, budget range, and season selectors.
- **Stylist Result**: Editorial lookbook hero card, itemized outfit breakdown with individual prices and set total in monospace, and batch actions (`Thử cả set`, `Lưu vào Tủ đồ`, `Thêm cả set vào giỏ`).
- **Rationale Accordion**: Stylist AI explanation tailored to the user's requested occasion.

### AI Chatbot (`ChatScreen`)

- Session drawer allowing past conversation retrieval.
- Message list with structured assistant advice and product suggestion cards.
- Sticky message composer with optional attached product thumbnail.

### Cart

- Item list with 3:4 thumbnail, product name, selected color, monospace unit price, quantity stepper, and remove/save actions.
- Touch targets for stepper buttons: minimum `44x44px`.
- Voucher input row with clean hairline outline.
- Order Summary: Subtotal, estimated shipping, discount, and grand total in oxblood monospace.
- Sticky checkout bar with total and `Tiến hành thanh toán` CTA.

### Checkout

- Breadcrumb indicator: `Giỏ hàng · Thanh toán · Hoàn tất`.
- Delivery address selection with GHN validation.
- Item summary list.
- Shipping carrier selector.
- Payment method selection: SePay QR bank transfer and COD.
- Price summary with exact verified backend totals.
- Sticky `Đặt hàng` primary button.

### Orders, Profile, Notifications & Subscription

- **Orders**: Status filter tabs, order cards with status badges (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`), order code in monospace.
- **Profile**: Account information, current AI quota tracker, saved addresses, measurement book, and security settings.
- **Notifications**: Chronological list of order, promotion, and system alerts with unread markers.
- **Subscription**: Plan tiers (Free, Member, VIP) highlighting monthly try-on quotas, styling consultations, and priority tailoring.

## Iconography

The app uses **`lucide-react-native`** as its single icon library:

| Intent | Lucide Icon |
| --- | --- |
| Home | `Home` |
| Shop / Products | `Package` |
| Try-On / Sparkles | `Sparkles` |
| AI Stylist / Wand | `WandSparkles` |
| Profile / Person | `User` |
| Search | `Search` |
| Cart / Bag | `ShoppingBag` |
| Back navigation | `ArrowLeft` |
| Notification bell | `Bell` |
| Close / Dismiss | `X` |
| Filter / Options | `SlidersHorizontal` |
| Navigation chevron | `ChevronRight` |
| History / Clock | `Clock` |
| Camera | `Camera` |

Rules:

- All icon-only buttons require an accessible `accessibilityLabel`.
- Minimum touch target: `44x44px` (`min-h-11 min-w-11`).
- Icon stroke width: `2.0-2.2` for active/primary states, `1.6-1.8` for inactive/secondary states.

## Motion And Interaction

- Fast, purposeful, and restrained transitions (150ms-250ms).
- Bottom sheets animate with ease-out curve (`250-300ms`).
- Press feedback: `active:opacity-80` or subtle scale `0.98` for primary buttons; no excessive bouncing.
- Never use hover-dependent states on mobile. All interactive elements must show clear touch states.

## Accessibility

- Minimum touch target size: `44x44px` for all interactive elements.
- Text contrast: All text against `paper` (`#EFE9E1`) or `ivory` (`#FDF8F6`) must maintain WCAG AA contrast (minimum 4.5:1). Small brass text must use `brassInk` (`#7C5722`).
- State communication: Never rely on color alone to communicate state. Pair status with text labels, badges, or icons.
- Screen reader labels: Provide Vietnamese descriptions (`accessibilityLabel`, `accessibilityHint`).

## Content Rules

Standard Vietnamese UI terms with proper diacritics:

- `Trang chủ`
- `Sản phẩm`
- `Thử đồ`
- `Tủ đồ`
- `Tài khoản`
- `Ảnh`
- `Camera`
- `AI Stylist`
- `Thêm vào giỏ`
- `Thêm cả set`
- `Thử món khác`
- `Bắt đầu thử đồ`
- `Bộ lọc tìm kiếm`
- `Sắp xếp theo`
- `Thanh toán`
- `Đặt hàng`
- `Mới`
- `Tạm hết hàng`

Content restrictions:

- **No em-dashes (—) in UI copy**: Use commas, colons, or clean line breaks instead.
- **No backend/technical terms**: Avoid `endpoint`, `payload`, `fallback`, `mock`, `500 internal server error`, or `Axios error`.
- **Honest AI claims**: Do not state "xử lý trên thiết bị" unless actual on-device ML is verified. Do not fabricate discounts, ratings, or fit scores.

## Implementation Checklist

For the upcoming Atelier Paper mobile implementation pass:

- [ ] Add Atelier Paper tokens (`paper`, `ivory`, `obsidian`, `brass`, `brassInk`, `taupe`, `sage`, `sageInk`, `muted`, `line`) to `src/constants/theme.ts`.
- [ ] Expose new tokens in `GluestackUIProvider` (`config.ts`) and `tailwind.config.js`.
- [ ] Update `Button.tsx` and `Input.tsx` default corner radius to `rounded-[2px]`.
- [ ] Align `ProductCard` with `docs/product-card-design.md`: 3:4 image, square/2px corners, top-left oxblood/sage badges, quick actions, Playfair title, monospace oxblood price.
- [ ] Replace category pill chips with underline text tabs.
- [ ] Ensure all product cards remove decorative drop shadows in favor of hairline borders (`border-line`).
- [ ] Verify TypeScript types and lint checks via `npm run typecheck` and `npm run lint`.
