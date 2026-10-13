# FashionAI Mobile — Expo SDK 57 / React Native 0.86.3

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start for Android |
| `npm run ios` | Start for iOS |
| `npm run web` | Start for web |
| `npm run lint` | Run `expo lint` |
| `npm run typecheck` | Run `npx tsc --noEmit` |
| `npm test` | Run Jest (`jest-expo/node` preset) |
| `npm run test:watch` | Run Jest in watch mode |

## Architecture

- **Entrypoint**: `App.tsx` → React Navigation (Stack + Bottom Tabs), not Expo Router
- **Routes**: `src/navigation/` — `AuthStack`, `MainTabs`, `RootNavigator`
- **Source organization**: Feature-based under `src/features/<feature>/`; shared infrastructure stays in `src/navigation`, `src/components`, `src/api`, `src/constants`, `src/config`, `src/realtime`, `src/utils`, and truly shared `src/types`.
- **Styling**: **NativeWind (Tailwind classes) is mandatory for all new UI**, with gluestack components from `src/components/ui` where one exists. `StyleSheet.create` is legacy — see *Styling Rules* below.
- **State Management**: **Zustand** for client state (cart, filters), **TanStack React Query v5** for server state caching & mutations
- **Validation**: **Zod v4** schemas + **react-hook-form v7** for forms (auth, profile, measurements)
- **Theme**: `src/constants/theme.ts` — light colors, spacing scale, font definitions (`FONT_FAMILY` = Be Vietnam Pro, embedded via the `expo-font` plugin in `app.json`; see `design-system.md` › Typography)
- **Design System**: `design-system.md` — mobile visual direction, burgundy/cream tokens, screen patterns, accessibility, and content rules
- **Hooks**: Feature hooks live in their owning feature; cross-feature hooks stay in `src/hooks/`
- **Path aliases**: `@/` → `src/*`, `@/assets/*` → `assets/*` (configured in `tsconfig.json`)

## Routes & Navigation Structure

| Navigator | Screens | Description |
|---|---|---|
| **AuthStack** | Login, Register, ForgotPassword, ResetPassword | Unauthenticated flow — email/password + Google OAuth |
| **MainTabs** | HomeTab, TryOnTab, ShopTab, StylistTab, ProfileTab | Authenticated bottom tabs (5 tabs) |
| **RootNavigator** | Auth / Main | Switches based on `isAuthenticated` from `AuthContext` |

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
| 1 | A gluestack component already in `src/components/ui` | The primitive exists (Button, Input, Card, Modal, Select, Toast, ...) |
| 2 | Add the gluestack component via its CLI, then use it | gluestack ships that primitive but the repo has not pulled it in yet |
| 3 | React Native primitive (`View`, `Text`, `Pressable`, ...) + NativeWind `className` | No gluestack equivalent, or a screen-specific composition |
| 4 | `StyleSheet.create` | Last resort only, for what NativeWind genuinely cannot express (e.g. imperative `Animated` style objects) — leave a short comment saying why |

Rules:
- **NEVER hand-roll a primitive that gluestack already provides.** Check `src/components/ui` first, then `npx gluestack-ui add <component>` (output path is already pointed at `src/components/ui` by `gluestack-ui.config.json`).
- **Legacy name clash**: `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx` collide case-insensitively (macOS) with gluestack's `button/`, `card/`, `input/` folders. Before running `npx gluestack-ui add button|card|input`, migrate the legacy file's callers and delete or rename it.
- **NEVER mix** `className` and a `style={styles.x}` object on the same element. Pick one per element; NativeWind for anything static.
- **No inline `style={{ ... }}`** for static values — use `className`. Inline `style` is only for computed/animated values.
- **Tokens, not raw values**: use Tailwind token classes (`bg-primary`, `px-4`, `rounded-xl`, `text-base`) defined in `tailwind.config.js`. Never hard-code hex colors or magic pixel numbers in `className` (no `bg-[#7B1E3A]`, no `mt-[13px]`) — add the token to `tailwind.config.js` / `src/constants/theme.ts` instead.
- **Variants** on shared components use `tva` from `@gluestack-ui/nativewind-utils`, not conditional string concatenation.
- **Dark mode / platform**: express with NativeWind modifiers (`dark:`, `ios:`, `android:`) instead of runtime branching where possible.
- **Legacy migration**: screens still on `StyleSheet.create` (all `src/features/*/screens/*`, plus `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx` and `src/components/common/*`) are legacy. When you touch one of those files for a real change, convert the parts you touch to NativeWind/gluestack; do not add new `StyleSheet.create` blocks to them. Do not open drive-by rewrites of untouched screens.
- Touch targets stay `>= 44x44` (`min-h-11 min-w-11`) regardless of styling approach.

