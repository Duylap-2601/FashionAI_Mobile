export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3002',
  // Scheme riêng để không đụng với app FashionAI_Webview (đang dùng fashionai://auth)
  OAUTH_REDIRECT_SCHEME: 'fashionaimobile://auth',
};
