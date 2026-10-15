# FashionAI Mobile Design System

This document defines the mobile UI language for `FashionAI_Mobile`, based on the provided mobile HTML references for Home, Product Discovery, Product Detail, Photo Try-On, Camera Try-On, AI Stylist, Cart, and Checkout.

The app is Expo React Native. Implement screens with React Native primitives, NativeWind classes, gluestack-compatible shared components in `src/components/ui`, and tokens from `src/constants/theme.ts` / `tailwind.config.js`. Do not use DOM APIs, Material Symbols web fonts, or HTML patterns directly.

## Product Direction

FashionAI Mobile is a premium Vietnamese office-wear shopping app with AI try-on and styling as its main differentiators.

Core experience:

- Shop office wear quickly on mobile.
- Try before buying with photo/camera try-on.
- Ask AI Stylist for complete outfits by occasion, weather, style, and budget.
- Move smoothly from discovery to product detail, cart, checkout, and order completion.

Brand personality:

- Minimal editorial retail.
- Warm, premium, quiet, and trustworthy.
- Product imagery first, interface chrome second.
- AI feels useful and refined, not playful or gimmicky.

## Visual References

The provided HTML references establish the target mobile direction:

| Reference | Design Intent |
| --- | --- |
| Home | Editorial commerce home with search, collection hero, categories, try-on promo, personalized products, AI Stylist, new arrivals, and style guide. |
| Product Discovery | Readable 2-column product grid, sticky compact header, search, horizontal category chips, filter/sort bottom sheets. |
| Product Detail | Large product gallery, clear color selection, made-to-measure guidance, try-on banner, accordions, stylist recommendations, sticky action bar. |
| Photo Try-On | 3:4 viewport, source toggle, compare original/result, selected garment row, result CTAs, secure photo reassurance. |
| Camera Try-On | Camera-dominant fitting room, alignment guide, session state, garment picker, prominent live try-on CTA. |
| AI Stylist | Chat-like outfit recommendation, lookbook card, set breakdown, follow-up prompt chips, sticky composer. |
| Cart | Compact product list, quantity stepper, save-for-later, voucher row, cross-sell carousel, sticky checkout bar. |
| Checkout | Focused single-column payment flow with address, products, shipping, payment, summary, sticky order CTA. |

## Current Implementation Constraint

