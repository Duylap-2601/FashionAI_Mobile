# FashionAI Mobile — Expo SDK 57 / React Native 0.86.3

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start for Android (`expo run:android`) |
| `npm run ios` | Start for iOS |
| `npm run web` | Start for web |
| `npm run lint` | Run `expo lint` |
| `npm run typecheck` | Run `npx tsc --noEmit` |
| `npm test` | Run Jest (`jest-expo/node` preset) |
| `npm run test:watch` | Run Jest in watch mode |

## Architecture

- **Entrypoint**: `App.tsx` → React Navigation (Stack + Bottom Tabs), not Expo Router
- **Routes**: `src/navigation/` — `AuthStack`, `MainTabs`, `TryOnStack`, `ProfileStack`, `RootNavigator`
- **Source organization**: Feature-based under `src/features/<feature>/`; shared infrastructure stays in `src/navigation`, `src/components`, `src/api`, `src/constants`, `src/config`, `src/realtime`, `src/utils`, and truly shared `src/types`.
- **Styling**: **NativeWind (Tailwind classes) is mandatory for all new UI**, with gluestack components from `src/components/ui` where one exists. `StyleSheet.create` is legacy — see *Styling Rules* below.
- **State Management**: **Zustand** for client state (cart, filters), **TanStack React Query v5** for server state caching & mutations
- **Validation**: **Zod v4** schemas + **react-hook-form v7** for forms (auth, profile, measurements)
- **Icons**: **`lucide-react-native`** — used throughout navigation, headers, and feature screens (replaces Ionicons for new code; Ionicons still used in Input.tsx password toggle only)
- **Theme**: `src/constants/theme.ts` — light colors, spacing scale, font definitions (`FONT_FAMILY` = Be Vietnam Pro, embedded via the `expo-font` plugin in `app.json`; see `design-system.md` › Typography)
- **Design System**: `design-system.md` — mobile visual direction, burgundy/cream tokens, screen patterns, accessibility, and content rules
- **Hooks**: Feature hooks live in their owning feature; cross-feature hooks stay in `src/hooks/`
- **Path aliases**: `@/` → `src/*`, `@/assets/*` → `assets/*` (configured in `tsconfig.json`)

## Routes & Navigation Structure

| Navigator | File | Screens | Description |
|---|---|---|---|
| **AuthStack** | `src/navigation/auth-stack.tsx` | Login, Register, ForgotPassword, ResetPassword, VerifyEmail | Unauthenticated flow — email/password + Google OAuth |
| **TryOnStack** | `src/navigation/try-on-stack.tsx` | TryOnHome, TryOnHistory, TryOnDetail, TryOnLive | Nested stack inside TryOnTab |
| **ProfileStack** | `src/navigation/profile-stack.tsx` | ProfileHome, ChangePassword, Measurements, Addresses, Orders, TryOnHistory, TryOnDetail | Nested stack inside ProfileTab |
| **MainTabs** | `src/navigation/main-tabs.tsx` | HomeTab, ShopTab, TryOnTab, StylistTab, ProfileTab | Authenticated bottom tabs (5 tabs) |
| **RootNavigator** | `src/navigation/root-navigator.tsx` | Auth / Main + all modal/stack screens | Switches based on `isAuthenticated` from `AuthContext` |

### RootStack Modal/Full Screens (authenticated only)

| Screen | Route Name | Title |
|---|---|---|
| CartScreen | `Cart` | (modal presentation) |
| CheckoutScreen | `Checkout` | — |
| PaymentScreen | `Payment` | `Thanh toán SePay` |
| OrderDetailScreen | `OrderDetail` | `Chi tiết đơn hàng` |
| OrderSuccessScreen | `OrderSuccess` | — |
| ProductDetailScreen | `ProductDetail` | `Chi tiết sản phẩm` |
| SearchScreen | `Search` | — |
| CollectionDetailScreen | `CollectionDetail` | `Bộ sưu tập` |
| ReviewsScreen | `Reviews` | `Đánh giá sản phẩm` |
| MyReviewsScreen | `MyReviews` | `Đánh giá của tôi` |
| StylistScreen | `Stylist` | `AI Stylist` |
| StylistHistoryScreen | `StylistHistory` | `Lịch sử AI Stylist` |
| StylistResultScreen | `StylistResult` | `Kết quả tư vấn` |
| NotificationsScreen | `Notifications` | — |
| SubscriptionPlansScreen | `SubscriptionPlans` | — |
| SubscriptionHistoryScreen | `SubscriptionHistory` | — |
| ChatScreen | `Chat` | — |
| PolicyScreen | `Policy` | — |

## Mobile Design System

