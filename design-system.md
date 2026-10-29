# FashionAI Mobile Design System

This document defines the mobile UI language for `FashionAI_Mobile`, based on the provided mobile HTML references for Home, Product Discovery, Product Detail, Photo Try-On, Camera Try-On, AI Stylist, Cart, and Checkout.

The app is Expo React Native. Implement screens with React Native primitives, NativeWind classes, gluestack-compatible shared components in `src/components/ui`, and tokens from `src/constants/theme.ts` / `tailwind.config.js`. Do not use DOM APIs, Material Symbols web fonts, or HTML patterns directly.

## Product Direction

FashionAI Mobile is a premium Vietnamese office-wear shopping app with AI try-on and styling as its main differentiators.

Core experience:

- Shop office wear quickly on mobile.
- Try before buying with photo/camera try-on.
- Ask AI Stylist for complete outfits by occasion, weather, style, and budget.
- Chat with AI Chatbot for product advice and style questions.
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

`theme.ts` also carries legacy aliases (`commerceSurface`, `surfaceMuted`, `textPrimary`, `textSecondary`, `textMuted`, `textInverse`, `border`, `borderDark`) still referenced by older StyleSheet code. New screens must not use these aliases — use the burgundy/cream tokens below.

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
| `colors.primarySoft` | `#FFD9E1` | Soft selected background and AI hint tint; also used as focused tab icon background. |
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
- The `AppHeader` wordmark uses Playfair Display/serif (iOS/Android system serif) for the "StAele." logotype — this is intentional and does not require a new font build.

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
- Keep headers short: `San pham`, `Chi tiet`, `Thanh toan`, `Bo loc tim kiem`.
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

Used for Home, Product Discovery, Try-On, AI Stylist, Profile tabs.

Pattern:

- Shared `AppHeader` rendered by `MainTabs` (`src/components/common/AppHeader.tsx`): StAele. wordmark, Search icon, NotificationBell, Cart bag with badge.
- Fixed bottom tab bar, `78px` height + safe area insets. Each tab: icon (38x38 pill, `primarySoft` when active), label (12.5px, `Be Vietnam Pro`, active dot indicator).
- Background `surface`.

Tab bar visual rules (implemented in `src/navigation/main-tabs.tsx`):

- Active icon: 38x38 rounded pill with `primarySoft` background + `primaryContainer` stroke, `strokeWidth 2.2`.
- Inactive icon: transparent background + `onSurfaceVariant` stroke, `strokeWidth 1.8`.
- Active label: `primaryContainer`, weight `700`.
- Inactive label: `onSurfaceVariant`, weight `600`.
- Active dot: 4x4 `primaryContainer` circle below label.
- **Icon library**: `lucide-react-native` (Home, Package, Sparkles, WandSparkles, User icons for tabs).

Bottom tabs:

| Tab | Route | Label | Icon |
| --- | --- | --- | --- |
| Home | `HomeTab` | `Home` | `<Home>` |
| Shop | `ShopTab` | `San Pham` | `<Package>` |
| Try-On | `TryOnTab` | `Try-On` | `<Sparkles>` |
| AI Stylist | `StylistTab` | `AI Stylist` | `<WandSparkles>` |
| Profile | `ProfileTab` | `Profile` | `<User>` |

### Stack Shell

Used for Cart, Checkout, Product Detail, and modal-like screens.

Pattern:

- Header with back button on the left, centered or left title, optional right action placeholder for balance.
- Max content width can be visually treated as `480px` reference, but React Native should rely on screen width and margins.
- Sticky bottom action bar for checkout and product actions.

## Navigation And Headers

Header patterns from references:

- Commerce header (`AppHeader`): StAele. wordmark left, Search + NotificationBell + Cart right.
- Try-On header (`TryOnHeader`): brand mark plus `Anh / Camera / Stylist` segmented control — implemented as `SegmentedControl` from `src/components/ui`.
- Checkout header: back button, centered `Thanh toan`, no extra actions.
- Product detail header: back, `Chi tiet san pham`, standard RN header.

Header rules:

- Header height: `52-56` plus safe area.
- Background: `surface` with subtle transparency/backdrop equivalent where possible. In React Native, use solid `surface` if blur is unavailable.
- Bottom border: `surfaceLine` or soft shadow, not both strongly.
- Icon-only actions need accessible labels.
- **Navigation config exception**: `tabBarStyle`, `headerStyle`, and similar React Navigation `screenOptions` only accept plain JS style objects (no `className`). In these configs, read values from `src/constants/theme.ts` (`COLORS.*`) and include a comment referencing `design-system.md Color System`. Do not use bare hex literals that bypass the theme.

