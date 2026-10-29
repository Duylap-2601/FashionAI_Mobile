# StAele. FashionAI Mobile - Design Brief

## Metadata

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Approved direction, implementation in progress |
| Scope | Expo React Native app: tab shell (Home, Shop, Try-On, AI Stylist, Profile), stack screens (Product Detail, Cart, Checkout, Orders, Auth, AI Chat), shared mobile components |
| Owner | StAie. mobile team |
| Related docs | `design/design-system.md`, `FashionAI_FE/DESIGN.md`, `FashionAI_FE/docs/design-system.md`, `FashionAI_FE/docs/product-card-design.md`, `AGENTS.md` |
| Last updated | 2026-10-30 |

## Design Read

A premium Vietnamese office-fashion shopping app for style-conscious professionals, with AI try-on and AI styling as its main differentiators. The mobile language is editorial luxury translated to touch: warm paper and ivory surfaces, obsidian ink, oxblood actions, brass hairlines, large serif product names, and photography that is allowed to breathe.

This is not a generic commerce app and not a cosmetics storefront. It should feel like a small printed lookbook carried in the hand. Chrome stays quiet so garments are the loudest element on screen.

## Brand Context

StAie. sells made-to-measure office wear and uses AI try-on as a practical purchase aid, not a gimmick. The mobile app must do four jobs in order:

1. Establish taste and trust on the Home screen and the first product view.
2. Make the current collection and catalog quick to browse with one thumb.
3. Remove fit anxiety by keeping AI try-on and AI Stylist one tap from any product.
4. Carry the user from discovery to cart, checkout, and order completion without dead ends.

Every control must navigate, filter, add to cart, start a real try-on, or submit a real request. Decorative controls are not allowed.

## Relationship To Frontend

> [!NOTE]
> **Alignment with `FashionAI_FE`**
>
> This brief mirrors the intent of `FashionAI_FE/DESIGN.md` (landing narrative) and `FashionAI_FE/docs/design-system.md` (tokens and component contracts). Both apps share the Atelier Paper - Saigon Editorial direction: paper `#EFE9E1`, ivory `#FDF8F6`, obsidian `#11100F`, oxblood `#5D1C34`, brass `#A67D44`, brass ink `#7C5722`, taupe `#CDBCAB`, sage `#899481`, sage ink `#59654F`, muted `#6B625A`, and a brass hairline.
>
> - **Shared intent**: palette, type hierarchy (Playfair Display for product names 16px and up, Be Vietnam Pro for UI/body, monospace for prices and numbers), and shape language (square or 2px corners, no card drop shadows, underlined text tabs instead of pills).
> - **Different surfaces**: FE is a desktop editorial storefront with a landing page, chapters, and 4-column grids. Mobile is a touch-first task app: bottom tabs, 2-column catalog, sticky action bars, bottom sheets, and 44px targets.
> - **Desktop-only specs do not apply**: FE `docs/table-design.md`, page chapters, `next/image`, hover reveal, and desktop breakpoints are web-only. Mobile uses focused lists, cards, sheets, and native navigation primitives.
> - **Token status differs**: `src/constants/theme.ts` already contains the Atelier Paper tokens and `tailwind.config.js` exposes them, so the mobile palette is implemented at the token layer. Component restyling is the remaining work.

## Audit Of Current Mobile UI

| Problem | Impact |
| --- | --- |
| The default commerce palette is burgundy/cream with many surface greys | Warm paper identity is diluted and surfaces look generic |
| `Button` and `Card` still use `rounded-md` / `rounded-lg` with soft shadows | Controls read as a generic app, not the editorial system |
| Some screens still use `StyleSheet.create` with legacy tokens | Visual drift between Home/Shop and older feature screens |
| Playfair Display and JetBrains Mono are not embedded | Serif product names fall back to system serif, prices to `Courier New` |
| Category filters still appear as pills on several screens | Inconsistent navigation language and weaker editorial feel |
| Product cards exist in two presentations (default and catalog) | Two visual contracts for the same commerce object |
| Long product copy can overflow without a 2-line clamp | Vietnamese diacritics and long names break card rhythm |

## Direction: Atelier Paper - Saigon Editorial