- Read `design-system.md` before implementing or refactoring mobile UI.
- The target visual direction is the burgundy/cream mobile system documented in `design-system.md`, based on the provided HTML references for Home, Product Discovery, Product Detail, Photo Try-On, Camera Try-On, AI Stylist, Cart, and Checkout.
- P11 Shop/Product Detail uses the deployed responsive website as its primary visual reference (see `P11_VISUAL_AUDIT.md`). Catalog color tokens are additive; use the opt-in `catalog` presentation on product cards/skeletons rather than changing their default collection presentation. Keep shared Input overrides optional so Auth and other existing callers retain their styling.
- P11 Home/Collections uses feature-local `CollectionCover` and `HomeFeaturedProducts` presentation. Keep carousel card width explicit (`w-collection-card`) rather than measuring horizontal list content; preserve slug navigation and existing query hooks. P11 audit/QA reports are local-only and must not be staged or pushed.
- Implement the design with gluestack components + NativeWind classes over React Native primitives (see *Styling Rules*); do not copy HTML, DOM scripts, CDN fonts, or Material Symbols web-font usage into the Expo app.
- Keep reusable primitives in `src/components/ui`; gluestack components should also be added there. Keep screen-specific composition in `src/features/<feature>/screens` until it is reused.
- NativeWind configuration lives in `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js` (`inlineRem: 16`, so `p-4` = 16px on device), and `nativewind-env.d.ts`. `gluestack-ui.config.json` points gluestack CLI/component output to `src/components/ui`.
- `App.tsx` is wrapped in `GluestackUIProvider` (`src/components/ui/gluestack-ui-provider/`). It turns the `COLORS` in `src/constants/theme.ts` into the CSS variables that `tailwind.config.js` color classes read, so a color is changed in `theme.ts` only. The className ↔ `theme.ts` token map is in `design-system.md` › *NativeWind Tokens*.
- `src/constants/theme.ts` is the single source for color values (burgundy/cream, already migrated) plus spacing, font sizes, radius, and shadows for the remaining `StyleSheet` code. Add new colors there and expose them in `gluestack-ui-provider/config.ts` + `tailwind.config.js`; never hard-code hex in screens.
- Use Vietnamese user-facing copy with proper diacritics. Avoid raw backend/technical terms such as `endpoint`, `payload`, `fallback`, `mock`, `Axios error`, or `500 internal server error` in UI.
- Mobile actions must not depend on hover behavior. Keep important actions visible and reachable with touch targets around `44x44` or larger.
- Preserve checkout/order pricing ownership: cart and checkout may display totals returned or verified by backend, but must not submit client-resolved shipping fees or discount amounts as the source of truth.
- FashionAI products are made-to-measure. Product selection is limited to `productId`, `color`, and `quantity`; body measurements belong exclusively to the measurement and order flow. Do not add standard sizing fields, selectors, filters, or variant identifiers to product flows.

### Styling Rules — NativeWind + gluestack (REQUIRED)

Order of preference for every piece of UI — always pick the highest option that fits:

| # | Use | When |
|---|---|---|
| 1 | A gluestack component already in `src/components/ui` | The primitive exists (Button, Card, Input, SegmentedControl, OtpInput, FeedbackModal, QuotaExhaustedModal, ...) |
| 2 | Add the gluestack component via its CLI, then use it | gluestack ships that primitive but the repo has not pulled it in yet |
| 3 | React Native primitive (`View`, `Text`, `Pressable`, ...) + NativeWind `className` | No gluestack equivalent, or a screen-specific composition |
| 4 | `StyleSheet.create` | Last resort only, for what NativeWind genuinely cannot express (e.g. imperative `Animated` style objects) — leave a short comment saying why |

Rules:
- **NEVER hand-roll a primitive that gluestack already provides.** Check `src/components/ui` first, then `npx gluestack-ui add <component>` (output path is already pointed at `src/components/ui` by `gluestack-ui.config.json`).
- **Legacy name clash**: `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx` collide case-insensitively (macOS) with gluestack's `button/`, `card/`, `input/` folders. Before running `npx gluestack-ui add button|card|input`, migrate the legacy file's callers and delete or rename it.
- **NEVER mix** `className` and a `style={styles.x}` object on the same element. Pick one per element; NativeWind for anything static.
- **No inline `style={{ ... }}`** for static values — use `className`. Inline `style` is only for computed/animated values.
- **Tokens, not raw values**: use Tailwind token classes (`bg-primary`, `px-4`, `rounded-xl`, `text-base`) defined in `tailwind.config.js`. Never hard-code hex colors or magic pixel numbers in `className` (no `bg-[#7B1E3A]`, no `mt-[13px]`) — add the token to `tailwind.config.js` / `src/constants/theme.ts` instead.
- **Exception — navigation config**: `tabBarStyle`, `headerStyle`, and similar React Navigation `screenOptions` only accept plain JS style objects (no `className`). In these configs, read the value from `src/constants/theme.ts` (`COLORS.*`) with a short inline comment referencing `design-system.md`. Do not hard-code bare hex literals that bypass the theme.
- **Variants** on shared components use `tva` from `@gluestack-ui/nativewind-utils`, not conditional string concatenation.
- **Dark mode / platform**: express with NativeWind modifiers (`dark:`, `ios:`, `android:`) instead of runtime branching where possible.
- **Legacy migration**: screens still on `StyleSheet.create` are legacy. When you touch one of those files for a real change, convert the parts you touch to NativeWind/gluestack; do not add new `StyleSheet.create` blocks to them. Do not open drive-by rewrites of untouched screens.
- Touch targets stay `>= 44x44` (`min-h-11 min-w-11`) regardless of styling approach.

### Shared UI Components (`src/components/ui`)

