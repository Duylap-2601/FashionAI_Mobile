import * as SecureStore from 'expo-secure-store';
import { AuthTokens, User } from '@/features/auth/types/auth';

const ACCESS_TOKEN_KEY = 'fashionai_access_token';
const REFRESH_TOKEN_KEY = 'fashionai_refresh_token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'fashionai_access_token_expires_at';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'fashionai_refresh_token_expires_at';
const USER_KEY = 'fashionai_user_data';

export async function getTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}> {
  try {
    const [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_EXPIRES_AT_KEY),
    ]);
    return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
  } catch (err) {
    console.error('Failed to get tokens from SecureStore:', err);
    return { accessToken: null, refreshToken: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null };
  }
}

export async function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}): Promise<void> {
  try {
    const promises: Promise<void>[] = [
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    ];
    if (tokens.refreshToken) {
      promises.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken));
    }
    if (tokens.accessTokenExpiresAt) {
      promises.push(SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY, tokens.accessTokenExpiresAt));
    }
    if (tokens.refreshTokenExpiresAt) {
      promises.push(SecureStore.setItemAsync(REFRESH_TOKEN_EXPIRES_AT_KEY, tokens.refreshTokenExpiresAt));
    }
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to set tokens in SecureStore:', err);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_AT_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  } catch (err) {
    console.error('Failed to clear tokens from SecureStore:', err);
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store user:', err);
  }
}
