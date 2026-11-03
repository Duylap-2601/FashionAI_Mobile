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
interface NotificationBellProps {
  enableSocket?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  enableSocket = true,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data } = useUnreadCount();
  const unread = data?.unread ?? 0;
  useNotificationSocket(enableSocket);

  return (
    <Pressable
      accessibilityLabel="Thông báo"
      onPress={() => navigation.navigate('Notifications')}
      className="relative h-9 w-9 items-center justify-center rounded-full active:opacity-70"
    >
      <Bell size={18} color={COLORS.onSurface} />
      {unread > 0 ? (
        <View
          pointerEvents="none"
          className="absolute -right-0.5 -top-0.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-landing-paper bg-landing-oxblood px-1"
        >
          <Text className="font-mono text-[9px] font-semibold text-landing-paper">
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

export default NotificationBell;
