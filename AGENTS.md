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

## Architecture

- **Entrypoint**: `App.tsx` → React Navigation (Stack + Bottom Tabs), not Expo Router
- **Routes**: `src/navigation/` — `AuthStack`, `MainTabs`, `RootNavigator`
- **Source organization**: Feature-based under `src/features/<feature>/`; shared infrastructure stays in `src/navigation`, `src/components`, `src/api`, `src/constants`, `src/config`, `src/realtime`, `src/utils`, and truly shared `src/types`.
- **Styling**: NativeWind is configured for Tailwind utility classes. Existing screens may still use `StyleSheet.create`; new UI may use NativeWind/gluestack where it improves consistency.
- **State Management**: **Zustand** for client state (cart, filters), **TanStack React Query v5** for server state caching & mutations
- **Validation**: **Zod v4** schemas + **react-hook-form v7** for forms (auth, profile, measurements)
- **Theme**: `src/constants/theme.ts` — light colors, spacing scale, font definitions
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
- Implement the design with React Native primitives, NativeWind classes, gluestack-compatible components, or `StyleSheet.create` as appropriate; do not copy HTML, DOM scripts, CDN fonts, or Material Symbols web-font usage into the Expo app.
- Keep reusable primitives in `src/components/ui`; gluestack components should also be added there. Keep screen-specific composition in `src/features/<feature>/screens` until it is reused.
- NativeWind configuration lives in `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js`, and `nativewind-env.d.ts`. `gluestack-ui.config.json` points gluestack CLI/component output to `src/components/ui`.
- `src/constants/theme.ts` is the source for colors, spacing, font sizes, radius, and shadows. It uses the burgundy/cream token set from `design-system.md` (`primary`, `primaryContainer`, `onSurface`, `surfaceLow`, etc.) — use these tokens instead of hard-coding repeated values in screens.
- Use Vietnamese user-facing copy with proper diacritics. Avoid raw backend/technical terms such as `endpoint`, `payload`, `fallback`, `mock`, `Axios error`, or `500 internal server error` in UI.
- Mobile actions must not depend on hover behavior. Keep important actions visible and reachable with touch targets around `44x44` or larger.
- Preserve checkout/order pricing ownership: cart and checkout may display totals returned or verified by backend, but must not submit client-resolved shipping fees or discount amounts as the source of truth.

### AuthStack Screens
| Screen | File | Features |
|---|---|---|
| Login | `src/features/auth/screens/login-screen.tsx` | Email/password (zod + react-hook-form), Google OAuth (In-App Browser), navigation to Register/ForgotPassword |
| Register | `src/features/auth/screens/register-screen.tsx` | Name, email, password, confirm password (zod + react-hook-form) |
| ForgotPassword | `src/features/auth/screens/forgot-password-screen.tsx` | Email input (zod + react-hook-form), sends reset link |
| ResetPassword | `src/features/auth/screens/reset-password-screen.tsx` | Token, new password + confirm (zod + react-hook-form) |
| VerifyEmail | `src/features/auth/screens/verify-email-screen.tsx` | Verification token input, resend verification |

### MainTabs Screens
| Tab | Screen | File | Status |
|---|---|---|---|
| Home | HomeScreen | `src/features/home/screens/home-screen.tsx` | ✅ Done — Quota card, feature grid |
| Try-On | TryOnScreen | `src/features/try-on/screens/try-on-screen.tsx` | 🚧 Placeholder |
| Shop | ShopScreen | `src/features/products/screens/shop-screen.tsx` | 🚧 Placeholder |
| Stylist | StylistScreen | `src/features/stylist/screens/stylist-screen.tsx` | 🚧 Placeholder |
| Profile | ProfileScreen | `src/features/profile/screens/profile-screen.tsx` | ✅ Done — User info, logout |

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

### HTTP Client (`src/api/client.ts`)
- **Axios instance** with baseURL from `ENV.API_URL`
- **Request interceptor**: Adds `Authorization: Bearer <accessToken>` + `X-Platform: mobile`
- **Response interceptor**: Auto-refresh on 401 `ACCESS_TOKEN_EXPIRED`, converts BE error envelope to `ApiError`

### Auth API (`src/features/auth/api/auth.api.ts`)
| Method | Endpoint | Description |
|---|---|---|
| `login` | `POST /auth/login` | Email/password → tokens + user |
| `register` | `POST /auth/register` | Name, email, password → tokens + user |
| `exchangeOAuthCode` | `POST /auth/exchange` | Google auth code → tokens + user |
| `googleAuth` | `GET /auth/google?platform=mobile` | Opens In-App Browser |
| `logout` | `POST /auth/logout` | Revokes refresh token |
| `logoutAll` | `POST /auth/logout-all` | Revokes all sessions |
| `getCurrentUser` | `GET /users/me` | Validates token, returns user |
| `getUserQuota` | `GET /users/me/quota` | AI quota (TRY_ON, STYLIST, CHATBOT) |
| `forgotPassword` | `POST /auth/forgot-password` | Sends reset email |
| `resetPassword` | `POST /auth/reset-password` | Token + new password |
| `verifyEmail` | `POST /auth/verify-email` | Email verification token |
| `resendVerification` | `POST /auth/resend-verification` | Resends verification email |