| Component | File | Status | Notes |
|---|---|---|---|
| `Button` | `Button.tsx` | ✅ NativeWind/tva | Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. |
| `Card` | `Card.tsx` | ✅ NativeWind/tva | Variants: `elevated`, `outlined`, `flat`. |
| `Input` | `Input.tsx` | ✅ NativeWind/tva | Label, error, helperText, leftIcon, rightIcon, password reveal. Uses `Ionicons` for eye toggle only. |
| `OtpInput` | `OtpInput.tsx` | ✅ | 4-digit OTP input for VerifyEmail. |
| `SegmentedControl` | `SegmentedControl.tsx` | ✅ NativeWind | Generic segmented control; track `bg-surface-container`, active `bg-primary-container`. |
| `FeedbackModal` | `FeedbackModal.tsx` | ✅ | Generic feedback/confirmation modal. |
| `QuotaExhaustedModal` | `QuotaExhaustedModal.tsx` | ✅ | Shown when AI quota is exhausted; links to SubscriptionPlans. |
| `GluestackUIProvider` | `gluestack-ui-provider/` | ✅ | Wraps app in `App.tsx`; exposes CSS vars to NativeWind. |

### Shared Common Components (`src/components/common`)

| Component | File | Notes |
|---|---|---|
| `AppHeader` | `AppHeader.tsx` | Shared top header: StAele. wordmark (Playfair Display/serif), Search, NotificationBell, Cart badge. Uses `lucide-react-native`. |
| `BackButton` | `BackButton.tsx` | Reusable back navigation button. |
| `EmptyState` | `EmptyState.tsx` | Empty list/data placeholder. |
| `ErrorView` | `ErrorView.tsx` | Error display with retry action. |
| `Loading` | `Loading.tsx` | Full-screen loading indicator. |

### AuthStack Screens
| Screen | File | Features |
|---|---|---|
| Login | `src/features/auth/screens/LoginScreen.tsx` | Email/password (zod + react-hook-form), Google OAuth (In-App Browser), navigation to Register/ForgotPassword |
| Register | `src/features/auth/screens/RegisterScreen.tsx` | Name, email, password, confirm password (zod + react-hook-form) |
| ForgotPassword | `src/features/auth/screens/ForgotPasswordScreen.tsx` | Email input (zod + react-hook-form), sends reset link |
| ResetPassword | `src/features/auth/screens/ResetPasswordScreen.tsx` | Token, new password + confirm |
| VerifyEmail | `src/features/auth/screens/VerifyEmailScreen.tsx` | 4-digit OTP input (`src/components/ui/OtpInput.tsx`), resend with 60s cooldown |
| ChangePassword | `src/features/auth/screens/ChangePasswordScreen.tsx` | Current + new password (zod + react-hook-form); lives in ProfileStack |

### Auth Feature Components
| Component | File | Notes |
|---|---|---|
| `OnboardingModal` | `src/features/auth/components/OnboardingModal.tsx` | First-login onboarding flow |

### MainTabs Screens

| Tab | Screen | File | Status |
|---|---|---|---|
| Home | HomeScreen | `src/features/home/screens/HomeScreen.tsx` | ✅ Done — Editorial layout with collection carousel, featured products, try-on banner |
| Shop | ShopScreen | `src/features/products/screens/ShopScreen.tsx` | ✅ Done — Product catalog, filters, sort |
| Try-On | TryOnStack → TryOnScreen | `src/features/try-on/screens/TryOnScreen.tsx` | ✅ Done — Photo try-on with SegmentedControl header |
| AI Stylist | StylistScreen | `src/features/stylist/screens/StylistScreen.tsx` | ✅ Done — AI Stylist form; result/history in RootStack |
| Profile | ProfileStack → ProfileScreen | `src/features/profile/screens/ProfileScreen.tsx` | ✅ Done — User info, quota, logout, navigation to sub-screens |

## Feature Modules

| Feature | Mobile Location | BE Reference | Status |
|---|---|---|---|
| **Auth** | `src/features/auth/` | `auth.controller.ts` | ✅ Complete |
| **Virtual Try-On (Photo)** | `src/features/try-on/` | `try-on.controller.ts` | ✅ Done — generate, history, detail, delete |
| **Virtual Try-On (Live)** | `src/features/try-on/` (live) | `try-on.controller.ts` (live) | ✅ Done — sessions API + `TryOnLiveScreen` |
| **AI Stylist** | `src/features/stylist/` | `stylist.controller.ts` | ✅ Done — analyze, history, result, delete |
| **AI Chatbot** | `src/features/chat/` | `chat.controller.ts` + `chat.gateway.ts` (WS) | ✅ Done — streaming via Socket.IO, session management, `FloatingChatBubble` |
| **Products & Catalog** | `src/features/products/` | `products.controller.ts` | ✅ Done — list, detail, search, filters |
| **Collections** | `src/features/collections/` | `collections.controller.ts` | ✅ Done — published list, collection detail, products |
| **Reviews** | `src/features/reviews/` | `reviews.controller.ts` | ✅ Done — list, stats, create, update, delete, my reviews, replies |
| **Cart** | `src/features/cart/` | — (Zustand) | ✅ Done — Zustand store + CartScreen |
| **Orders** | `src/features/orders/` | `orders.controller.ts` | ✅ Done — list, detail, success, cancel, confirm delivery, tracking, issue reporting |
| **Checkout** | `src/features/checkout/` | — | ✅ Done — CheckoutScreen + PaymentScreen |
| **Shipping (GHN)** | `src/features/shipping/` | `shipping.controller.ts` | ✅ Done — capabilities, address catalog (provinces/wards) |
| **Payments (SePay)** | `src/features/payments/` | `payments.controller.ts` | ✅ Done — checkout, status polling |
| **Subscriptions (VIP)** | `src/features/subscription/` | `payments.controller.ts` | ✅ Done — plans, history, cancel, resume |
| **Profile** | `src/features/profile/` | `users.controller.ts` | ✅ Done — view/edit profile, address book, PolicyScreen |
| **Measurements** | `src/features/measurements/` | `users.controller.ts` | ✅ Done — MeasurementsScreen, BodyDiagram, completeness hook |
| **Notifications** | `src/features/notifications/` | `notification.controller.ts` + `realtime.gateway.ts` | ✅ Done — list, unread count, NotificationBell, mark read |
| **Rack (Wardrobe)** | `src/features/rack/` | `rack.controller.ts` | ✅ Done — get, add, remove, clear; RackScreen |
| **Search** | `src/features/products/screens/SearchScreen.tsx` | `products.controller.ts` | ✅ Done — debounced search over product list |

