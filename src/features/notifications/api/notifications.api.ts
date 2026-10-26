import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';
import {
  INotification,
  INotificationMeta,
} from '@/features/notifications/types/notification';

export interface NotificationListResult {
  data: INotification[];
  meta: INotificationMeta;
}

export interface MarkAllReadResult {
  updated: number;
}

export type DeviceTokenPlatform = 'ios' | 'android';

export interface DeviceTokenResult {
  id: string;
  platform: DeviceTokenPlatform;
  createdAt: string;
  updatedAt: string;
}

function parseListMeta(value: unknown): INotificationMeta {
  if (!value || typeof value !== 'object') {
    throw new ApiError(
      'Dữ liệu phân trang thông báo không hợp lệ.',
      500,
      'INVALID_NOTIFICATION_META',
    );
  }
  const meta = value as Record<string, unknown>;
  if (
    typeof meta.total !== 'number' ||
    typeof meta.page !== 'number' ||
    typeof meta.limit !== 'number' ||
    typeof meta.totalPages !== 'number'
  ) {
    throw new ApiError(
      'Dữ liệu phân trang thông báo không hợp lệ.',
      500,
      'INVALID_NOTIFICATION_META',
    );
  }
  return {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
    unread: typeof meta.unread === 'number' ? meta.unread : 0,
  };
}

export const notificationsApi = {
  async list(
    page: number,
    limit: number,
    opts?: HttpOptions,
  ): Promise<NotificationListResult> {
    const { data, meta } = await http.getPaged<INotification[]>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { ...opts, params: { page, limit, ...opts?.params } },
    );
    return { data: data ?? [], meta: parseListMeta(meta) };
  },

  unreadCount(opts?: HttpOptions): Promise<{ unread: number }> {
    return http.get<{ unread: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, opts);
  },

  markRead(
    id: string | number,
    opts?: HttpOptions,
  ): Promise<{ id: string | number; isRead: boolean }> {
    return http.patch<{ id: string | number; isRead: boolean }>(
      ENDPOINTS.NOTIFICATIONS.READ(id),
      undefined,
      opts,
    );
  },

  markAllRead(opts?: HttpOptions): Promise<MarkAllReadResult> {
    return http.patch<MarkAllReadResult>(
      ENDPOINTS.NOTIFICATIONS.READ_ALL,
      undefined,
      opts,
    );
  },

  registerDeviceToken(
    token: string,
    platform: DeviceTokenPlatform,
    opts?: HttpOptions,
  ): Promise<DeviceTokenResult> {
    return http.post<DeviceTokenResult>(
      ENDPOINTS.NOTIFICATIONS.DEVICE_TOKEN,
      { token, platform },
      opts,
    );
  },

  unregisterDeviceToken(
    token: string,
    opts?: HttpOptions,
  ): Promise<{ deleted: number }> {
    return http.delete<{ deleted: number }>(
      ENDPOINTS.NOTIFICATIONS.DEVICE_TOKEN,
      { token },
      opts,
    );
  },
};
