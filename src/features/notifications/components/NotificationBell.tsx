import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { useNotificationSocket } from '@/features/notifications/hooks/use-notification-socket';

// Chuông thông báo cho header dùng chung. Tự giữ badge đồng bộ qua
// unread-count API + socket push, nên chỉ cần render ở nơi luôn hiện khi
// đã đăng nhập (HeaderRight trong main-tabs).
export const NotificationBell: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data } = useUnreadCount();
  const unread = data?.unread ?? 0;
  useNotificationSocket();

  return (
    <Pressable
      accessibilityLabel="Thông báo"
      onPress={() => navigation.navigate('Notifications')}
      className="min-h-11 min-w-11 items-center justify-center rounded-full"
    >
      <View>
        <Bell size={24} color={COLORS.onSurface} />
        {unread > 0 ? (
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary-container px-xs">
            <Text className="text-label-md text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

export default NotificationBell;