## API Layer

- `src/api/` is reserved for shared HTTP infrastructure such as the Axios client and interceptors.
- Business API modules belong to their owning feature under `src/features/<feature>/api/`.

### HTTP Client (`src/api/client.ts`)
- **Axios instance** with baseURL from `ENV.API_URL`
- **Request interceptor**: Adds `Authorization: Bearer <accessToken>` + `X-Platform: mobile`
- **Response interceptor**: Auto-refresh on 401 `ACCESS_TOKEN_EXPIRED`, converts BE error envelope to `ApiError`
- Do NOT call `api` / `axios` directly from features — go through the HTTP wrapper below

### HTTP Wrapper (`src/api/http.ts`) — REQUIRED for all feature API calls

Thin generic layer over `api`. Every feature `*.api.ts` MUST use it instead of calling `api.get/post/...` + `unwrap()` by hand.

| Method | Returns | Use for |
|---|---|---|
| `http.get<T>(url, opts)` | `T` | Reads |
| `http.post/put/patch<T>(url, data, opts)` | `T` | Mutations |
| `http.delete<T = void>(url, opts)` | `T` | Deletes |
| `http.getPaged<T>(url, opts)` | `{ data: T, meta }` | Paginated lists (products, reviews, orders) |
| `http.upload<T>(url, formData, { onProgress })` | `T` | `multipart/form-data` (try-on, stylist, reviews) |
| `http.raw<T>(method, url, data, opts)` | `ApiSuccessResponse<T>` | Only when BE `code`/`message` is needed |
| `isCanceledError(error)` | `boolean` | Ignore aborted requests instead of showing an error |

Rules:
- **Envelope**: the wrapper calls `unwrap()` internally — never unwrap again in features.
- **Errors**: every failure is normalized to `ApiError` (`code`, `statusCode`, `details`); network → `NETWORK_ERROR`, timeout → `REQUEST_TIMEOUT`. Cancellation is the only exception — it is rethrown as-is so React Query and `isCanceledError()` see it unchanged.
- **Signal**: ALWAYS forward `signal` from React Query's `queryFn({ signal })` so requests are cancelled on unmount/filter change. `HttpOptions` extends `AxiosRequestConfig` (minus `url`/`method`/`data`).
- **Cancellation UI**: swallow cancelled requests with `isCanceledError(error)` — do not surface them to the user.
- **Pagination**: use `getPaged` instead of reading `meta` manually.
- Extend `src/api/http.ts` when a new transport concern appears (retry, abort helpers); do not fork a second client.
- **Reference implementation**: `src/features/auth/api/auth.api.ts` — copy its shape (trailing `opts?: HttpOptions` on every method) for new feature API files.
- **Tests**: `src/api/http.test.ts` and `src/features/auth/api/auth.api.test.ts` use `axios-mock-adapter` on the shared `api` instance; add cases there when extending the wrapper.

```ts
// Query with cancellation
const { data } = useQuery({
  queryKey: ['products', filters],
  queryFn: ({ signal }) =>
    http.getPaged<IProduct[]>(ENDPOINTS.PRODUCTS.LIST, { params: filters, signal }),
});

// Mutation
await http.post<AuthResponseData>(ENDPOINTS.AUTH.LOGIN, { email, password });

// Upload with progress
await http.upload<ITryOnResult>(ENDPOINTS.TRY_ON.GENERATE, formData, { signal, onProgress: setPercent });
```

### Endpoint Constants (`src/constants/endpoints.ts`)

Centralized endpoint definitions matching BE routes exactly.