## Core Components

### AppHeader (`src/components/common/AppHeader.tsx`)

Shared top-level header used by `MainTabs` and optionally individual screens via `onBack` prop.

Specs:

- Left: optional back button (ArrowLeft, `primaryContainer`), then StAele. wordmark (Playfair Display/serif, 26px bold, `primaryContainer`).
- Right: Search (`<Search>` 22px), NotificationBell (feature component), Cart (`<ShoppingBag>` 22px) with badge showing count.
- Badge: 20px min-width pill, `danger` background, `onPrimary` text, `Label MD`.
- Touch targets: `h-11 w-11` (44px) rounded full.
- Icon color: `onSurface`. Back arrow + wordmark: `primaryContainer`.
- Background: `surface` with `surfaceLine` bottom border.

### SegmentedControl (`src/components/ui/SegmentedControl.tsx`)

Generic segmented control used in TryOnHeader and other features.

Specs:

- Track: `bg-surface-container`, `rounded-lg`, `p-xs`.
- Active segment: `bg-primary-container`, `rounded-md`.
- Inactive segment: transparent.
- Label: `text-label-lg`. Active: `text-primary-foreground`. Inactive: `text-on-surface-variant`.
- Min height: `min-h-11` (44px touch target).

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

- `Tim san pham, phong cach, chat lieu...`
- `Tim san pham, chat lieu, phong cach...`

### Chips And Segmented Controls

Chips:

- Height: `32-36`.
- Horizontal padding: `12-14`.
- Radius: full.
- Selected: `primaryContainer` background with `onPrimary` text.
- Unselected: `surfaceLow` or outlined `outlineVariant`.

Segmented controls:

- Track background: `surfaceContainer`.
- Active segment: `primaryContainer` (default per `SegmentedControl` implementation).
- Height: `36-40` (min-h-11 for touch).
- Radius: `12`.
- Use for `Anh / Camera / Stylist`, `1 Mon / Set do`, `Anh cua ban / Nguoi mau AI`.

### Buttons

Primary button (from `src/components/ui/Button.tsx`):

- Background: `bg-primary-container` (variant `primary`).
- Text: `text-primary-foreground`.
- Height: `min-h-11` minimum; `48-50` for major actions with `size="lg"`.
- Radius: `rounded-md`.
- Weight: `font-bold`.

Secondary button:

- Background: `bg-secondary` (variant `secondary`).
- Border: none (use `outline` variant for bordered).
- Text: `text-primary-foreground`.
- Height: `44-48`.

Outline button:

- Border: `border border-outline-variant`.
- Text: `text-on-surface`.
- Height: `44-48`.

Icon button:

- Size: `36-44`.
- Radius: full.
- Transparent or soft surface background.
- Always provide accessibility label.

Danger button:

- Use `danger` variant sparingly for destructive confirmations.
- In lists, delete/remove can be an icon action with danger pressed state.

### Cards And Product Media

Product image ratio:

- Catalog/product card: `3:4`.
- Hero lookbook: `4:5`.
- Try-on viewport: `3:4`.
- Set/product row thumbnails: approximately `52x68`, `64x85`, or `88x116`.

Card rules:

- Product grid cards should feel light: no heavy container, image plus text below.
- Image corners: `12-18` depending prominence.
- Use overlays only for key states: `Ban chay`, `Moi`, `Tam het hang`, `Thu do`.
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

- `Da them vao gio hang`
- `Da ap dung 2 bo loc`
- `Da luu vao Tu do`
- `Da cap nhat phoi trang phuc AI`

## Screen Patterns

### Home

Required sections:

- `AppHeader` (shared).
- Greeting/search block.
- Editorial collection hero with image, gradient overlay, title, subtitle, CTA.
- Horizontal category cards.
- Try-before-buy AI promo (`AiTryOnFeatureBanner`).
- Personalized 2-column product grid (`HomeFeaturedProducts`).
- AI Stylist promo.
- New arrivals (`HomeProductSection`).
- Editorial lookbook (`EditorialLookbook`).

Feature components in `src/features/home/components/`:

