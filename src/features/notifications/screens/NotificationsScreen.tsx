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
import {
  ArrowLeft,
  Bell,
  CreditCard,
  Info,
  Package,
  ShieldAlert,
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
import { getOrderNotificationTarget } from '@/features/notifications/utils/order-notification-target';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
import { COLORS } from '@/constants/theme';

type NotificationFilter =
  | 'ALL'
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'ORDER_ISSUE'
  | 'PROMOTION'
  | 'SYSTEM';

const FILTERS: { value: NotificationFilter; label: string; Icon: LucideIcon }[] = [
  { value: 'ALL', label: 'Tất cả', Icon: Bell },
  { value: 'ORDER_STATUS', label: 'Đơn hàng', Icon: Package },
  { value: 'PAYMENT', label: 'Thanh toán', Icon: CreditCard },
  { value: 'ORDER_ISSUE', label: 'Đổi trả', Icon: ShieldAlert },
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
    accessibilityState={{ selected }}
    onPress={onPress}
    className={`h-10 flex-row items-center gap-1.5 rounded-subtle border px-3 ${
      selected ? 'border-oxblood bg-oxblood' : 'border-landing-line bg-ivory'
    }`}
  >
    <Icon
      size={14}
      strokeWidth={1.75}
      color={selected ? COLORS.paper : COLORS.muted}
    />
    <Text
      className={`font-sans text-[11px] font-semibold uppercase tracking-[0.12em] ${
        selected ? 'text-landing-paper' : 'text-landing-obsidian'
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
    const orderTarget = getOrderNotificationTarget(item.type, payload);
    if (orderTarget) {
      if (orderTarget.screen === 'Returns') {
        navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'Returns' } });
      } else {
        navigation.navigate(orderTarget.screen, { orderId: orderTarget.orderId });
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
    <SafeAreaView edges={['top']} className="flex-1 bg-landing-paper">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={handlePressItem} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.oxblood}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={() => null}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <View className="gap-2 border-b border-landing-line px-lg pb-5 pt-lg">
              <Pressable
                className="-ml-1 min-h-11 flex-row items-center gap-1.5 self-start active:opacity-70"
                accessibilityLabel="Quay lại"
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft size={18} strokeWidth={1.75} color={COLORS.obsidian} />
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                  Quay lại
                </Text>
              </Pressable>
              <Text className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
                Tài khoản
              </Text>
              <Text
                accessibilityRole="header"
                className="font-display text-headline-lg text-landing-obsidian"
              >
                Thông báo
              </Text>
              <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
                Cập nhật thông tin đơn hàng, thanh toán và các ưu đãi mới nhất
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 px-lg">
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
              <View className="items-end px-lg">
                <Pressable
                  className="min-h-11 justify-center active:opacity-70"
                  disabled={isMarkingAll}
                  onPress={() => markAllRead()}
                >
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                    {isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="px-lg">
            <View className="items-center gap-2 rounded-subtle border border-dashed border-taupe bg-ivory px-6 py-12">
              <Bell size={24} strokeWidth={1.5} color={COLORS.oxblood} />
              <Text className="text-center font-display text-[19px] text-landing-obsidian">
                {filter === 'ALL'
                  ? 'Chưa có thông báo'
                  : 'Không có thông báo nào trong mục này'}
              </Text>
              <Text className="text-center font-sans text-body-sm text-landing-muted">
                {hasNextPage
                  ? 'Kéo xuống để tải thêm hoặc thử lại sau.'
                  : 'Đơn hàng, khuyến mãi và cập nhật mới sẽ hiện ở đây.'}
              </Text>
              {hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => fetchNextPage()}
                  className="mt-2 h-10 items-center justify-center rounded-subtle border border-landing-line px-4 active:bg-landing-paper"
                >
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                    Tải thêm
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