| Group | Key examples |
|---|---|
| `AUTH` | LOGIN, REGISTER, REFRESH, EXCHANGE, LOGOUT, LOGOUT_ALL, GOOGLE, FORGOT_PASSWORD, RESET_PASSWORD, CHANGE_PASSWORD, VERIFY_EMAIL, RESEND_VERIFICATION |
| `USERS` | ME, MEASUREMENTS, MEASUREMENTS_COMPLETENESS, QUOTA, ADDRESSES |
| `COLLECTIONS` | PUBLISHED, DETAIL(slug), PRODUCTS(collectionId) |
| `PRODUCTS` | LIST, DETAIL(id), REVIEWS(id), REVIEW_STATS(id) |
| `REVIEWS` | CREATE, LIST, STATS, MY, UPDATE, DELETE, REPLIES |
| `TRY_ON` | GENERATE, HISTORY, DETAIL, DOWNLOAD, DELETE, DELETE_ALL |
| `LIVE_TRY_ON` | QUOTA, GARMENT_CHECK, CREATE_SESSION, GET_SESSION, PAUSE, RESUME, END |
| `CHAT` | SESSIONS, SESSION_DETAIL, SESSION_DELETE |
| `STYLIST` | ANALYZE, HISTORY, DETAIL, DELETE |
| `RACK` | BASE, ITEM, ALL |
| `SHIPPING` | CAPABILITIES, ADDRESS_CATALOG_PROVINCES, ADDRESS_CATALOG_WARDS |
| `ORDERS` | QUOTE, CREATE, LIST, DETAIL, TRACKING, CANCEL, CONFIRM_DELIVERY, UPDATE_MEASUREMENT, REPORT_ISSUE, ISSUES, ISSUE_DETAIL |
| `PAYMENTS` | CHECKOUT, STATUS, ORDERS, PLANS, SUBSCRIPTIONS_ME, SUBSCRIPTIONS_HISTORY, SUBSCRIPTIONS_CANCEL, SUBSCRIPTIONS_RESUME, SUBSCRIPTIONS_SCHEDULED_CANCEL |
| `NOTIFICATIONS` | LIST, UNREAD_COUNT, READ, READ_ALL |

### Auth API (`src/features/auth/api/auth.api.ts`)
| Method | Endpoint | Description |
|---|---|---|
| `login` | `POST /auth/login` | Email/password → tokens + user |
| `register` | `POST /auth/register` | Name, email, password → `{ email }` (no tokens; account unverified until OTP) |
| `exchangeOAuthCode` | `POST /auth/exchange` | Google auth code → tokens + user |
| `googleAuth` | `GET /auth/google?platform=mobile` | Opens In-App Browser |
| `logout` | `POST /auth/logout` | Revokes refresh token |
| `logoutAll` | `POST /auth/logout-all` | Revokes all sessions |
| `getCurrentUser` | `GET /users/me` | Validates token, returns user |
| `getUserQuota` | `GET /users/me/quota` | AI quota (TRY_ON, STYLIST, CHATBOT) |
| `forgotPassword` | `POST /auth/forgot-password` | Sends reset email |
| `resetPassword` | `POST /auth/reset-password` | Token + new password |
| `verifyEmail` | `POST /auth/verify-email` | Email + 4-digit OTP |
| `resendVerification` | `POST /auth/resend-verification` | Email → resends OTP (60s cooldown) |

### Profile API (`src/features/profile/api/users.api.ts`)

Handles user profile reads/writes and address book. Key DTOs: `UpdateProfileDto`, `UserQuotaResponse`, `IUserAddress`.

## Auth Flow (Backend Contract)

### Required Header: `X-Platform: mobile` (ALL auth requests)

### Email/Password
```
POST /auth/register { email, password, confirmPassword, name? }
→ { email }  // no tokens — account is unverified, must complete OTP flow before login
POST /auth/login    { email, password }
→ { user, accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }
  (403 Forbidden if the account has not completed email verification)
```

### Google OAuth (Authorization Code Flow)
1. Open `GET {API_URL}/auth/google?platform=mobile` via `expo-web-browser`
2. Redirect: `fashionai://auth?code=<authCode>` (deep link)
3. `POST /auth/exchange { code }` → tokens + user

### Token Refresh
```
POST /auth/refresh { refreshToken } → new { accessToken, refreshToken }
```
- Rotates on every call
- Interceptor handles 401 `ACCESS_TOKEN_EXPIRED` transparently

### Password Reset
```
POST /auth/forgot-password { email }
POST /auth/reset-password { token, newPassword }
```

### Email Verification (OTP)
```
POST /auth/verify-email { email, otp }         // otp: 4-digit numeric code
POST /auth/resend-verification { email }
```
- OTP is 4 digits, 5-minute TTL, max 5 wrong attempts before it's invalidated (must resend)
- Resend is rate-limited to once per 60 seconds per email
- Register automatically sends the first OTP; mobile navigates `Register` → `VerifyEmail` with the registered email

## Secure Storage (`src/features/auth/storage/secure-storage.ts`)
- **expo-secure-store** for accessToken, refreshToken, user data
- Keys: `fashionai_access_token`, `fashionai_refresh_token`, `fashionai_user_data`

## Auth Context (`src/features/auth/context/auth-context.tsx`)
Global provider with:
- `user`, `isLoading`, `isAuthenticated`
- `login`, `register`, `loginWithGoogle`, `logout`, `refreshUser`
- Bootstrap: loads tokens → validates with `/users/me` → caches user
- Listens to `onUnauthorized` from API client for forced logout

## Type Definitions