### Endpoint Constants (`src/constants/endpoints.ts`)
Centralized endpoint definitions matching BE routes exactly.

## Auth Flow (Backend Contract)

### Required Header: `X-Platform: mobile` (ALL auth requests)

### Email/Password
```
POST /auth/register { email, password, name }
POST /auth/login    { email, password }
→ { user, accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }
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

### Email Verification
```
POST /auth/verify-email { token }
POST /auth/resend-verification
```

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
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  OAUTH_REDIRECT_SCHEME: 'fashionai://auth',
}
```

## Realtime (Socket.IO) — Phase 2+
- **Namespace `/`**: Notifications, `token:expiring`, `token:expired`
- **Namespace `/chat`**: AI Chatbot streaming (`chat:send`, `chat:token`, `chat:done`, `chat:error`)
- **Transport**: `websocket` only (BE requirement)
- **Auth**: `auth: { token: accessToken }`
- **Reconnect**: `AppState` listener on app foreground

## Image Upload (Try-On / Stylist / Reviews)
- `expo-image-picker` → `FormData` with `multipart/form-data`
- BE: `multer` (memory) + Cloudinary, 10MB limit
- Client: compress/resize with `expo-image-manipulator` before upload

## File Structure

```
src/
├── api/
│   └── client.ts           # shared axios + interceptors only
├── features/
│   ├── auth/
│   │   ├── api/auth.api.ts
│   │   ├── context/auth-context.tsx
│   │   ├── hooks/use-auth.ts
│   │   ├── schemas/auth.schema.ts  # zod schemas for auth forms
│   │   ├── screens/        # login-screen.tsx, register-screen.tsx, forgot-password-screen.tsx, reset-password-screen.tsx, verify-email-screen.tsx
│   │   ├── storage/secure-storage.ts
│   │   └── types/auth.ts
│   ├── home/
│   │   └── screens/home-screen.tsx
│   ├── products/
│   │   ├── screens/shop-screen.tsx
│   │   ├── store/          # use-filter-store.ts, filter-store.ts
│   │   └── types/product.ts
│   ├── try-on/
│   │   ├── screens/try-on-screen.tsx
│   │   └── types/tryon.ts
│   ├── stylist/
│   │   ├── screens/stylist-screen.tsx
│   │   └── types/stylist.ts
│   ├── cart/
│   │   └── store/          # use-cart-store.ts, cart-store.ts
│   ├── orders/
│   │   └── types/order.ts
│   └── profile/
│       ├── screens/profile-screen.tsx
│       └── types/user.ts
├── navigation/
│   ├── types.ts            # AuthStackParamList, MainTabParamList, RootStackParamList
│   ├── auth-stack.tsx
│   ├── main-tabs.tsx
│   └── root-navigator.tsx
├── components/
│   ├── ui/                 # button.tsx, card.tsx, input.tsx
│   └── common/             # empty-state.tsx, error-view.tsx, loading.tsx
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
| Login Screen | ✅ Done | `src/features/auth/screens/login-screen.tsx` |
| Register Screen | ✅ Done | `src/features/auth/screens/register-screen.tsx` |
| ForgotPassword Screen | ✅ Done | `src/features/auth/screens/forgot-password-screen.tsx` |
| ResetPassword Screen | ✅ Done | `src/features/auth/screens/reset-password-screen.tsx` |
| AuthStack Navigation | ✅ Done | `src/navigation/auth-stack.tsx` |
| MainTabs Navigation | ✅ Done | `src/navigation/main-tabs.tsx` |
| RootNavigator (Auth ↔ Main) | ✅ Done | `src/navigation/root-navigator.tsx` |
| Home Screen with Quota | ✅ Done | `src/features/home/screens/home-screen.tsx` |
| Profile Screen with Logout | ✅ Done | `src/features/profile/screens/profile-screen.tsx` |
| Placeholder TryOn/Stylist/Shop | ✅ Done | `src/features/*/screens/` |
| App.tsx updated | ✅ Done | `App.tsx` |
| TypeScript passes | ✅ Done | `npx tsc --noEmit` |

## Naming Conventions

- **Files & folders**: `kebab-case` (e.g. `login-screen.tsx`, `use-auth.ts`)
- **React components**: `PascalCase` export, kebab-case file (e.g. `LoginScreen`)
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
- **Error Handling**: Use `unwrap()` from `src/types/api.ts` to extract data; catch `ApiError` for `code`-based UI logic
- **Date & Timezone**: Use `src/utils/date.ts` helpers for local date grouping
- **Unit**: Always `kg` / `cm` (Vietnamese audience)
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
