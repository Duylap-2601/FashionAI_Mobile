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
- **Styling**: **Inline StyleSheet** (no Tailwind/NativeWind) — consistent with `src/screens/*/StyleSheet.create`
- **State Management**: **Zustand** for client state (cart, filters), **TanStack React Query v5** for server state caching & mutations
- **Validation**: **Zod v4** schemas + **react-hook-form v7** for forms (auth, profile, measurements)
- **Theme**: `src/constants/theme.ts` — light colors, spacing scale, font definitions
- **Hooks**: `src/hooks/` — `useAuth`, `useColorScheme`
- **Path aliases**: `@/` → `src/*`, `@/assets/*` → `assets/*` (configured in `tsconfig.json`)

## Routes & Navigation Structure

| Navigator | Screens | Description |
|---|---|---|
| **AuthStack** | Login, Register, ForgotPassword, ResetPassword | Unauthenticated flow — email/password + Google OAuth |
| **MainTabs** | HomeTab, TryOnTab, ShopTab, StylistTab, ProfileTab | Authenticated bottom tabs (5 tabs) |
| **RootNavigator** | Auth / Main | Switches based on `isAuthenticated` from `AuthContext` |

### AuthStack Screens
| Screen | File | Features |
|---|---|---|
| Login | `src/screens/auth/login-screen.tsx` | Email/password, Google OAuth (In-App Browser), navigation to Register/ForgotPassword |
| Register | `src/screens/auth/register-screen.tsx` | Name, email, password, confirm password, validation |
| ForgotPassword | `src/screens/auth/forgot-password-screen.tsx` | Email input, sends reset link via BE |
| ResetPassword | `src/screens/auth/reset-password-screen.tsx` | Token from deep link, new password + confirm |

### MainTabs Screens
| Tab | Screen | File | Status |
|---|---|---|---|
| Home | HomeScreen | `src/screens/home/home-screen.tsx` | ✅ Done — Quota card, feature grid |
| Try-On | TryOnScreen | `src/screens/tryon/tryon-screen.tsx` | 🚧 Placeholder |
| Shop | ShopScreen | `src/screens/shop/shop-screen.tsx` | 🚧 Placeholder |
| Stylist | StylistScreen | `src/screens/stylist/stylist-screen.tsx` | 🚧 Placeholder |
| Profile | ProfileScreen | `src/screens/profile/profile-screen.tsx` | ✅ Done — User info, logout |

## Feature Modules (Referencing FashionAI_FE & FashionAI_BE)

| Feature | Mobile Location | BE Reference | FE Reference |
|---|---|---|---|
| **Auth** | `src/auth/`, `src/screens/auth/`, `src/api/auth-api.ts` | `auth.controller.ts` (14 endpoints) | `src/features/auth/*` |
| **Virtual Try-On** | `src/screens/tryon/`, `src/api/tryon-api.ts` | `try-on.controller.ts` (6 endpoints) | `src/features/try-on/*` |
| **AI Stylist** | `src/screens/stylist/`, `src/api/stylist-api.ts` | `stylist.controller.ts` (4 endpoints) | `src/features/stylist/*` |
| **AI Chatbot** | `src/screens/chat/`, `src/api/chat-api.ts` | `chat.controller.ts` + `chat.gateway.ts` (WS) | `src/features/chat/*` |
| **Products & Catalog** | `src/screens/shop/`, `src/api/products-api.ts` | `products.controller.ts` (8 endpoints) | `src/features/products/*` |
| **Collections** | `src/screens/shop/`, `src/api/collections-api.ts` | `collections.controller.ts` (10 endpoints) | `src/features/collections/*` |
| **Reviews** | `src/screens/shop/`, `src/api/reviews-api.ts` | `reviews.controller.ts` (11 endpoints) | `src/features/reviews/*` |
| **Cart & Orders** | `src/screens/cart/`, `src/api/orders-api.ts` | `orders.controller.ts` (14 endpoints) | `src/features/cart/*`, `src/features/checkout/*` |
| **Shipping (GHN)** | `src/screens/checkout/`, `src/api/shipping-api.ts` | `shipping.controller.ts` (5 endpoints) | `src/features/shipping/*` |
| **Payments (SePay)** | `src/screens/payments/`, `src/api/payments-api.ts` | `payments.controller.ts` (13 endpoints) | `src/features/payments/*` |
| **Subscriptions (VIP)** | `src/screens/subscription/`, `src/api/subscriptions-api.ts` | `payments.controller.ts` + `users.controller.ts` | `src/features/subscription/*` |
| **Profile & Measurements** | `src/screens/profile/`, `src/api/users-api.ts` | `users.controller.ts` (8 endpoints) | `src/features/profile/*`, `src/features/measurements/*` |
| **Notifications** | `src/screens/notifications/`, `src/api/notification-api.ts` | `notification.controller.ts` + `realtime.gateway.ts` | `src/features/notifications/*` |
| **Rack (Wardrobe)** | `src/screens/rack/`, `src/api/rack-api.ts` | `rack.controller.ts` (4 endpoints) | `src/features/rack/*` |