The app is a small printed issue that fits in a hand. Each screen is a page with one idea, framed by hairlines instead of cards with shadows. Photography is the plate. Type does the luxury work, so surfaces stay quiet.

### Six Principles

1. **Editorial before commerce.** Every section advances the shopping story, not filler.
2. **Paper and ink.** Warm paper is the default surface; obsidian is a deliberate chapter break.
3. **One accent.** Oxblood is the action color. Brass is a line and detail color, never a large fill.
4. **Motion is punctuation.** Reveals and crossfades clarify sequence. They do not perform.
5. **Every control is real.** No fake success states, fake discounts, fabricated ratings, or invented fit scores.
6. **One-hand commerce.** Primary actions sit within thumb reach and never depend on hover.

### Visual Dials

| Dial | Value | Consequence |
| --- | --- | --- |
| Design variance | 6 / 10 | Asymmetric editorial blocks and lookbook plates, but stable commerce layouts |
| Motion intensity | 4 / 10 | Fast screen transitions, restrained press states, no bounce |
| Visual density | 4 / 10 | Generous section padding, but catalog grids stay scannable |

## Palette

Source of truth: `src/constants/theme.ts` (`COLORS.*`), exposed through `GluestackUIProvider` and `tailwind.config.js`. See `design/design-system.md` for the full token map.

| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| `paper` | `#EFE9E1` | Primary surface | Screen canvas, header, tab bar |
| `ivory` | `#FDF8F6` | Raised surface | Cards, sheets, metadata panels, inputs |
| `obsidian` | `#11100F` | Ink and dark chapters | Text, lookbook panels, footer, camera stage |
| `oxblood` | `#5D1C34` | Action accent | Primary CTA, active state, current price |
| `brass` | `#A67D44` | Decorative accent | Hairlines, stars, dark-section labels |
| `brassInk` | `#7C5722` | Accessible brass text | Small labels on paper |
| `taupe` | `#CDBCAB` | Warm neutral | Dividers, placeholders, light swatches |
| `sage` | `#899481` | Support neutral | New badges, quiet success blocks |
| `sageInk` | `#59654F` | Accessible sage text | Small success text on paper |
| `muted` | `#6B625A` | Secondary text | Descriptions on paper |
| `line` | `rgba(166, 125, 68, 0.38)` | Hairline | Section rules, card borders. Matches the FE brass-alpha hairline; use `border-landing-line` without an opacity modifier. |

Rules:

- Oxblood fills are reserved for primary actions and selection states.
- Brass is never used for body-size text on paper. Use `brassInk`.
- Sage is never a primary CTA. It is a badge and quiet support color.
- Error, success, and warning states must pair color with text or an icon.
- Dark panels use paper text, not pure white, except the logo mark.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Playfair Display | Screen heroes, collection titles, product names at 16px and up |
| Body | Be Vietnam Pro | Navigation, paragraphs, forms, compact list rows |
| Mono | JetBrains Mono or tabular monospace | Prices, quantities, counts, order codes, step numbers |

Rules:

- Be Vietnam Pro 400/500/600/700 is embedded through the `expo-font` plugin in `app.json` and is the only fully operational family.
- Playfair Display is not yet embedded. Until it is, product names use `Platform.OS === 'ios' ? 'Playfair Display' : 'serif'` and Android renders a system serif. Embed the full family before declaring the type direction complete.
- JetBrains Mono is not installed. `font-mono` currently resolves to `Courier New`. Use `fontVariant: ['tabular-nums']` so price and count columns do not shift.
- Display line-height is `1.15-1.2`; body line-height is `1.4-1.6`, enough room for Vietnamese diacritics above and below the baseline.
- Product names on cards clamp to 2 lines (`numberOfLines={2}`). Dense rows (cart, checkout, search) use Be Vietnam Pro 500 at 14px.
- Eyebrows and labels are uppercase with `0.18em-0.24em` tracking.
- Do not use more than one serif family. Do not use em-dashes in UI copy.

### Role Scale