| Component | Purpose |
| --- | --- |
| `AnnouncementBar` | Top announcement strip |
| `HomeHeroBanner` | Collection hero image with gradient |
| `AiTryOnFeatureBanner` | Try-on promo section |
| `HomeFeaturedProducts` | Personalized 2-column product grid |
| `HomeProductSection` | New arrivals / themed product section |
| `EditorialLookbook` | Editorial style guide content |
| `NewsletterBar` | Newsletter sign-up bar |
| `SaleBannerText` | Promotional sale text |

Rules:

- Home should feel editorial and scrollable, not dashboard-like.
- Use large imagery and simple cards.
- Keep text density low.

### Product Discovery

Required sections:

- `AppHeader` (shared via MainTabs).
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
- Show `Thu do` affordance on supported products without relying on hover.
- Out-of-stock cards can lower opacity and show `Tam het hang` plus `Bao khi co hang`.

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
- Sticky bottom bar with `Thu Do Ao` and `Them Vao Gio`.

Rules:

- Product detail is commerce-first; do not bury price, color, and action.
- AI fit confidence must not be fake if unavailable.
- Product data and checkout totals must come from backend or validated product state.

### Photo Try-On (`TryOnScreen`)

Required sections:

- `TryOnHeader` with `Anh / Camera` segmented control (navigates between TryOnHome and TryOnLive).
- Source toggle: `Anh cua ban` and `Nguoi mau AI`.
- Large `3:4` preview viewport (`TryOnWorkspace`).
- Processing overlay: spinner, `AI dang khop trang phuc...`, helper copy.
- Compare toggle (`ComparisonSlider`): `Anh goc` and `Ket qua`.
- Selected garment row (`GarmentProductCard`) and `1 Mon / Set do` control.
- Result CTA group: `Thu mon khac`, `Them vao gio`; before result, use one primary `Bat dau thu do`.
- Privacy reassurance text.

Rules:

- Never claim photos are processed locally unless the implementation is actually local.
- Use precise privacy copy such as `Anh cua ban chi dung de tao ket qua thu do va duoc bao mat`.
- Disable duplicate try-on requests while processing.

### Camera / Live Try-On (`TryOnLiveScreen`)

Required sections:

- Camera-dominant viewport (`expo-camera`) taking roughly half the screen height.
- Live status pill and camera controls.
- Body alignment guide with state: ready, aligning, not detected.
- Mode toggle: `1 Mon` and `Set do`.
- Selected garment/outfit row (`ProductPickerSheet`).
- Primary CTA: `Bat dau thu do`, loading state, active stop state.
- Session timer if real session limits exist.
- Privacy reassurance.

Rules:

- Camera UI must prioritize ergonomics and visibility over decoration.
- Alignment state must reflect actual detection state if integrated.
- Do not show fake live processing, timer, or detection if unavailable.
- Use `LiveTryOnContent` component for the live session UI.

### AI Stylist (`StylistScreen`)

Required sections:

- Header via RootStack (title `AI Stylist`).
- Assistant identity and welcome prompt.
- Form: occasion, style, budget, season + optional product picker (`StylistProductPickerModal`).
- Submit CTA.
- Result navigates to `StylistResult` screen.

`StylistResultScreen` required sections:

- `StylistResultContent` with lookbook hero card.
- Outfit product breakdown.
- Set total and actions: save, try set, add set.
- Rationale accordion.
- Follow-up navigation.

`StylistHistoryScreen` required sections:

- List of `StylistHistoryCard` items.
- Navigate to `StylistResult` on tap.

Rules:

- AI Stylist copy should sound like a helpful Vietnamese stylist.
- Outfit recommendations must clearly show product availability, color, price, and total.
- Do not invent product availability, savings, or fit metrics if the backend does not return them.

### AI Chatbot (`ChatScreen`)

Required sections:

- Header with session controls and `SessionSheet` (past sessions list).
- Scrollable message list: `ChatMessage` bubbles for user and assistant.
- `FormattedAssistantText` for streaming/formatted AI responses.
- `QuickChips` for suggested prompts.
- `ChatComposer` sticky at bottom (text input + send + optional product context).
- Streaming indicator while AI token stream is active.

Rules:

- Chat messages stream via Socket.IO `/chat` namespace (`chat:token` events).
- Product context can be pre-loaded from `RootStack Chat` params (`productId`).
- `FloatingChatBubble` (in `MainTabs`) gives quick access from any tab.
- Session list is paginated; use `use-chat-sessions.ts`.

### Cart

Required sections:

- Stack header with back action and item count.
- Product rows with image, name, color, price, quantity stepper, remove action, save action.
- Voucher/privilege row.
- Cross-sell carousel: `Hoan thien set do`.
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
- Breadcrumb/progress: `Gio hang · Thanh toan · Hoan tat`.
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