## API Layer

### HTTP Client (`src/api/client.ts`)
- **Axios instance** with baseURL from `ENV.API_URL`
- **Request interceptor**: Adds `Authorization: Bearer <accessToken>` + `X-Platform: mobile`
- **Response interceptor**: Auto-refresh on 401 `ACCESS_TOKEN_EXPIRED`, converts BE error envelope to `ApiError`

### Auth API (`src/api/auth-api.ts`)
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

## Secure Storage (`src/auth/secure-storage.ts`)
- **expo-secure-store** for accessToken, refreshToken, user data
- Keys: `fashionai_access_token`, `fashionai_refresh_token`, `fashionai_user_data`

## Auth Context (`src/auth/auth-context.tsx`)
Global provider with:
- `user`, `isLoading`, `isAuthenticated`
- `login`, `register`, `loginWithGoogle`, `logout`, `refreshUser`
- Bootstrap: loads tokens → validates with `/users/me` → caches user
- Listens to `onUnauthorized` from API client for forced logout

## Type Definitions

### `src/types/auth.ts`
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
│   ├── client.ts           # axios + interceptors
│   ├── auth-api.ts
│   ├── tryon-api.ts
│   ├── stylist-api.ts
│   ├── products-api.ts
│   ├── collections-api.ts
│   ├── reviews-api.ts
│   ├── orders-api.ts
│   ├── payments-api.ts
│   ├── shipping-api.ts
│   ├── subscriptions-api.ts
│   ├── users-api.ts
│   ├── notification-api.ts
│   ├── chat-api.ts
│   └── rack-api.ts
├── auth/
│   ├── auth-context.tsx    # provider + useAuth
│   ├── use-auth.ts         # re-export
│   └── secure-storage.ts   # expo-secure-store
├── navigation/
│   ├── types.ts            # AuthStackParamList, MainTabParamList, RootStackParamList
│   ├── auth-stack.tsx
│   ├── main-tabs.tsx
│   └── root-navigator.tsx
├── screens/
│   ├── auth/               # Login, Register, ForgotPassword, ResetPassword
│   ├── home/               # HomeScreen
│   ├── tryon/              # TryOnScreen, TryOnHistory, TryOnWorkspace
│   ├── stylist/            # StylistScreen, StylistHistory
│   ├── chat/               # ChatScreen, ChatHistory
│   ├── shop/               # ShopScreen, ProductList, ProductDetail, Collections
│   ├── cart/               # CartScreen
│   ├── checkout/           # CheckoutScreen, ShippingAddress
│   ├── payments/           # PaymentWebView
│   ├── subscription/       # SubscriptionPlans
│   ├── profile/            # ProfileScreen, MeasurementsScreen
│   └── notifications/      # NotificationList
├── components/
│   ├── auth/               # AuthInput, AuthButton, GoogleButton
│   ├── ui/                 # Button, Input, Card, Badge, Modal
│   └── common/             # Loading, ErrorView, EmptyState
├── hooks/
│   ├── use-auth.ts
│   └── use-color-scheme.ts
├── types/
│   ├── auth.ts
│   ├── api.ts
│   ├── tryon.ts
│   ├── stylist.ts
│   ├── product.ts
│   ├── order.ts
│   └── user.ts
├── constants/
│   ├── endpoints.ts
│   ├── theme.ts
│   └── ai-actions.ts
├── config/
│   └── env.ts
├── realtime/
│   └── socket.ts
├── store/
│   ├── cart-store.ts       # Zustand cart
│   └── filter-store.ts     # Zustand filters
└── utils/
    ├── date.ts
    └── format.ts
```

## Sprint 1 Checklist (Current Focus)

| Task | Status | File |
|---|---|---|
| Auth Context + Secure Storage | ✅ Done | `src/auth/` |
| API Client + Interceptors | ✅ Done | `src/api/client.ts` |
| Auth API Layer | ✅ Done | `src/api/auth-api.ts` |
| Login Screen | ✅ Done | `src/screens/auth/login-screen.tsx` |
| Register Screen | ✅ Done | `src/screens/auth/register-screen.tsx` |
| ForgotPassword Screen | ✅ Done | `src/screens/auth/forgot-password-screen.tsx` |
| ResetPassword Screen | ✅ Done | `src/screens/auth/reset-password-screen.tsx` |
| AuthStack Navigation | ✅ Done | `src/navigation/auth-stack.tsx` |
| MainTabs Navigation | ✅ Done | `src/navigation/main-tabs.tsx` |
| RootNavigator (Auth ↔ Main) | ✅ Done | `src/navigation/root-navigator.tsx` |
| Home Screen with Quota | ✅ Done | `src/screens/home/home-screen.tsx` |
| Profile Screen with Logout | ✅ Done | `src/screens/profile/profile-screen.tsx` |
| Placeholder TryOn/Stylist/Shop | ✅ Done | `src/screens/*/` |
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
- **Design First**: Read FE designs before implementing UI
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