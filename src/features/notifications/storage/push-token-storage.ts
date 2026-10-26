import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'fashionai_push_token';

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredPushToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to store push token:', error);
  }
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear push token:', error);
  }
}