### `src/features/auth/types/auth.ts`
```typescript
User { id, email, name, avatarUrl, role, tier: 'FREE'|'MEMBER'|'VIP' }
AuthTokens { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }
AuthResponseData extends AuthTokens { user }
LoginDto { email, password }
RegisterDto { email, password, name }
```

### `src/features/profile/types/user.ts`
```typescript
ETier { FREE, MEMBER, VIP }
ERole { USER, ADMIN, STYLIST }
IUser { id, email, name, avatarUrl?, role?, tier?, createdAt?, updatedAt? }
IMeasurement { id?, userId?, height?, weight?, shoulder?, ... }
```

### `src/features/products/types/product.ts`
```typescript
GarmentCategory: 'UPPER' | 'LOWER' | 'FULL_BODY'
GarmentType: 'SHIRT' | 'VEST' | 'JACKET' | 'PANTS' | 'SKIRT' | 'DRESS' | 'JUMPSUIT'
IProduct { id, name, category, garmentType?, color?, colors?, price, originalPrice, stock, images, avgRating, reviewCount, ... }
IProductFilter { search?, category?, garmentType?, color?, minPrice?, maxPrice?, sort?, page?, limit? }
```

### `src/types/api.ts`
```typescript
ApiSuccessResponse<T> { success: true, code, message, data: T, meta? }
ApiError { success: false, statusCode, code, message, details? }
unwrap<T>(response) → T (throws ApiError on failure)
```

## Environment Config (`src/config/env.ts`)
```typescript
ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  OAUTH_REDIRECT_SCHEME: 'fashionai://auth',
}
```

The standard local backend configuration is `PORT=3001` with `API_PREFIX=api`,
so use `http://localhost:3001/api` on desktop development. On a physical phone,
`localhost` refers to the phone itself; set `EXPO_PUBLIC_API_URL` and
`EXPO_PUBLIC_SOCKET_URL` to the development machine's LAN IP instead. Android
Emulator may require `10.0.2.2` in place of `localhost`.

## Realtime (Socket.IO) — `src/realtime/socket.ts`
- **Namespace `/`**: Notifications, `token:expiring`, `token:expired`
- **Namespace `/chat`**: AI Chatbot streaming (`chat:send`, `chat:token`, `chat:done`, `chat:error`)
- **Transport**: `websocket` only (BE requirement)
- **Auth**: `auth: { token: accessToken }`
- **Reconnect**: `AppState` listener on app foreground
- Chat streaming is consumed by `src/features/chat/hooks/use-chat.ts`

## Image Upload
- Try-On and Stylist use `expo-image-picker` + `expo-image-manipulator` and multipart `FormData` where their backend endpoints support it.
- Reviews accept image URLs as `images?: string[]`; do not invent a Review multipart upload endpoint unless the backend contract changes.
- For supported multipart flows, the backend uses `multer` (memory) and Cloudinary with a 10MB limit.

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~57.0.26 | SDK / runtime |
| `react-native` | 0.86.3 | Core |
| `nativewind` | ^4.2.7 | Tailwind utility classes |
| `@gluestack-ui/nativewind-utils` | ^1.0.28 | `tva` variant utility |
| `lucide-react-native` | ^1.49.0 | Icon library |
| `@expo/vector-icons` | ^15.0.2 | Ionicons (legacy; `Input.tsx` eye toggle) |
| `@tanstack/react-query` | ^5.103.2 | Server state |
| `zustand` | ^5.0.15 | Client state (cart, filters) |
| `zod` | ^4.6.5 | Schema validation |
| `react-hook-form` | ^7.88.0 | Form management |
| `axios` | ^1.20.0 | HTTP client |
| `socket.io-client` | ^4.8.3 | Realtime / chat streaming |
| `expo-image` | ~57.0.5 | Performant image display |
| `expo-image-picker` | ~57.0.20 | Photo/camera input |
| `expo-image-manipulator` | ~57.0.20 | Image resize/compress before upload |
| `expo-camera` | ~57.0.6 | Live try-on camera |
| `expo-secure-store` | ~57.0.4 | Token storage |
| `expo-web-browser` | ~57.0.3 | Google OAuth |
| `react-native-reanimated` | 4.5.1 | Animations |
| `react-native-webview` | 13.16.1 | Payment WebView (SePay) |
| `react-native-qrcode-svg` | ^6.3.26 | QR code display (SePay) |
| `react-native-safe-area-context` | ~5.7.0 | Safe area insets |
| `tailwindcss` | ^3.4.19 | Dev dependency for NativeWind |

## File Structure