| Role | Size / Line height | Weight | Usage |
| --- | --- | --- | --- |
| Display | 32-34 / 40-42 | 700 | Hero headlines, lookbook titles |
| Headline LG | 24-26 / 32-34 | 700 | Feature headers, collection titles |
| Headline MD | 18-20 / 26-28 | 600 | Section titles, sheet headings |
| Headline SM | 16-17 / 22-24 | 600 | Product names, sub-headers |
| Body LG | 16 / 24 | 400 | Editorial leads |
| Body MD | 14 / 20 | 400-500 | Default body, forms, compact lists |
| Body SM | 12 / 16 | 400 | Helper text, timestamps |
| Label LG | 13 / 18 | 600 | Button labels, selected tabs |
| Label MD | 11 / 14 | 600 | Badges, metadata, tabs |
| Price LG | 18-20 / 22-24 | 700 | Checkout totals, detail price |
| Price SM | 13-14 / 16-18 | 600 | Card prices |

## Layout System

- Base spacing is 4px with an `inlineRem: 16` NativeWind scale: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`, `xxl 24`, `xxxl 32`, `giant 48`.
- Screen horizontal padding is `16px` (`lg`) on phones.
- Every interactive target is at least `44x44px` (`min-h-11 min-w-11`).
- Respect safe area insets on the header, tab bar, and sticky action bars.
- Corners are square or `2px` (`rounded-none` / `rounded-subtle`). `rounded-full` is reserved for status dots, avatars, and circular 44x44 icon buttons.
- Pills are not the default shape for cards or category controls.
- Cards use hairline borders, not decorative shadows.
- Bottom sheets use `16-20px` top corners so the drag gesture feels natural.
- Text and controls must not sit under the 78px tab bar; add bottom clearance on scroll views.

## Screen Narrative

| Shell | Screens | Surface | Purpose |
| --- | --- | --- | --- |
| Main tabs | Home, Shop, Try-On, AI Stylist, Profile | Paper / ivory | The five daily destinations |
| Stack | Product Detail, Collection Detail, Search, Reviews | Paper / ivory | Browse and evaluate a garment |
| Stack | Cart, Checkout, Payment, Order Success, Order Detail | Paper / ivory | Complete a purchase |
| Stack | Try-On history and detail, Stylist history and result, Chat | Paper / obsidian | Use AI features |
| Stack | Notifications, Subscription, Policy, Measurements, Addresses | Paper / ivory | Account and service management |
| Auth stack | Login, Register, Forgot/Reset password, Verify email | Paper / obsidian | Onboarding |

Removed from the mobile direction:

- Filled pill category chips as the default navigation.
- Card shadows as the primary separation device.
- Decorative gradients and glassmorphism on commerce cards.
- Fake ratings, discounts, delivery promises, and vendor names in AI copy.

## Screen Specifications

### Main Tab Shell

- `AppHeader`: `StAele.` wordmark left, Search, NotificationBell, Cart with a badge.
- Bottom tab bar: `78px` plus safe area, paper background, 1px top hairline, `lucide-react-native` icons.
- Active tab: oxblood icon and label with a 4x4 oxblood indicator dot.
- Inactive tab: muted icon and label.
- Tabs: Home (`Trang chủ`), Shop (`Sản phẩm`), Try-On (`Thử đồ`), AI Stylist (`AI Stylist`), Profile (`Tài khoản`).

### Home

- Announce strip: minimal text on ivory.
- Collection hero: full-bleed or inset editorial plate with a Playfair title, subtitle, and one CTA.
- Category navigation: horizontal underline text tabs (`Tất cả`, `Áo sơ mi`, `Đầm công sở`, `Blazer`, `Quần âu`).
- AI Try-On promo: clean 3:4 before/after preview with one try-on action.
- Featured products: 2-column grid using the Atelier Paper product card.
- Editorial lookbook: curated style guides on quiet obsidian or ivory framing.
- No fabricated season, sale claim, or collection when the API does not provide it.

### Shop

- Sticky compact header with search.
- Horizontal category underline tabs.
- Filter and sort toolbar with a monospace product count, active filter count, and sort selector.
- 2-column grid: horizontal gap `10px` (`gap-catalog-gap`), vertical gap `16px` (`h-lg`).
- Out-of-stock items are dimmed with a `Tạm hết hàng` label and a `Báo khi có hàng` action.
- Filter and sort open as bottom sheets with a footer showing `Xoá tất cả` and `Xem N sản phẩm`.

### Product Detail

- 3:4 gallery with clean hairline indicators and a zoom modal.
- Brand category, Playfair product name, monospace oxblood price, and an honest discount tag.
- Color selection as square swatch cards with a 2px inset rule when selected.
- Made-to-measure guidance that links to the measurement flow.
- AI Try-On banner as a distinct module.
- Accordions for material, fit, tailoring, and shipping, separated by hairlines.
- Sticky action bar: `Thử đồ ảo` secondary plus `Thêm vào giỏ` primary in oxblood.

### Photo Try-On

- Header with an `Ảnh / Camera` segmented control.
- Source selector: `Ảnh của bạn` versus `Người mẫu AI`.
- 3:4 workspace with a processing overlay when a request is active.
- Comparison toggle between `Ảnh gốc` and `Kết quả`.
- Compact selected garment row.
- Explicit privacy copy: `Ảnh của bạn được bảo mật và chỉ sử dụng cho phiên thử đồ này`.

### Live Try-On

- Camera-dominant viewport using `expo-camera`.
- Alignment guide with Ready / Aligning / Not detected states.
- Garment selector sheet for real-time switching.
- Session indicator and a clear privacy statement.
- The dock and overlays are obsidian with paper text and brass hairlines.

### AI Stylist

- Consultation form: occasion, style preference, budget, and season.
- Result: editorial lookbook hero, itemized outfit breakdown with individual prices and set total in monospace, and batch actions (`Thử cả set`, `Lưu vào Tủ đồ`, `Thêm cả set vào giỏ`).
- Rationale accordion explains the recommendation for the requested occasion.

### AI Chat

- Session drawer for past conversations.
- Message list with structured assistant advice and product suggestion cards.
- Sticky composer with an optional attached product thumbnail.
- Streaming state must show a clear progress affordance, not a fake typing result.

### Cart

- Item list with a 3:4 thumbnail, product name, selected color, monospace unit price, quantity stepper, and remove/save actions.
- Stepper buttons are at least 44x44.
- Voucher row with a hairline outline.
- Summary shows `Tạm tính`; shipping is quoted at checkout.
- Sticky checkout bar with the total and `Tiến hành thanh toán`.

### Checkout And Payment

- Breadcrumb: `Giỏ hàng · Thanh toán · Hoàn tất`.
- Delivery address with GHN validation.
- Item summary, shipping carrier selector, and payment method selection (SePay QR and COD as implemented).
- Price summary uses backend-verified totals only.
- Sticky `Đặt hàng` primary button.
- Payment result polls the real status; never assume success from a redirect.

### Orders, Profile, Notifications, Subscription

- Orders: status filter tabs, order cards with status labels and monospace order codes.
- Profile: account info, AI quota tracker, saved addresses, measurement book, and security settings.
- Notifications: chronological list with unread markers.
- Subscription: plan tiers (Free, Member, VIP) with monthly try-on quotas, styling consultations, and priority tailoring read from the API.

### Auth

- Login, Register, and Forgot Password share an obsidian editorial panel on larger screens and a paper form.
- Inputs are 48px tall, square 2px, on ivory with a hairline border and an oxblood focus ring.
- Primary submit is an oxblood fill with paper text. Google sign-in is a secondary outline button.
- Register shows a three-segment length meter and the two rules the backend enforces.
- Messages use one left-ruled ivory block: destructive for errors, brass for notices, sage ink for success.
- Forgot password does not claim an email was sent when the account may not exist.

## Components

### AppHeader

- Left: optional back button, then the `StAele.` wordmark in Playfair or serif, oxblood.
- Right: Search, NotificationBell, Cart with a numeric badge.
- Touch targets at least 44x44.
- Bottom border is a 1px brass hairline.

### Category Tabs

- Horizontal scrollable row with `gap-6` or `gap-8`.
- Active tab: obsidian or oxblood text, semibold, with a 2px bottom rule.
- Inactive tab: muted text, normal weight, no underline.
- Accessibility: `accessibilityRole="tab"` and `accessibilityState={{ selected }}`.

### SegmentedControl

- Track: `surfaceContainer` or ivory, 2-4px radius, `p-1`.
- Active segment: oxblood with paper text, `rounded-subtle`.
- Inactive segment: transparent with muted text.
- Height at least 44px.

### Search Bar

- Height 44px.
- Square 2px or subtle radius.
- Ivory or `surfaceLow` background with a 1px hairline border.
- Left search icon at 20px in muted.
- Placeholder: `Tìm sản phẩm, chất liệu, phong cách...`.

### Button

- Primary: oxblood background, paper text, semibold, 44-50px tall, 2px radius.
- Secondary / outline: transparent or ivory, 1px hairline border, obsidian text, 2px radius.
- Ghost: transparent, obsidian or oxblood text.
- Icon button: at least 44x44, circular only when it has no label.
- Disabled: 50% opacity, no press feedback.

### Input

- Ivory background, 1px hairline border, 2px radius, 48px tall.
- Label above, helper or error below.
- Focus ring is oxblood.
- Password reveal uses the existing icon affordance.

### Product Card

- Strict 3:4 aspect ratio, `object-cover` and `object-position: top`.
- Flat card on paper or ivory, square or 2px corners, no shadow.
- Badges top-left: sale in oxblood, new in sage with obsidian text.
- Product information: uppercase muted brand, Playfair name clamped to 2 lines, monospace oxblood price, struck-through original in muted, brass star only when real reviews exist.
- Quick actions must be touch-accessible and real.
- Do not fabricate ratings or discounts.

### Collection Card

- Editorial plate with large imagery and overlaid chapter, season, name, tagline, item count, and `Mở chương`.
- Selected state uses a brass or oxblood inset rule and `Đang xem`.
- Must not look like a product card: no price, no rating, no add-to-cart.

### Bottom Sheets

- Backdrop: `rgba(17, 16, 15, 0.45)`.
- Panel: ivory or paper with `16-20px` top corners.
- Drag handle: 40x4px, centered, taupe.
- Header in Playfair or Be Vietnam Pro 600 with a close button.
- Footer CTAs fixed above the safe area.

### Toasts

- Float above the sticky action bar or near the top of the viewport.
- Obsidian with paper text, or ivory with a hairline and an oxblood accent.
- 2500-3500ms, paired with text, never color alone.

## Motion And Interaction

- Transitions are fast and purposeful, `150-250ms`.
- Bottom sheets use an ease-out curve over `250-300ms`.
- Press feedback is `active:opacity-80` or a subtle `0.98` scale; no bouncing.
- Screen transitions use the native stack animation; do not stack custom transitions on top.
- No hover-dependent states. Every interactive element shows a clear touch state.
- Respect reduced motion: no auto-play, no reveal transforms, keep color and focus transitions.

## Accessibility

- Minimum touch target is 44x44 for every interactive element.
- Text on paper or ivory meets WCAG AA (4.5:1). Small brass text uses `brassInk`.
- State is never conveyed by color alone. Pair it with text, a badge, or an icon.
- Provide Vietnamese `accessibilityLabel` and `accessibilityHint` for icon-only controls.
- Tabs expose `accessibilityRole="tab"` and selected state.
- Images have meaningful Vietnamese alt text.
- Focus rings are oxblood on paper and brass on dark.

## Performance

- Use `expo-image` for remote product photography with `contentFit="cover"` and `contentPosition="top"`.
- Reserve aspect ratios before images load so grids do not shift.
- Lazy-load long lists with `FlatList` or `FlashList`; do not render the full catalog at once.
- Keep native animations on `react-native-reanimated`; avoid JS-driven loops.
- Avoid background video and heavy gradient layers on commerce screens.
- Keep sheet and modal mount cost low; do not render hidden sheets until opened.

## Asset Strategy

Real API data is the source of truth. Product, collection, and lookbook images come from the backend. Local media is fallback-only.

| Slot | Source |
| --- | --- |
| Home hero | First published collection cover, local editorial fallback |
| Collection card | `collection.coverImages[0]` |
| Product card and detail | `product.images` |
| Try-on preview | Selected product image |
| Lookbook | Collection lookbook or cover images |
| Placeholder | Neutral ivory block with `Chưa có ảnh` |

- Never fabricate a collection, season, count, or image when the API returns none.
- Keep fallback media centralized; do not inline asset paths in screens.
- Use `contentPosition="top"` so garments remain in frame on portrait sources.

## Copy Rules

- Vietnamese first with correct diacritics. Sentence case for body, uppercase for labels.
- No emoji in UI copy.
- No em-dashes. Use a period, comma, or colon.
- No backend or technical terms: `endpoint`, `payload`, `fallback`, `mock`, `Axios error`, `500 internal server error`.
- Honest AI copy: no vendor names, accuracy percentages, latency claims, fake result badges, or "on-device" claims unless verified.
- Use `Thử đồ AI`, not `Virtual Try-On`, in Vietnamese UI.
- Use `AI Stylist` as the product name.
- Prices use the existing formatted product values; no client-side authoritative totals.
- Products are made-to-measure. Selection is `productId`, `color`, and `quantity`; body measurements belong to the measurement and order flow.

## Decisions Log

| Decision | Reason |
| --- | --- |
| Docs first | The mobile app has many screens and a token migration in progress; implementation needs one source of truth |
| Share the FE palette, not the FE layout | Brand consistency without importing desktop patterns into touch UI |
| Paper and ivory surfaces | Warm editorial identity instead of generic commerce white |
| Oxblood is the only action accent | One clear action color across every flow |
| No card shadows | Hairlines and surface contrast keep the catalog calm |
| Underline text tabs | Clearer category navigation than pills and consistent with FE |
| 2-column catalog on phones | Product photography needs room; 3+ columns become cramped |
| Bottom sheets for filters and pickers | Native thumb reach and less navigation churn |
| Two card contracts | Collection cards browse a chapter; product cards buy a garment |
| Honest AI copy | Protects trust and avoids claims the backend cannot verify |
| Keep legacy tokens during migration | Avoids restyling unrelated screens in one risky pass |

## Implementation Status

| Area | Status | Notes |
| --- | --- | --- |
| Atelier Paper color tokens | Done | Present in `src/constants/theme.ts` and exposed in `tailwind.config.js` |
| `GluestackUIProvider` token map | Done | `--paper`, `--ivory`, `--obsidian`, `--oxblood`, `--brass`, `--sage`, and `--landing-*` aliases |
| Hairline token (`line`) | Done | FE brass alpha `rgba(166, 125, 68, 0.38)`, exposed as `border-landing-line` |
| Home and catalog presentation | Partial | Home components, `ProductCard` catalog, and `CollectionCard` already adopt paper, ivory, and oxblood |
| Shared `Button` / `Card` shape | Pending | Still `rounded-md` / `rounded-lg` with soft shadows |
| Category underline tabs | Pending | Several screens still use pills |
| Playfair Display embedding | Pending | iOS requests the family, Android falls back to serif |
| JetBrains Mono embedding | Pending | `font-mono` resolves to `Courier New` |
| Legacy `StyleSheet.create` screens | Pending | Convert only when a screen is touched for a real change |
| FE desktop specs | Not applicable | Tables, hover reveal, chapters, and `next/image` stay on web |

## Acceptance Criteria

- Every tab and stack screen uses paper or ivory as its base surface and obsidian as ink.
- Every primary action is oxblood, and no primary action uses sage or brass.
- Product cards show a 3:4 image, a 2-line Playfair name, a monospace oxblood price, and no fabricated rating.
- Category navigation uses underline text tabs, not pills.
- Cards are separated by hairlines and surface contrast, not decorative shadows.
- Bottom sheets have 16-20px top corners, a drag handle, and a fixed footer CTA.
- All interactive targets are at least 44x44.
- Text on paper or ivory passes WCAG AA; small brass text uses `brassInk`.
- AI copy contains no vendor names, fake metrics, or delivery promises.
- `npm run typecheck` and `npm run lint` pass after any UI change.

## Changelog

| Date | Change |
| --- | --- |
| 2026-10-30 | Initial mobile brief, aligned with `FashionAI_FE/DESIGN.md` and `FashionAI_FE/docs/design-system.md` |
