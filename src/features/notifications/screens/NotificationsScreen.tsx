import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Bell,
  CreditCard,
  Info,
  Package,
  Tag,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/hooks/use-notifications';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import type { INotification } from '@/features/notifications/types/notification';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
import { COLORS } from '@/constants/theme';

type NotificationFilter =
  | 'ALL'
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'SYSTEM';

const FILTERS: { value: NotificationFilter; label: string; Icon: LucideIcon }[] = [
  { value: 'ALL', label: 'Tất cả', Icon: Bell },
  { value: 'ORDER_STATUS', label: 'Đơn hàng', Icon: Package },
  { value: 'PAYMENT', label: 'Thanh toán', Icon: CreditCard },
  { value: 'PROMOTION', label: 'Khuyến mãi', Icon: Tag },
  { value: 'SYSTEM', label: 'Hệ thống', Icon: Info },
];

const FilterChip: React.FC<{
  label: string;
  Icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
}> = ({ label, Icon, selected, onPress }) => (
  <Pressable
    accessibilityLabel={label}
    onPress={onPress}
    className={`min-h-11 flex-row items-center gap-xs rounded-full border px-md ${
      selected ? 'border-primary-container bg-primary-container' : 'border-outline-variant bg-surface-lowest'
    }`}
  >
    <Icon
      size={16}
      color={selected ? COLORS.onPrimary : COLORS.onSurfaceVariant}
    />
    <Text
      className={`text-label-lg ${
        selected ? 'text-primary-foreground' : 'text-on-surface'
      }`}
    >
      {label}
    </Text>
  </Pressable>
);

export const NotificationsScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { refetch: refetchUnread } = useUnreadCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const items = data?.pages.flatMap((page) => page.data) ?? [];
  const hasUnread = items.some((item) => !item.isRead);
  const filtered =
    filter === 'ALL' ? items : items.filter((item) => item.type === filter);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchUnread();
    }, [refetch, refetchUnread]),
  );

  const handlePressItem = (item: INotification) => {
    if (!item.isRead) {
      markRead(item.id);
    }
    const payload = item.data ?? {};
    if (item.type === 'ORDER_STATUS' || item.type === 'PAYMENT') {
      if (typeof payload.orderId === 'string' && payload.orderId) {
        navigation.navigate('OrderDetail', { orderId: payload.orderId });
      }
    } else if (item.type === 'PROMOTION') {
      navigation.navigate('Main', { screen: 'ShopTab' });
    } else if (item.type === 'REVIEW') {
      if (typeof payload.productId === 'string' && payload.productId) {
        navigation.navigate('ProductDetail', { productId: payload.productId });
      } else {
        navigation.navigate('MyReviews');
      }
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchUnread();
  };

  if (isLoading) {
    return <Loading fullscreen message="Đang tải thông báo..." />;
  }

  if (isError && items.length === 0) {
    return (
      <ErrorView
        fullscreen
        title="Không tải được thông báo"
        message="Vui lòng kiểm tra kết nối mạng và thử lại."
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={handlePressItem} />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={() => <View className="h-md" />}
        ListHeaderComponent={
          <View className="pb-md">
            <View className="px-xl">
              <Pressable
                className="min-h-11 flex-row items-center gap-xs self-start"
                accessibilityLabel="Quay lại"
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={20} className="text-on-surface" />
                <Text className="text-label-lg text-on-surface">Quay lại</Text>
              </Pressable>
              <Text className="mt-sm font-heading text-headline-lg font-bold text-primary-container">
                Thông báo
              </Text>
              <Text className="mt-xs text-body-sm text-on-surface-variant">
                Cập nhật thông tin đơn hàng, thanh toán và các ưu đãi mới nhất
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-lg"
            >
              <View className="flex-row gap-sm px-xl">
                {FILTERS.map(({ value, label, Icon }) => (
                  <FilterChip
                    key={value}
                    label={label}
                    Icon={Icon}
                    selected={filter === value}
                    onPress={() => setFilter(value)}
                  />
                ))}
              </View>
            </ScrollView>
            {hasUnread ? (
              <View className="mt-md items-end px-xl">
                <Pressable
                  className="min-h-11 justify-center px-sm"
                  disabled={isMarkingAll}
                  onPress={() => markAllRead()}
                >
                  <Text className="text-label-lg text-primary-container">
                    {isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="px-xl">
            <EmptyState
              icon="🔔"
              title={
                filter === 'ALL'
                  ? 'Chưa có thông báo'
                  : 'Không có thông báo nào trong mục này'
              }
              description={
                hasNextPage
                  ? 'Kéo xuống để tải thêm hoặc thử lại sau.'
                  : 'Đơn hàng, khuyến mãi và cập nhật mới sẽ hiện ở đây.'
              }
              actionTitle={hasNextPage ? 'Tải thêm' : undefined}
              onAction={hasNextPage ? () => fetchNextPage() : undefined}
            />
          </View>
        }
        ListFooterComponent={
          <View className="items-center">
            {isFetchingNextPage ? <Loading message="Đang tải thêm..." /> : null}
            <View className="h-24" />
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
