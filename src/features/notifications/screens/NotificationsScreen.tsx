import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCheck } from 'lucide-react-native';
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
import { COLORS } from '@/constants/theme';

type NotificationFilter =
  | 'ALL'
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'ORDER_ISSUE'
  | 'PROMOTION'
  | 'SYSTEM';

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ORDER_STATUS', label: 'Đơn hàng' },
  { value: 'PAYMENT', label: 'Thanh toán' },
  { value: 'ORDER_ISSUE', label: 'Đổi trả' },
  { value: 'PROMOTION', label: 'Khuyến mãi' },
  { value: 'SYSTEM', label: 'Hệ thống' },
];

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

/** Khối trạng thái rỗng / lỗi giống AccountStatePanel của web. */
function StatePanel({
  title,
  description,
  tone = 'default',
  action,
}: {
  title: string;
  description: string;
  tone?: 'default' | 'error';
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      className="items-center rounded-subtle border border-landing-line bg-ivory/60 px-6 py-14"
    >
      <Text
        className={`text-center font-display text-[24px] leading-tight ${
          tone === 'error' ? 'text-danger' : 'text-landing-obsidian'
        }`}
      >
        {title}
      </Text>
      <Text className="mt-2 max-w-error-state text-center font-sans text-body-sm leading-relaxed text-landing-muted">
        {description}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          className="mt-6 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
        >
          <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function NotificationsSkeleton() {
  return (
    <View
      accessibilityLabel="Đang tải thông báo"
      className="mx-lg rounded-subtle border border-landing-line"
    >
      {[0, 1, 2, 3].map((key) => (
        <View
          key={key}
          className={`flex-row gap-4 px-4 py-4 ${key < 3 ? 'border-b border-landing-line/70' : ''}`}
        >
          <View className="h-9 w-9 bg-taupe/40" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-1/3 bg-taupe/40" />
            <View className="h-3 w-2/3 bg-taupe/30" />
          </View>
        </View>
      ))}
    </View>
  );
}

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
  const { data: unreadData, refetch: refetchUnread } = useUnreadCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const items = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta?.total ?? items.length;
  const unreadCount = unreadData?.unread ?? 0;
  const hasUnread = unreadCount > 0 || items.some((item) => !item.isRead);
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

  const showErrorState = isError && items.length === 0;

  const header = (
    <View className="gap-4 pb-4">
      <View className="gap-2 border-b border-landing-line px-lg pb-5 pt-lg">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="-ml-1 min-h-11 flex-row items-center gap-1.5 self-start active:opacity-70"
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
          className="font-display text-[30px] leading-tight text-landing-obsidian"
        >
          Thông báo
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          Cập nhật về đơn hàng, thanh toán và ưu đãi. Bấm vào một thông báo để mở nơi liên quan.
        </Text>
        {hasUnread ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đánh dấu đã đọc hết"
            accessibilityState={{ disabled: isMarkingAll }}
            disabled={isMarkingAll}
            onPress={() => markAllRead()}
            className={`mt-3 h-11 flex-row items-center justify-center gap-2 self-start rounded-subtle border border-landing-line px-5 active:opacity-70 ${
              isMarkingAll ? 'opacity-50' : ''
            }`}
          >
            <CheckCheck size={16} strokeWidth={1.75} color={COLORS.obsidian} />
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>
              {isMarkingAll ? 'Đang xử lý' : 'Đánh dấu đã đọc hết'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* GET /notifications chưa lọc theo loại; bộ lọc ở đây lọc trên các trang đã tải. */}
      <View className="border-b border-landing-line">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-5 px-lg"
        >
          {FILTERS.map(({ value, label }) => {
            const selected = filter === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(value)}
                className={`h-11 flex-row items-center border-b-2 ${
                  selected ? 'border-oxblood' : 'border-transparent'
                }`}
              >
                <Text
                  className={`font-sans text-[13px] ${
                    selected ? 'font-medium text-oxblood' : 'text-landing-muted'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!isLoading && !showErrorState && items.length > 0 ? (
        <Text className="px-lg font-sans text-[12px] text-landing-muted">
          <Text className="font-mono text-landing-obsidian">{total}</Text> thông báo
          {unreadCount > 0 ? (
            <>
              {' · '}
              <Text className="font-mono text-oxblood">{unreadCount}</Text> chưa đọc
            </>
          ) : null}
        </Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return <NotificationsSkeleton />;
    if (showErrorState) {
      return (
        <View className="px-lg">
          <StatePanel
            tone="error"
            title="Không tải được thông báo"
            description="Kiểm tra kết nối rồi thử lại."
            action={{ label: 'Thử lại', onPress: handleRefresh }}
          />
        </View>
      );
    }
    return (
      <View className="px-lg">
        <StatePanel
          title={
            filter === 'ALL' ? 'Chưa có thông báo nào' : 'Không có thông báo nào trong mục này'
          }
          description={
            hasNextPage
              ? 'Kéo xuống để tải thêm hoặc thử lại sau.'
              : 'Khi đơn hàng, thanh toán hoặc ưu đãi có cập nhật, thông báo sẽ xuất hiện ở đây.'
          }
          action={hasNextPage ? { label: 'Tải thêm', onPress: () => fetchNextPage() } : undefined}
        />
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-landing-paper">
      <FlatList
        data={isLoading || showErrorState ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View
            className={`mx-lg border-x border-b border-landing-line ${
              index === 0 ? 'rounded-t-subtle border-t' : ''
            } ${index === filtered.length - 1 ? 'rounded-b-subtle' : ''}`}
          >
            <NotificationItem item={item} onPress={handlePressItem} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          <View className="items-center">
            {isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
              </View>
            ) : null}
            <View className="h-24" />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