P11 Shop and Product Detail follow the deployed mobile viewport audit in `P11_VISUAL_AUDIT.md`. They use white `surfaceLowest` canvases and additive catalog tokens: `catalogMuted` (#F9F7F5), `catalogMutedText` (#8B8880), `catalogLine` (#F0EEE9), and `catalogTailoring` (#FDFBF7). NativeWind exposes these as `catalog-muted`, `catalog-muted-text`, `catalog-line`, and `catalog-tailoring`. Catalog cards use 12px radius, detail galleries 16px, and listing gaps 10px (`SPACING.catalogGap` / `gap-catalog-gap`). Detail title and price roles are `text-product-title` (32/40) and `text-product-price` (22/28). Other screens retain the existing palette and roles below.

`src/constants/theme.ts` holds the burgundy/cream palette below and is the single source of color values. `GluestackUIProvider` exposes it to NativeWind as CSS variables; see *NativeWind Tokens* for the class names.

P11 Home/Collections adds `editorialBackground` (#0E161C) and `editorialShade` (#000000) for the deployed editorial surround and image scrim. Existing defaults remain intact. `h-collection-hero` is 440px; `w-collection-card` is a fixed 280px, with 3:4 cards and 16px gaps/corners. `CollectionCover` uses the existing SVG dependency for the image gradient. Home and Collection Detail opt into the existing catalog cards. Native member/quota and feature access remain below Home's collection/product presentation. No season, sale claim or collection is fabricated when it is absent from the API.

Rules:

- Use NativeWind, `StyleSheet.create`, and imported theme constants where each is appropriate.
- Keep new shared primitives and gluestack components in `src/components/ui` when reused across screens.
- Keep feature-specific UI inside the relevant `src/features/<feature>/screens` directory until it is reused across features.
- NativeWind is configured for utility-first mobile UI. Keep Tailwind tokens aligned with this document and avoid copying HTML classes blindly.
- Do not add a new component library without updating this file and `AGENTS.md`.

## Color System

Target palette from references:

| Token | Value | Usage |
| --- | --- | --- |
| `colors.surface` | `#FBF9F7` | App background, default screen canvas. |
| `colors.background` | `#FBF9F7` | Alias for screen background. |
| `colors.surfaceLowest` | `#FFFFFF` | Cards, sheets, active segmented controls. |
| `colors.surfaceLow` | `#F5F3F1` | Search fields, chips, soft panels. |
| `colors.surfaceContainer` | `#EFEDEC` | Neutral controls and inactive segmented tracks. |
| `colors.surfaceHigh` | `#EAE8E6` | Raised subtle panels and secondary chips. |
| `colors.surfaceHighest` | `#E4E2E0` | Stronger dividers and nested surfaces. |
| `colors.surfaceLine` | `#E5DFD5` | Borders, separators, checkout section lines. |
| `colors.outlineVariant` | `#D7C1C5` | Soft outlines for sheets, chips, cards. |
| `colors.outline` | `#857276` | Disabled/secondary outlines. |
| `colors.primary` | `#41051F` | Deep burgundy, pressed/strong brand surfaces. |
| `colors.primaryContainer` | `#5D1C34` | Main CTA, active tab, badges, selected states. |
| `colors.primarySoft` | `#FFD9E1` | Soft selected background and AI hint tint. |
| `colors.primarySoftStrong` | `#FFB1C6` | Stronger pink tint, rare highlight. |
| `colors.onPrimary` | `#FFFFFF` | Text/icons on burgundy. |
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

Color rules:

- `primaryContainer` is the core brand color for primary CTA, active states, selected chips, cart badges, and bottom-tab active color.
- `surface`/`surfaceLow` should carry most screens; avoid pure white as full-page background except cards/sheets.
- Use dark overlays on images only where readability requires it.
- AI accents use burgundy plus gold sparkle (`tertiaryFixed`), not a separate purple system.
- Error/success/warning colors must be paired with text or icon state, not used as the only signal.

## NativeWind Tokens

Use these classes in `className`. Every color class supports opacity (`bg-primary/90`).
gluestack components hard-code the shadcn-style names (`primary`, `muted`, `border`, ...), so those names win where they clash with the `theme.ts` names:

| `theme.ts` (`COLORS.*`) | NativeWind class | Notes |
| --- | --- | --- |
| `primaryContainer` | `bg-primary` / `bg-primary-container` | Brand CTA color. |
| `primary` | `bg-primary-strong` | Pressed/strong burgundy. `bg-primary` is **not** `#41051F`. |
| `primarySoft`, `primarySoftStrong` | `bg-primary-soft`, `bg-primary-soft-strong` | |
| `onPrimary` | `text-primary-foreground` / `text-on-primary` | |
| `surface` | `bg-background` / `bg-surface` | Screen canvas. |
| `surfaceLowest` | `bg-card` / `bg-surface-lowest` | Cards, sheets (`bg-popover` too). |
| `surfaceLow` | `bg-muted` / `bg-surface-low` | Search fields, chips. |
| `surfaceContainer` | `bg-accent` / `bg-surface-container` | Segmented tracks, ghost pressed state. |
| `surfaceHigh` | `bg-secondary` / `bg-surface-high` | gluestack secondary button background. |
| `surfaceHighest` | `bg-surface-highest` | |
| `surfaceLine` | `border-border` / `border-input` / `border-surface-line` | |
| `outline`, `outlineVariant` | `border-outline`, `border-outline-variant` | `ring` = `outline`. |
| `onSurface` | `text-foreground` / `text-on-surface` | |
| `onSurfaceStrong`, `onSurfaceVariant` | `text-on-surface-strong`, `text-on-surface-variant` | |
| `secondary` | `text-muted-foreground` | Secondary text / inactive tabs. `text-secondary` is **not** this color. |
| `inverseSurface`, `inverseOnSurface` | `bg-inverse-surface`, `text-inverse-on-surface` | Toasts. |
| `tertiary`, `tertiaryFixed` | `text-tertiary`, `text-tertiary-fixed` | |
| `danger` | `bg-destructive` / `text-danger` | |
| `success`, `warning` | `text-success`, `text-warning` | |

Typography roles map to `text-display`, `text-headline-lg|md|sm`, `text-body-lg|md|sm`, `text-label-lg|md`, `text-price-lg|sm` (size, line height and weight together).
Spacing uses the stock Tailwind scale (`inlineRem: 16`): `1`=4, `2`=8, `3`=12, `4`=16, `5`=20, `6`=24, `8`=32, `12`=48.
Radius: `rounded-sm|md|lg|xl|2xl|full` = 6/10/14/18/24/9999.

## Typography

Target font: `Be Vietnam Pro`.

Be Vietnam Pro `400`/`500`/`600`/`700` is embedded at build time by the `expo-font` plugin in `app.json` (from `@expo-google-fonts/be-vietnam-pro`), registered under the single family name `Be Vietnam Pro` on iOS and Android, so the weight picks the right file. Changing the font list requires a new native build.

- NativeWind: `font-sans` / `font-body` / `font-heading` plus a weight class (`font-semibold`) or a typography role (`text-headline-sm`). gluestack Text/Heading already apply `font-body` / `font-heading`.
- `StyleSheet` code: `fontFamily: FONT_FAMILY` from `src/constants/theme.ts`.
- React Native has no global default font: a bare `<Text>` without one of the above renders in the system font. Headers and tab labels get the font from `src/navigation/navigation-theme.ts`.
- Web is not covered (the font is native-only); it falls back to the system stack.

| Role | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display | `34` | `42` | `700` | Rare hero text. |
| Headline LG | `26` | `34` | `700` | Large feature title. |
| Headline MD | `20` | `28` | `600` | Section hero or sheet title. |
| Headline SM | `17` | `24` | `600` | Screen title, header title. |
| Body LG | `16` | `24` | `400` | Important paragraphs. |
| Body MD | `14` | `20` | `400` | Default readable text. |
| Body SM | `12` | `16` | `400` | Helper copy, metadata. |
| Label LG | `13` | `18` | `600` | Buttons, chips, selected labels. |
| Label MD | `11` | `14` | `600` | Badges, tab labels, uppercase metadata. |
| Price LG | `18` | `22` | `700` | Totals and key prices. |
| Price SM | `13` | `16` | `600` | Inline card prices. |

Typography rules:

- User-facing copy is Vietnamese with proper diacritics.
- Keep headers short: `Sản phẩm`, `Chi tiết`, `Thanh toán`, `Bộ lọc tìm kiếm`.
- Product/card titles use 1-2 lines max.
- Avoid all-caps for long Vietnamese text; reserve uppercase for small labels and metadata.
- Price text should use tabular alignment where available and stay visually dominant in commerce contexts.

## Spacing, Radius, Shadow

Spacing scale:

| Token | Value | Usage |
| --- | --- | --- |
| `spacing.xs` | `4` | Tight icon/text gap. |
| `spacing.sm` | `8` | Small internal gaps. |
| `spacing.md` | `12` | Card gaps, grid gutters. |
| `spacing.lg` | `16` | Default screen margin. |
| `spacing.xl` | `20` | Section padding. |
| `spacing.xxl` | `24` | Large vertical gaps. |
| `spacing.xxxl` | `32` | Major section separation. |
| `spacing.giant` | `48` | Rare large hero spacing. |

Radius scale:

| Token | Value | Usage |
| --- | --- | --- |
| `radius.sm` | `6` | Small badges. |
| `radius.md` | `10` | Inputs and compact controls. |
| `radius.lg` | `14` | Buttons and product rows. |
| `radius.xl` | `18` | Cards and main viewports. |
| `radius.xxl` | `24` | Bottom sheets and large panels. |
| `radius.full` | `9999` | Pills, avatars, round icon buttons. |

Shadow rules:

- Use shadows lightly; most depth should come from surface contrast and borders.
- Header and bottom bars may use very subtle shadows with opacity around `0.03-0.06`.
- Bottom sheets and modals may use stronger elevation.
- Product cards generally should not use heavy shadow; imagery should stay clean.

## Screen Shells

### Mobile Tab Shell

Used for Home, Product Discovery, Try-On, AI Stylist, Wardrobe/Profile tabs.

Pattern:

- Fixed/visible top header, `52-56px` content height plus safe area.
- Fixed bottom tab bar, `56-64px` height plus safe area.
- Content padding bottom large enough to avoid being covered by the bottom tab and sticky composer/action bars.
- Background `surface`.

Recommended bottom tabs:

| Tab | Label | Intent |
| --- | --- | --- |
| Home | `Trang chủ` | Editorial home and quick entry. |
| Shop | `Khám phá` or `Sản phẩm` | Catalog and search. |
| Try-On | `Thử đồ` | Photo/camera fitting room. |
| Wardrobe | `Tủ đồ` | Saved garments/outfits. |
| Profile | `Tài khoản` | Account, orders, measurements, subscription. |

Bottom tab rules:

- Active color: `primaryContainer`.
- Inactive color: `secondary` or `onSurfaceVariant`.
- Label size: `10-11`, medium/semibold depending on active state.
- Hit target should be at least `44x44`.

### Stack Shell

Used for Cart, Checkout, Product Detail, and modal-like screens.

Pattern:

- Header with back button on the left, centered or left title, optional right action placeholder for balance.
- Max content width can be visually treated as `480px` reference, but React Native should rely on screen width and margins.
- Sticky bottom action bar for checkout and product actions.

## Navigation And Headers

Header patterns from references:

- Commerce header: title left or centered, wishlist/cart/account actions on the right.
- Try-On header: brand mark plus 3-mode segmented control below: `Ảnh`, `Camera`, `Stylist`.
- Checkout header: back button, centered `Thanh toán`, no extra actions.
- Product detail header: back, `Chi tiết`, wishlist/cart/account actions.

Header rules:

- Header height: `52-56` plus safe area.
- Background: `surface` with subtle transparency/backdrop equivalent where possible. In React Native, use solid `surface` if blur is unavailable.
- Bottom border: `surfaceLine` or soft shadow, not both strongly.
- Icon-only actions need accessible labels.

## Core Components

### Search Bar

Use on Home and Product Discovery.

Specs:

- Height: `44`.
- Radius: `12` or full pill depending screen.
- Background: `surfaceLow`.
- Text size: `13-14`.
- Placeholder: `secondary` or muted neutral.
- Left search icon, optional right mic/camera action only if implemented.

Copy examples:

- `Tìm sản phẩm, phong cách, chất liệu...`
- `Tìm sản phẩm, chất liệu, phong cách...`

### Chips And Segmented Controls

Chips:

- Height: `32-36`.
- Horizontal padding: `12-14`.
- Radius: full.
- Selected: `primaryContainer` background with `onPrimary` text.
- Unselected: `surfaceLow` or outlined `outlineVariant`.

Segmented controls:

- Track background: `surfaceContainer`.
- Active segment: `surfaceLowest` or `primaryContainer` depending context.
- Height: `36-40`.
- Radius: `12`.
- Use for `Ảnh / Camera / Stylist`, `1 Món / Set đồ`, `Ảnh của bạn / Người mẫu AI`.

### Buttons

Primary button:

- Background: `primaryContainer`.
- Text: `onPrimary`.
- Height: `48-50` for major actions.
- Radius: `14`.
- Weight: `600`.

Secondary button:

- Background: `surfaceLowest` or transparent.
- Border: `surfaceLine` or `outlineVariant`.
- Text: `onSurface` or `primaryContainer`.
- Height: `44-48`.

Icon button:

- Size: `36-44`.
- Radius: full.
- Transparent or soft surface background.
- Always provide accessibility label.

Danger button:

- Use `danger` sparingly for destructive confirmations.
- In lists, delete/remove can be an icon action with danger hover/pressed state.

### Cards And Product Media

Product image ratio:

- Catalog/product card: `3:4`.
- Hero lookbook: `4:5`.
- Try-on viewport: `3:4`.
- Set/product row thumbnails: approximately `52x68`, `64x85`, or `88x116`.

Card rules:

- Product grid cards should feel light: no heavy container, image plus text below.
- Image corners: `12-18` depending prominence.
- Use overlays only for key states: `Bán chạy`, `Mới`, `Tạm hết hàng`, `Thử đồ`.
- Product title: `13-14`, medium, 1-2 lines.
- Product meta: `12`, secondary, 1 line.
- Price: `15-18`, semibold/bold, burgundy for emphasis.

### Bottom Sheets

Used for filters, sorting, garment picker, address selection, voucher selection, and photo source selection.

Specs:

- Backdrop: black `40-50%`.
- Panel background: `surface` or `surfaceLowest`.
- Top radius: `24-26`.
- Drag handle: `40x4-6`, neutral muted.
- Max height: `70-85%` depending content.
- Header: title `16-18` semibold, close icon button.
- Footer CTAs stay visible for filters and confirmations.

Rules:

- Bottom sheets should close via close button and backdrop.
- Do not hide primary actions below the fold.
- Keep options at least `44px` tall.

### Toasts

Specs:

- Position above bottom nav/action bar or near top for checkout/try-on feedback.
- Background: `inverseSurface`.
- Text: `inverseOnSurface`.
- Radius: full pill or `12`.
- Duration: around `2200-3500ms`.

Copy examples:

- `Đã thêm vào giỏ hàng`
- `Đã áp dụng 2 bộ lọc`
- `Đã lưu vào Tủ đồ`
- `Đã cập nhật phối trang phục AI`

## Screen Patterns

### Home

Required sections:

- Compact header with FashionAI wordmark and commerce actions.
- Greeting/search block.
- Editorial collection hero with image, gradient overlay, title, subtitle, CTA.
- Horizontal category cards.
- Try-before-buy AI promo.
- Personalized 2-column product grid.
- AI Stylist promo.
- New arrivals.
- Style guide/editorial content.

Rules:

- Home should feel editorial and scrollable, not dashboard-like.
- Use large imagery and simple cards.
- Keep text density low.

### Product Discovery

Required sections:

- Sticky compact header with title `Sản phẩm` and actions.
- Search bar.
- Horizontal category chips.
- Toolbar with product count, filter button with badge, sort button.
- 2-column product grid.
- Filter bottom sheet.
- Sort bottom sheet.

Product card rules:

- Two columns on phone.
- Horizontal gap around `12`; vertical gap around `24`.
- Image ratio `3:4`.
- Show `Thử đồ` affordance on supported products without relying on hover.
- Out-of-stock cards can lower opacity and show `Tạm hết hàng` plus `Báo khi có hàng`.

### Product Detail

Required sections:

- Product gallery carousel, ratio `3:4`.
- Floating gallery dots and zoom action.
- Product code badge, name, current/original price, discount badge.
- Color selection.
- Made-to-measure guidance belongs to the customer measurement and order flow, never the product selection flow.
- Shipping/inventory utility row.
- AI Try-On banner.
- Accordions for detail/material/shipping.
- Stylist recommendation carousel.
- Sticky bottom bar with `Thử Đồ Ảo` and `Thêm Vào Giỏ`.

Rules:

- Product detail is commerce-first; do not bury price, color, and action.
- AI fit confidence must not be fake if unavailable.
- Product data and checkout totals must come from backend or validated product state.

### Photo Try-On

Required sections:

- Two-level try-on header with brand/actions and `Ảnh / Camera / Stylist` segmented nav.
- Source toggle: `Ảnh của bạn` and `Người mẫu AI`.
- Large `3:4` preview viewport.
- Processing overlay: spinner, `AI đang khớp trang phục...`, helper copy.
- Compare toggle: `Ảnh gốc` and `Kết quả`.
- Selected garment row and `1 Món / Set đồ` control.
- Result CTA group: `Thử món khác`, `Thêm vào giỏ`; before result, use one primary `Bắt đầu thử đồ`.
- Privacy reassurance text.

Rules:

- Never claim photos are processed locally unless the implementation is actually local.
- Use precise privacy copy such as `Ảnh của bạn chỉ dùng để tạo kết quả thử đồ và được bảo mật`.
- Disable duplicate try-on requests while processing.

### Camera Try-On

Required sections:

- Camera-dominant viewport taking roughly half the screen height.
- Live status pill and camera controls.
- Body alignment guide with state: ready, aligning, not detected.
- Mode toggle: `1 Món` and `Set đồ`.
- Selected garment/outfit row.
- Primary CTA: `Bắt đầu thử đồ`, loading state, active stop state.
- Session timer if real session limits exist.
- Privacy reassurance.

Rules:

- Camera UI must prioritize ergonomics and visibility over decoration.
- Alignment state must reflect actual detection state if integrated.
- Do not show fake live processing, timer, or detection if unavailable.

### AI Stylist

Required sections:

- Header and segmented nav shared with Try-On.
- Assistant identity and welcome prompt.
- Quick occasion prompt chips.
- User message bubble.
- AI response with explanation.
- Lookbook hero card.
- Outfit product breakdown.
- Set total and actions: save, try set, add set.
- Rationale accordion.
- Follow-up chips.
- Sticky composer with attach menu.

Rules:

- AI Stylist copy should sound like a helpful Vietnamese stylist.
- Outfit recommendations must clearly show product availability, color, price, and total.
- Do not invent product availability, savings, or fit metrics if the backend does not return them.

### Cart

Required sections:

- Stack header with back action and item count.
- Product rows with image, name, color, price, quantity stepper, remove action, save action.
- Voucher/privilege row.
- Cross-sell carousel: `Hoàn thiện set đồ`.
- Order summary.
- Sticky checkout bar.
- Empty state.

Rules:

- Quantity controls require minimum `44px` touch handling, even if visual controls are smaller.
- Cart summary is display-only; checkout/order pricing remains backend-owned.
- If undo is offered for remove, it must restore exact item state.

### Checkout

Required sections:

- Focused stack header.
- Breadcrumb/progress: `Giỏ hàng · Thanh toán · Hoàn tất`.
- Delivery address section.
- Product summary section.
- Shipping method section.
- Payment methods section: SePay QR and COD where supported.
- Price summary.
- Sticky order CTA.
- Address and voucher bottom sheets.

Rules:

- Checkout must send cart items, structured GHN address fields, coupon code, and optional total for backend verification.
- Do not submit frontend-resolved `shippingFee` or `discountAmount` as source of truth.
- Payment security copy must be accurate to the actual payment flow.

## Iconography

The HTML references use Material Symbols. React Native cannot use those web fonts directly unless a native icon strategy is added.

Guidance:

- Prefer a single native icon system if icons are introduced later.
- Match semantic intent rather than exact Material glyphs.
- Common icon meanings: search, favorite, shopping bag, person, grid, home, checkroom/wardrobe, auto-awesome/sparkles, tune/filter, close, chevron, camera, lock.
- Until an icon library exists, keep icon-like UI minimal and avoid inconsistent emoji usage except where intentionally approved.

## Motion And Interaction

Motion principles:

- Fast and subtle.
- Directional for sheets and modals.
- No looping decorative motion except active camera/live indicators or loading spinners.

Recommended timings:

- Bottom sheet open/close: `250-300ms`.
- Toast in/out: `200-300ms`.
- Press scale: `0.98-0.99` for major buttons, `0.95` for icon/chip feedback.
- Product image hover from HTML should become press/transition feedback on mobile, not hover-only behavior.

## Accessibility

Required:

- All icon-only controls need `accessibilityLabel`.
- Touch targets should be at least `44x44` where possible.
- Text contrast must remain readable on image overlays.
- State must not rely only on color; pair with text, icon, or selected indicator.
- Bottom sheets should trap focus conceptually through navigation order and close predictably.
- Screen reader labels should use Vietnamese user-facing wording.

## Content Rules

Use these labels consistently:

- `Trang chủ`
- `Khám phá` or `Sản phẩm`
- `Thử đồ`
- `Tủ đồ`
- `Tài khoản`
- `Ảnh`
- `Camera`
- `Stylist`
- `AI Stylist`
- `Thêm vào giỏ`
- `Thêm cả set`
- `Thử món khác`
- `Bắt đầu thử đồ`
- `Bộ lọc tìm kiếm`
- `Sắp xếp theo`
- `Thanh toán`
- `Đặt hàng`

Avoid:

- Backend terms such as `endpoint`, `payload`, `fallback`, `mock`, `public endpoint`.
- Raw technical errors like `Axios error` or `500 internal server error`.
- English labels for normal navigation, except established feature names such as `AI Stylist`.
- Claims such as `xử lý trên thiết bị` unless implementation proves local processing.

## Implementation Checklist

Before implementing a mobile screen:

- Update or confirm `src/constants/theme.ts` includes the burgundy/cream token set.
- Build with gluestack components from `src/components/ui` and React Native primitives styled with NativeWind classes (see *NativeWind Tokens*).
- Reuse `src/components/ui/Button`, `Input`, and `Card` when suitable until they are replaced by gluestack versions.
- Use `expo-image` or React Native image primitives consistently for product/media images.
- Ensure sticky bottom bars account for safe area.
- Ensure important mobile actions do not depend on hover.
- Keep backend-owned pricing authoritative in cart/checkout.
- Run `npm run typecheck` after code changes.