```
src/
├── api/
│   ├── client.ts                    # shared axios + interceptors only
│   └── http.ts                      # generic http wrapper (signal, paged, upload) — use this in features
├── features/
│   ├── auth/
│   │   ├── api/auth.api.ts
│   │   ├── components/OnboardingModal.tsx
│   │   ├── context/auth-context.tsx
│   │   ├── hooks/use-auth.ts
│   │   ├── schemas/auth.schema.ts
│   │   ├── screens/                 # Login, Register, ForgotPassword, ResetPassword, VerifyEmail, ChangePassword
│   │   ├── storage/secure-storage.ts
│   │   └── types/auth.ts
│   ├── cart/
│   │   ├── screens/CartScreen.tsx
│   │   └── store/                   # cart-store.ts, use-cart-store.ts
│   ├── chat/
│   │   ├── api/chat.api.ts
│   │   ├── components/              # ChatComposer, ChatMessage, FloatingChatBubble, FormattedAssistantText, QuickChips, SessionSheet
│   │   ├── hooks/                   # chat-keys.ts, use-chat.ts, use-chat-sessions.ts
│   │   ├── screens/ChatScreen.tsx
│   │   ├── types/chat.ts
│   │   └── utils/                   # chat-error.ts, chat-session-pages.ts
│   ├── checkout/
│   │   └── screens/                 # CheckoutScreen.tsx, PaymentScreen.tsx
│   ├── collections/
│   │   ├── api/                     # collections.api.ts, collection.keys.ts
│   │   ├── components/              # CollectionCard, CollectionCarousel, CollectionCover, CollectionDetailHeader, CollectionHeroCard, CollectionSkeleton
│   │   ├── hooks/                   # useCollection, useCollectionProducts, usePublishedCollections
│   │   ├── mappers/collection.mapper.ts
│   │   ├── screens/CollectionDetailScreen.tsx
│   │   └── types/collection.ts
│   ├── home/
│   │   ├── components/              # AiTryOnFeatureBanner, AnnouncementBar, EditorialLookbook, HomeFeaturedProducts, HomeHeroBanner, HomeProductSection, NewsletterBar, SaleBannerText
│   │   └── screens/HomeScreen.tsx
│   ├── measurements/
│   │   ├── api/measurements.api.ts
│   │   ├── components/BodyDiagram.tsx
│   │   ├── hooks/use-measurements-completeness.ts
│   │   ├── schemas/measurements.schema.ts
│   │   └── screens/MeasurementsScreen.tsx
│   ├── notifications/
│   │   ├── api/
│   │   ├── components/NotificationBell.tsx (+ others)
│   │   ├── hooks/
│   │   ├── screens/NotificationsScreen.tsx
│   │   └── types/notification.ts
│   ├── orders/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/                 # OrdersScreen, OrderDetailScreen, OrderSuccessScreen
│   │   └── types/order.ts
│   ├── payments/
│   │   └── api/payments.api.ts
│   ├── products/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── mappers/
│   │   ├── screens/                 # ShopScreen, ProductDetailScreen, SearchScreen
│   │   ├── store/                   # use-filter-store.ts, filter-store.ts
│   │   ├── types/product.ts
│   │   └── utils/
│   ├── profile/
│   │   ├── api/users.api.ts
│   │   ├── components/AddressForm.tsx
│   │   ├── hooks/use-address-book.ts
│   │   ├── screens/                 # ProfileScreen, AddressesScreen, PolicyScreen
│   │   └── types/user.ts
│   ├── rack/
│   │   ├── api/rack.api.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── mappers/rack.mapper.ts
│   │   ├── screens/RackScreen.tsx
│   │   └── types/rack.ts
│   ├── reviews/
│   │   ├── api/                     # reviews.api.ts, review.keys.ts
│   │   ├── components/              # RatingFilter, RatingStars, ReviewCard, ReviewEmptyState, ReviewForm, ReviewStatsCard
│   │   ├── hooks/                   # useMyReviews, useProductReviews, useReviewMutations
│   │   ├── schemas/review.schema.ts
│   │   ├── screens/                 # ReviewsScreen, MyReviewsScreen
│   │   └── types/review.ts
│   ├── shipping/
│   │   ├── api/shipping.api.ts
│   │   └── hooks/use-address-catalog.ts
│   ├── stylist/
│   │   ├── api/                     # stylist.api.ts, stylist.keys.ts, stylist.mapper.ts
│   │   ├── components/              # StylistHistoryCard, StylistProductPickerModal, StylistResultContent
│   │   ├── constants/stylist-options.ts
│   │   ├── hooks/useStylist.ts
│   │   ├── schemas/stylist.schema.ts
│   │   ├── screens/                 # StylistScreen, StylistHistoryScreen, StylistResultScreen
│   │   ├── types/stylist.ts
│   │   └── utils/stylist-image.ts
│   ├── subscription/
│   │   ├── api/subscriptions.api.ts
│   │   ├── constants/plans.ts
│   │   ├── hooks/use-subscription.ts
│   │   ├── screens/                 # SubscriptionPlansScreen, SubscriptionHistoryScreen
│   │   └── types/subscription.ts
│   └── try-on/
│       ├── api/                     # try-on.api.ts, live-try-on.api.ts
│       ├── components/              # ComparisonSlider, GarmentProductCard, LiveTryOnContent, PhotoTryOnContent, ProductPickerSheet, TryOnHeader, TryOnWorkspace
│       ├── hooks/                   # try-on-query-keys.ts, use-try-on-generate.ts, use-try-on-history.ts, use-try-on-delete.ts, use-live-try-on.ts
│       ├── schemas/try-on.schema.ts
│       ├── screens/                 # TryOnScreen, TryOnHistoryScreen, TryOnDetailScreen, TryOnLiveScreen
│       ├── types/                   # try-on.ts, live-try-on.ts, try-on-navigation.ts
│       └── utils/                   # idempotency-key.ts, image-asset.ts, try-on-error.ts
├── navigation/
│   ├── types.ts                     # AuthStackParamList, TryOnStackParamList, ProfileStackParamList, MainTabParamList, RootStackParamList
│   ├── auth-stack.tsx
│   ├── try-on-stack.tsx
│   ├── profile-stack.tsx
│   ├── main-tabs.tsx
│   ├── navigation-theme.ts
│   └── root-navigator.tsx
├── components/
│   ├── ui/                          # Button, Card, Input, OtpInput, SegmentedControl, FeedbackModal, QuotaExhaustedModal, gluestack-ui-provider/
│   └── common/                      # AppHeader, BackButton, EmptyState, ErrorView, Loading
├── hooks/
│   ├── use-auth.ts                  # compatibility re-export
│   └── use-color-scheme.ts
├── types/
│   └── api.ts
├── constants/
│   ├── endpoints.ts
│   ├── theme.ts
│   └── ai-actions.ts
├── config/
│   └── env.ts
├── realtime/
│   └── socket.ts
└── utils/
    ├── date.ts
    └── format.ts
```

