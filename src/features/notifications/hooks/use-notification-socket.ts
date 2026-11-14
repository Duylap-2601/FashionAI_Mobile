import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Socket } from 'socket.io-client';
import { getMainSocket } from '@/realtime/socket';
import { getTokens } from '@/features/auth/storage/secure-storage';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { notificationKeys } from '@/features/notifications/hooks/notification-keys';
import { MY_RETURNS_KEY } from '@/features/orders/hooks/use-orders';
import { orderChatKeys } from '@/features/orders/hooks/order-chat-keys';
import { reviewKeys } from '@/features/reviews/api/review.keys';
import { useAppToast } from '@/components/providers/toast-provider';
import { getOrderNotificationTarget } from '../utils/order-notification-target';
import type { RootStackParamList } from '@/navigation/types';

const ORDER_NOTIFICATION_TYPES = ['ORDER_STATUS', 'PAYMENT', 'ORDER_ISSUE'];

interface ReauthAck {
  ok: boolean;
  error?: string;
}

// Lắng nghe socket chính cho tính năng thông báo:
// - event `notification` (BE push khi có thông báo mới) → refresh list + badge;
//   thông báo đơn / thanh toán / đổi trả còn làm mới dữ liệu đơn.
// - `token:expiring` → gửi lại token tươi qua `auth:refresh` (BE yêu cầu,
//   xem realtime.gateway.ts). Thất bại → reconnect để handshake lại.
// - `token:expired` → server đã disconnect → reconnect (đọc lại token mới nhất).
// Mount 1 lần ở nơi luôn hiện khi đã đăng nhập (NotificationBell).
export function useNotificationSocket(enabled = true) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!isAuthenticated || !enabled) return;

    let active = true;
    let socket: Socket | null = null;

    const refreshQueries = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handlePush = (notification?: {
      type?: string;
      title?: string;
      message?: string;
      data?: Record<string, unknown>;
    }) => {
      refreshQueries();
      if (notification?.title) {
        const target = getOrderNotificationTarget(notification.type, notification.data ?? {});
        let onPress: (() => void) | undefined;

        if (target) {
          onPress = () => {
            if (target.screen === 'Returns') {
              navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'Returns' } });
            } else if (target.screen === 'OrderDetail') {
              navigation.navigate('OrderDetail', {
                orderId: target.orderId,
                focusChat: target.focusChat,
              });
            } else {
              navigation.navigate('OrderReturns', { orderId: target.orderId });
            }
          };
        }

        showToast({
          title: notification.title,
          message: notification.message,
          type: notification.type === 'ORDER_ISSUE' ? 'warning' : 'info',
          onPress,
        });
      }
      // Đổi trạng thái đơn, duyệt đổi trả, ghi nhận thanh toán / hoàn tiền: tải lại đơn và
      // yêu cầu đổi trả để màn đang mở cập nhật ngay (như RealtimeProvider của web).
      if (notification?.type && ORDER_NOTIFICATION_TYPES.includes(notification.type)) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orderIssues'] });
        queryClient.invalidateQueries({ queryKey: MY_RETURNS_KEY });
      }
      if (notification?.type === 'REVIEW') {
        queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      }
      if (notification?.type === 'ORDER_CHAT') {
        queryClient.invalidateQueries({ queryKey: orderChatKeys.all });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
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
  }, [enabled, isAuthenticated, navigation, queryClient, showToast]);
}
