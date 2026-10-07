import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getMainSocket } from '@/realtime/socket';
import { getTokens } from '@/features/auth/storage/secure-storage';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { notificationKeys } from '@/features/notifications/hooks/notification-keys';

interface ReauthAck {
  ok: boolean;
  error?: string;
}

// Lắng nghe socket chính cho tính năng thông báo:
// - event `notification` (BE push khi có thông báo mới) → refresh list + badge.
// - `token:expiring` → gửi lại token tươi qua `auth:refresh` (BE yêu cầu,
//   xem realtime.gateway.ts). Thất bại → reconnect để handshake lại.
// - `token:expired` → server đã disconnect → reconnect (đọc lại token mới nhất).
// Mount 1 lần ở nơi luôn hiện khi đã đăng nhập (NotificationBell).
export function useNotificationSocket() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    let socket: Socket | null = null;

    const refreshQueries = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handlePush = () => {
      refreshQueries();
    };

    const handleExpiring = async () => {
      try {
        const { accessToken } = await getTokens();
        if (!active || !accessToken || !socket) return;
        const ack = (await socket
          .timeout(5000)
          .emitWithAck('auth:refresh', { token: accessToken })) as ReauthAck;
        if (!ack?.ok) {
          socket.disconnect();
          await getMainSocket();
        }
      } catch {
        // Server sẽ disconnect khi hết hạn; AppState reconnect lo phần còn lại.
      }
    };

    const handleExpired = async () => {
      try {
        socket?.disconnect();
        if (active) {
          await getMainSocket();
        }
      } catch {
        // Bỏ qua, lần foreground hoặc request HTTP tiếp theo sẽ xoay token.
      }
    };

    getMainSocket()
      .then((s) => {
        if (!active) return;
        socket = s;
        s.on('notification', handlePush);
        s.on('token:expiring', handleExpiring);
        s.on('token:expired', handleExpired);
      })
      .catch(() => {});

    return () => {
      active = false;
      socket?.off('notification', handlePush);
      socket?.off('token:expiring', handleExpiring);
      socket?.off('token:expired', handleExpired);
    };
  }, [isAuthenticated, queryClient]);
}
