import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { notificationKeys } from '@/features/notifications/hooks/notification-keys';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import type { DeviceTokenPlatform } from '@/features/notifications/api/notifications.api';
import {
  getStoredPushToken,
  setStoredPushToken,
} from '@/features/notifications/storage/push-token-storage';
import { ENV } from '@/config/env';
import { RootStackParamList } from '@/navigation/types';

// Foreground: socket + React Query đã cập nhật UI, không hiện thêm banner.
// Background/killed: OS tự hiển thị notification, handler không can thiệp.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let warnedMissingProjectId = false;

function getProjectId(): string | undefined {
  return (
    ENV.EAS_PROJECT_ID ||
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
    (Constants.easConfig?.projectId as string | undefined)
  );
}

function getPlatform(): DeviceTokenPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

async function getExpoPushToken(): Promise<string | null> {
  // TEMP TEST ONLY: cho phép emulator đăng ký token, revert sau khi test.
  // if (!Device.isDevice) {
  //   return null;
  // }

  const projectId = getProjectId();
  if (!projectId) {
    if (!warnedMissingProjectId) {
      warnedMissingProjectId = true;
      console.warn(
        'Thiếu EAS project ID, bỏ qua đăng ký push. Thêm extra.eas.projectId trong app.json hoặc EXPO_PUBLIC_EAS_PROJECT_ID.',
      );
    }
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5D1C34',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  payload: unknown,
): void {
  const data =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};

  const type = readString(data.notificationType) ?? readString(data.type);
  const orderId = readString(data.orderId);
  const productId = readString(data.productId);

  if ((type === 'ORDER_STATUS' || type === 'PAYMENT') && orderId) {
    navigation.navigate('OrderDetail', { orderId });
    return;
  }

  if (type === 'REVIEW') {
    if (productId) {
      navigation.navigate('ProductDetail', { productId });
    } else {
      navigation.navigate('MyReviews');
    }
    return;
  }

  if (type === 'PROMOTION') {
    navigation.navigate('Main', { screen: 'ShopTab' });
    return;
  }

  navigation.navigate('Notifications');
}

/**
 * Đăng ký Expo push token khi đã đăng nhập và điều hướng khi user tap
 * notification (kể cả app đang bị kill). Mount 1 lần trong NavigationContainer.
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const handledResponseIds = useRef<Set<string>>(new Set());
  const isRegistering = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    let active = true;

    const refreshQueries = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    };

    const syncToken = async () => {
      if (isRegistering.current) return;
      isRegistering.current = true;
      try {
        const token = await getExpoPushToken();
        if (!active || !token) return;

        const previousToken = await getStoredPushToken();
        if (previousToken && previousToken !== token) {
          await notificationsApi
            .unregisterDeviceToken(previousToken)
            .catch(() => {});
        }

        await setStoredPushToken(token);
        await notificationsApi.registerDeviceToken(token, getPlatform());
      } catch (error) {
        console.warn('Không đăng ký được push token:', error);
      } finally {
        isRegistering.current = false;
      }
    };

    void syncToken();

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          void syncToken();
        }
      },
    );

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      if (handledResponseIds.current.has(identifier)) return;
      handledResponseIds.current.add(identifier);

      refreshQueries();
      navigateFromNotification(
        navigation,
        response.notification.request.content.data,
      );
      void Notifications.clearLastNotificationResponseAsync();
    };

    const receivedSubscription =
      Notifications.addNotificationReceivedListener(() => {
        refreshQueries();
      });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (active && response) {
          handleResponse(response);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      appStateSubscription.remove();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [isAuthenticated, navigation, queryClient]);
}

/**
 * Component không render UI, chỉ giữ hook sống trong NavigationContainer.
 */
export function PushNotificationsHandler(): null {
  usePushNotifications();
  return null;
}