### AuthStack Screens
| Screen | File | Features |
|---|---|---|
| Login | `src/features/auth/screens/LoginScreen.tsx` | Email/password (zod + react-hook-form), Google OAuth (In-App Browser), navigation to Register/ForgotPassword |
| Register | `src/features/auth/screens/RegisterScreen.tsx` | Name, email, password, confirm password (zod + react-hook-form) |
| ForgotPassword | `src/features/auth/screens/ForgotPasswordScreen.tsx` | Email input (zod + react-hook-form), sends reset link |
| ResetPassword | `src/features/auth/screens/ResetPasswordScreen.tsx` | Token, new password + confirm
| VerifyEmail | `src/features/auth/screens/VerifyEmailScreen.tsx` | 4-digit OTP input (`src/components/ui/OtpInput.tsx`), resend with 60s cooldown |

### MainTabs Screens
| Tab | Screen | File | Status |
|---|---|---|---|
| Home | HomeScreen | `src/features/home/screens/HomeScreen.tsx` | ✅ Done — Quota card, feature grid |
| Try-On | TryOnScreen | `src/features/try-on/screens/TryOnScreen.tsx` | 🚧 Placeholder |
| Shop | ShopScreen | `src/features/products/screens/ShopScreen.tsx` | 🚧 Placeholder |
| Stylist | StylistScreen | `src/features/stylist/screens/StylistScreen.tsx` | 🚧 Placeholder |
| Profile | ProfileScreen | `src/features/profile/screens/ProfileScreen.tsx` | ✅ Done — User info, logout |

## Feature Modules (Referencing FashionAI_FE & FashionAI_BE)

| Feature | Mobile Location | BE Reference | FE Reference |
|---|---|---|---|
| **Auth** | `src/features/auth/` | `auth.controller.ts` (14 endpoints) | `src/features/auth/*` |
| **Virtual Try-On** | `src/features/try-on/` | `try-on.controller.ts` (6 endpoints) | `src/features/try-on/*` |
| **AI Stylist** | `src/features/stylist/` | `stylist.controller.ts` (4 endpoints) | `src/features/stylist/*` |
| **AI Chatbot** | `src/features/chat/` | `chat.controller.ts` + `chat.gateway.ts` (WS) | `src/features/chat/*` |
| **Products & Catalog** | `src/features/products/` | `products.controller.ts` (8 endpoints) | `src/features/products/*` |
| **Collections** | `src/features/collections/` | `collections.controller.ts` (10 endpoints) | `src/features/collections/*` |
| **Reviews** | `src/features/reviews/` | `reviews.controller.ts` (11 endpoints) | `src/features/reviews/*` |
| **Cart & Orders** | `src/features/cart/`, `src/features/orders/`, `src/features/checkout/` | `orders.controller.ts` (14 endpoints) | `src/features/cart/*`, `src/features/checkout/*` |
| **Shipping (GHN)** | `src/features/shipping/` | `shipping.controller.ts` (5 endpoints) | `src/features/shipping/*` |
| **Payments (SePay)** | `src/features/payments/` | `payments.controller.ts` (13 endpoints) | `src/features/payments/*` |
| **Subscriptions (VIP)** | `src/features/subscription/` | `payments.controller.ts` + `users.controller.ts` | `src/features/subscription/*` |
| **Profile & Measurements** | `src/features/profile/`, `src/features/measurements/` | `users.controller.ts` (8 endpoints) | `src/features/profile/*`, `src/features/measurements/*` |
| **Notifications** | `src/features/notifications/` | `notification.controller.ts` + `realtime.gateway.ts` | `src/features/notifications/*` |
| **Rack (Wardrobe)** | `src/features/rack/` | `rack.controller.ts` (4 endpoints) | `src/features/rack/*` |

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

