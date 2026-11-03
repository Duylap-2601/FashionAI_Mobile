import { notificationsApi } from '@/features/notifications/api/notifications.api';
import {
  clearStoredPushToken,
  getStoredPushToken,
} from '@/features/notifications/storage/push-token-storage';

/**
 * Gọi trước khi xoá session để BE không tiếp tục đẩy thông báo cho thiết bị.
 * Best-effort: lỗi mạng không được chặn logout.
 */
export async function unregisterPushToken(): Promise<void> {
  const token = await getStoredPushToken();
  if (!token) return;

  try {
    await notificationsApi.unregisterDeviceToken(token);
  } catch (error) {
    console.warn('Không huỷ đăng ký push token:', error);
  } finally {
    await clearStoredPushToken();
  }
}
