# Đổi App ID & Scheme (feature/auth)

## Vì sao

`FashionAI_Mobile` (Expo) và `FashionAI_Webview` (Capacitor) trước đây dùng chung:
- `scheme`: `fashionai`
- `bundleIdentifier` / `android.package`: `com.fashionai.app`

Khi cả hai app cùng cài trên một máy/emulator, Android/iOS không phân biệt được app nào xử lý deep link `fashionai://auth`, nên Google OAuth callback có thể bị mở nhầm sang app Webview. Đã đổi mobile app sang định danh riêng.

## Thay đổi

| File | Trước | Sau |
|---|---|---|
| `app.json` → `expo.scheme` | `fashionai` | `fashionaimobile` |
| `app.json` → `expo.ios.bundleIdentifier` | `com.fashionai.app` | `com.fashionai.mobile` |
| `app.json` → `expo.android.package` | `com.fashionai.app` | `com.fashionai.mobile` |
| `src/config/env.ts` → `OAUTH_REDIRECT_SCHEME` | `fashionai://auth` | `fashionaimobile://auth` |
| `src/features/auth/api/auth.api.ts` → `googleAuthUrl()` | không gửi `redirect_uri` | thêm `&redirect_uri=<OAUTH_REDIRECT_SCHEME>` |
| `package.json` | thêm `expo-dev-client` | — |
| `package.json` → scripts `android`/`ios` | `expo start --android` / `expo start --ios` | `expo run:android` / `expo run:ios` |

Backend (`fashionai-backend`, repo khác) cũng đã cập nhật `isAllowedMobileRedirectUrl` để chấp nhận scheme `fashionaimobile:`. Thay đổi này cần được deploy lên Render mới có hiệu lực.

## Việc cần làm sau khi pull

```bash
npm install
npx expo run:android   # hoặc: npx expo run:ios
```

Bắt buộc build lại dev-client vì:
- App cũ (`com.fashionai.app`) và app mới (`com.fashionai.mobile`) là hai package khác nhau — Android/iOS coi là hai app riêng biệt.
- Script `android`/`ios` giờ dùng `expo run:*` (native build) thay vì `expo start --android/--ios` (Expo Go). Không thể chạy qua Expo Go nữa vì project đã có `expo-dev-client`.
- Nếu chỉ chạy `npm run start` mà chưa build lại, sẽ gặp lỗi:
  ```
  CommandError: No development build (com.fashionai.mobile) for this project is installed.
  ```

Sau khi build xong lần đầu, các lần sau chỉ cần `npm run start` rồi nhấn `a` (Android) hoặc `i` (iOS) như bình thường — không cần build lại trừ khi thêm native module mới.

## Lưu ý cho Android emulator

- Build native cần khá nhiều RAM/dung lượng ổ đĩa. Nếu máy yếu, có thể giới hạn kiến trúc build trong `android/gradle.properties`:
  ```
  reactNativeArchitectures=x86_64
  ```
  (chỉ build cho kiến trúc emulator đang dùng, thay vì build cả 4 kiến trúc).