### Endpoint Constants (`src/constants/endpoints.ts`)
Centralized endpoint definitions matching BE routes exactly.

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

## Realtime (Socket.IO) — Phase 2+
- **Namespace `/`**: Notifications, `token:expiring`, `token:expired`
- **Namespace `/chat`**: AI Chatbot streaming (`chat:send`, `chat:token`, `chat:done`, `chat:error`)
- **Transport**: `websocket` only (BE requirement)
- **Auth**: `auth: { token: accessToken }`
- **Reconnect**: `AppState` listener on app foreground

## Image Upload
- Try-On and Stylist may use `expo-image-picker` and multipart `FormData` where their backend endpoints support it.
- Reviews currently accept image URLs as `images?: string[]`; do not invent a Review multipart upload endpoint unless the backend contract changes.
- For supported multipart flows, the backend uses `multer` (memory) and Cloudinary with a 10MB limit.

## File Structure

```
src/
├── api/
│   ├── client.ts           # shared axios + interceptors only
│   └── http.ts             # generic http wrapper (signal, paged, upload) — use this in features
├── features/
│   ├── auth/
│   │   ├── api/auth.api.ts
│   │   ├── context/auth-context.tsx
│   │   ├── hooks/use-auth.ts
│   │   ├── schemas/auth.schema.ts  # zod schemas for auth forms
│   │   ├── screens/        # LoginScreen.tsx, RegisterScreen.tsx, ForgotPasswordScreen.tsx, ResetPasswordScreen.tsx, VerifyEmailScreen.tsx, ChangePasswordScreen.tsx
│   │   ├── storage/secure-storage.ts
│   │   └── types/auth.ts
│   ├── home/
│   │   └── screens/HomeScreen.tsx
│   ├── products/
│   │   ├── screens/ShopScreen.tsx
│   │   ├── store/          # use-filter-store.ts, filter-store.ts
│   │   └── types/product.ts
│   ├── try-on/
│   │   ├── screens/TryOnScreen.tsx
│   │   └── types/tryon.ts
│   ├── stylist/
│   │   ├── screens/StylistScreen.tsx
│   │   └── types/stylist.ts
│   ├── cart/
│   │   └── store/          # use-cart-store.ts, cart-store.ts
│   ├── orders/
│   │   └── types/order.ts
│   └── profile/
│       ├── screens/ProfileScreen.tsx
│       └── types/user.ts
├── navigation/
│   ├── types.ts            # AuthStackParamList, MainTabParamList, RootStackParamList
│   ├── auth-stack.tsx
│   ├── main-tabs.tsx
│   └── root-navigator.tsx
├── components/
│   ├── ui/                 # Button.tsx, Card.tsx, Input.tsx
│   └── common/             # EmptyState.tsx, ErrorView.tsx, Loading.tsx
├── hooks/
│   ├── use-auth.ts         # compatibility re-export
│   └── use-color-scheme.ts # cross-feature hook
├── types/
│   └── api.ts              # truly shared API envelope types
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

## Sprint 1 Checklist (Current Focus)

| Task | Status | File |
|---|---|---|
| Auth Context + Secure Storage | ✅ Done | `src/features/auth/` |
| API Client + Interceptors | ✅ Done | `src/api/client.ts` |
| Auth API Layer | ✅ Done | `src/features/auth/api/auth.api.ts` |
| Login Screen | ✅ Done | `src/features/auth/screens/LoginScreen.tsx` |
| Register Screen | ✅ Done | `src/features/auth/screens/RegisterScreen.tsx` |
| ForgotPassword Screen | ✅ Done | `src/features/auth/screens/ForgotPasswordScreen.tsx` |
| ResetPassword Screen | ✅ Done | `src/features/auth/screens/ResetPasswordScreen.tsx` |
| AuthStack Navigation | ✅ Done | `src/navigation/auth-stack.tsx` |
| MainTabs Navigation | ✅ Done | `src/navigation/main-tabs.tsx` |
| RootNavigator (Auth ↔ Main) | ✅ Done | `src/navigation/root-navigator.tsx` |
| Home Screen with Quota | ✅ Done | `src/features/home/screens/HomeScreen.tsx` |
| Profile Screen with Logout | ✅ Done | `src/features/profile/screens/ProfileScreen.tsx` |
| Placeholder TryOn/Stylist/Shop | ✅ Done | `src/features/*/screens/` |
| App.tsx updated | ✅ Done | `App.tsx` |
| TypeScript passes | ✅ Done | `npx tsc --noEmit` |

## Naming Conventions

- **Files & folders**: `kebab-case` for non-component files (e.g. `use-auth.ts`, `auth-stack.tsx`); `PascalCase` for component files (screens, `components/ui`, `components/common`)
- **React components**: `PascalCase` export, `PascalCase` file (e.g. `LoginScreen.tsx`)
- **Hooks**: file `use-*.ts`, hook `useFoo`
- **Zustand stores**: file `use-*-store.ts`, hook `useFooStore`
- **Interfaces**: `I` prefix (`IUser`, `IProduct`, `IOrder`)
- **Types**: `I` prefix for object shapes; plain `PascalCase` for unions
- **Enums**: `E` prefix (`ETier`, `EOrderStatus`); prefer `enum` over string unions
- **Constants**: `SCREAMING_SNAKE_CASE` for primitives; `PascalCase` for grouped objects
- **Functions**: `camelCase`, must start with verb (`getUser`, `handleLogin`)

## Best Practices

- **API Endpoints**: NEVER hardcode — use `ENDPOINTS` from `src/constants/endpoints.ts`
- **Headers**: ALWAYS include `X-Platform: mobile` on all requests (enforced in client interceptor)
- **Tokens**: NEVER use `AsyncStorage` for tokens — only `expo-secure-store`
- **HTTP Calls**: ALWAYS go through `http` from `src/api/http.ts`; never import `api`/`axios` inside `src/features/**`
- **Request Cancellation**: ALWAYS pass React Query's `signal` into `http.*` options; ignore cancelled requests via `isCanceledError()`
- **Error Handling**: `http` already unwraps the envelope and throws `ApiError` — catch `ApiError` for `code`-based UI logic. Use `unwrap()` from `src/types/api.ts` only outside the wrapper (e.g. `client.ts` interceptors)
- **Date & Timezone**: Use `src/utils/date.ts` helpers for local date grouping
- **Unit**: Always `kg` / `cm` (Vietnamese audience)
- **Styling**: ALWAYS NativeWind `className` + gluestack components from `src/components/ui` when one exists; `StyleSheet.create` only as a documented last resort (see *Styling Rules*)
- **UI Primitives**: NEVER hand-roll a component gluestack already provides — `npx gluestack-ui add <component>` into `src/components/ui`
- **Design Tokens**: NEVER hard-code hex colors or pixel values in `className` — extend `tailwind.config.js` / `src/constants/theme.ts`
- **Design First**: Read `design-system.md` and relevant FE/mobile references before implementing UI
- **Plan & Confirm**: Produce plan first, get approval before writing code

## Known Issues & Edge Cases

| Issue | Impact | Mitigation |
|---|---|---|
| **Google OAuth deep link** | Doesn't work on iOS Simulator reliably | Test on physical device; use `expo-dev-client` for development builds |
| **Token refresh race condition** | Multiple 401s could trigger parallel refresh | `refreshingPromise` singleton in interceptor prevents this |
| **SecureStore not available on web** | `expo-secure-store` no-op on web | Use `localStorage` fallback for web (not implemented yet) |
| **Socket reconnection** | RN background kills WS | `AppState` listener reconnects on `active` |

## References

- **Backend API**: `../FashionAI_BE/src/modules/*/`
- **Web Frontend**: `../FashionAI_FE/src/features/*`
- **Cross-platform Auth Flow**: `../FashionAI_BE/001-cross-platform-auth-flow.md`
- **Mobile Setup Plan**: `MOBILE_SETUP_PLAN.md`
- **Task Allocation**: `MOBILE_TASK_ALLOCATION.md`
.