### Orders (`OrdersScreen`, `OrderDetailScreen`, `OrderSuccessScreen`)

Required sections:

- Orders list with status chips (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, etc.).
- Order detail: address, items, shipping, payment, tracking, issue reporting.
- Order success: order code, total, next actions.

### Profile Stack Screens

| Screen | File | Contents |
| --- | --- | --- |
| ProfileScreen | `src/features/profile/screens/ProfileScreen.tsx` | Avatar, user info, quota summary, menu links, logout |
| AddressesScreen | `src/features/profile/screens/AddressesScreen.tsx` | Address book with `AddressForm` |
| ChangePasswordScreen | `src/features/auth/screens/ChangePasswordScreen.tsx` | Current + new password |
| MeasurementsScreen | `src/features/measurements/screens/MeasurementsScreen.tsx` | Body measurements with `BodyDiagram` |
| PolicyScreen | `src/features/profile/screens/PolicyScreen.tsx` | Privacy, terms, return policy |

### Notifications (`NotificationsScreen`)

Required sections:

- List of notifications (ORDER_STATUS, PAYMENT, PROMOTION, SYSTEM, REVIEW types).
- Unread indicator.
- Mark all read action.

### Rack / Wardrobe (`RackScreen`)

Required sections:

- Grid of saved garment items.
- Remove and clear actions.
- Navigate to product detail on tap.

### Subscription (`SubscriptionPlansScreen`, `SubscriptionHistoryScreen`)

Required sections:

- Plan cards (FREE, MEMBER, VIP) with quota limits, price, CTA.
- Subscription history list with status.
- Cancel / resume actions.

## Iconography

The app uses **`lucide-react-native`** as the primary icon library for all new code. Match semantic intent from Lucide's icon set:

| Intent | Lucide icon |
| --- | --- |
| Home | `Home` |
| Shop / Products | `Package` |
| Try-On / Sparkles | `Sparkles` |
| AI Stylist / Wand | `WandSparkles` |
| Profile / Person | `User` |
| Search | `Search` |
| Cart / Bag | `ShoppingBag` |
| Back arrow | `ArrowLeft` |
| Notification bell | `Bell` |
| Close / X | `X` |
| Filter | `SlidersHorizontal` |
| Chevron right | `ChevronRight` |
| Clock / history | `Clock` |
| Camera | `Camera` |
| AI / sparkle | `Sparkles` |

`@expo/vector-icons` (Ionicons) is still present as a dependency but limited to the `Input.tsx` password eye toggle. New code must use `lucide-react-native`.

Rules:

- All icon-only controls need `accessibilityLabel`.
- Touch targets for icon buttons: `h-11 w-11` (44px) minimum.
- Prefer `size={22}` for header icons, `size={24-26}` for tab icons, `size={20}` for inline icons.
- `strokeWidth`: use `2.2` for active/primary states, `1.8` for inactive/secondary states.

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

- `Trang chu`
- `Kham pha` or `San pham`
- `Thu do`
- `Tu do`
- `Tai khoan`
- `Anh`
- `Camera`
- `Stylist`
- `AI Stylist`
- `Them vao gio`
- `Them ca set`
- `Thu mon khac`
- `Bat dau thu do`
- `Bo loc tim kiem`
- `Sap xep theo`
- `Thanh toan`
- `Dat hang`

Avoid:

- Backend terms such as `endpoint`, `payload`, `fallback`, `mock`, `public endpoint`.
- Raw technical errors like `Axios error` or `500 internal server error`.
- English labels for normal navigation, except established feature names such as `AI Stylist`.
- Claims such as `xu ly tren thiet bi` unless implementation proves local processing.

## Implementation Checklist

Before implementing a mobile screen:

- Update or confirm `src/constants/theme.ts` includes the burgundy/cream token set.
- Build with gluestack components from `src/components/ui` and React Native primitives styled with NativeWind classes (see *NativeWind Tokens*).
- Reuse `src/components/ui/Button`, `Input`, `Card`, and `SegmentedControl` when suitable.
- Use `expo-image` for product/media images.
- Use `lucide-react-native` for all icons; avoid adding new Ionicons usage.
- Ensure sticky bottom bars account for safe area.
- Ensure important mobile actions do not depend on hover.
- Keep backend-owned pricing authoritative in cart/checkout.
- Run `npm run typecheck` after code changes.