## Sprint Checklist (Current State)

### Sprint 1 — Foundation ✅

| Task | Status | File |
|---|---|---|
| Auth Context + Secure Storage | ✅ Done | `src/features/auth/` |
| API Client + Interceptors | ✅ Done | `src/api/client.ts` |
| Auth API Layer | ✅ Done | `src/features/auth/api/auth.api.ts` |
| Login / Register / ForgotPassword / ResetPassword / VerifyEmail | ✅ Done | `src/features/auth/screens/` |
| AuthStack Navigation | ✅ Done | `src/navigation/auth-stack.tsx` |
| MainTabs Navigation | ✅ Done | `src/navigation/main-tabs.tsx` |
| RootNavigator (Auth ↔ Main) | ✅ Done | `src/navigation/root-navigator.tsx` |
| Home Screen | ✅ Done | `src/features/home/screens/HomeScreen.tsx` |
| Profile Screen | ✅ Done | `src/features/profile/screens/ProfileScreen.tsx` |
| App.tsx updated | ✅ Done | `App.tsx` |

### Sprint 2+ — Features ✅

| Task | Status | File |
|---|---|---|
| TryOnStack (Photo + Live + History + Detail) | ✅ Done | `src/navigation/try-on-stack.tsx`, `src/features/try-on/` |
| ProfileStack (ChangePassword, Measurements, Addresses, Orders, TryOnHistory) | ✅ Done | `src/navigation/profile-stack.tsx` |
| AI Stylist (form, result, history) | ✅ Done | `src/features/stylist/` |
| AI Chatbot (streaming, sessions, FloatingChatBubble) | ✅ Done | `src/features/chat/` |
| Products (ShopScreen, ProductDetail, Search, filters) | ✅ Done | `src/features/products/` |
| Collections (published list, CollectionDetail) | ✅ Done | `src/features/collections/` |
| Reviews (list, create, edit, delete, my reviews) | ✅ Done | `src/features/reviews/` |
| Cart (Zustand store + CartScreen) | ✅ Done | `src/features/cart/` |
| Checkout + Payment (SePay, QR) | ✅ Done | `src/features/checkout/`, `src/features/payments/` |
| Orders (list, detail, success, cancel, tracking, issues) | ✅ Done | `src/features/orders/` |
| Shipping (GHN capabilities, address catalog) | ✅ Done | `src/features/shipping/` |
| Subscriptions (plans, history, cancel, resume) | ✅ Done | `src/features/subscription/` |
| Measurements (body diagram, completeness) | ✅ Done | `src/features/measurements/` |
| Notifications (list, unread, bell) | ✅ Done | `src/features/notifications/` |
| Rack / Wardrobe | ✅ Done | `src/features/rack/` |
| AppHeader (wordmark, search, notification bell, cart badge) | ✅ Done | `src/components/common/AppHeader.tsx` |
| SegmentedControl shared primitive | ✅ Done | `src/components/ui/SegmentedControl.tsx` |
| FeedbackModal, QuotaExhaustedModal | ✅ Done | `src/components/ui/` |
| OnboardingModal | ✅ Done | `src/features/auth/components/OnboardingModal.tsx` |
| PolicyScreen | ✅ Done | `src/features/profile/screens/PolicyScreen.tsx` |
| Navigation theme (`navigation-theme.ts`) | ✅ Done | `src/navigation/navigation-theme.ts` |
| TypeScript passes | ✅ Maintained | `npx tsc --noEmit` |

## Naming Conventions

- **Files & folders**: `kebab-case` for non-component files (e.g. `use-auth.ts`, `auth-stack.tsx`); `PascalCase` for component files (screens, `components/ui`, `components/common`)
- **React components**: `PascalCase` export, `PascalCase` file (e.g. `LoginScreen.tsx`)
- **Hooks**: file `use-*.ts`, hook `useFoo`
- **Zustand stores**: file `use-*-store.ts`, hook `useFooStore`
- **Query keys**: co-located in `*.keys.ts` or `*-query-keys.ts` near the feature API
- **Mappers**: `*.mapper.ts` in `mappers/` sub-folder of the feature
- **Schemas**: `*.schema.ts` in `schemas/` sub-folder of the feature
