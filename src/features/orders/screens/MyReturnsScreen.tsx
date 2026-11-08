import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';
import type { ProfileStackParamList, RootStackParamList } from '@/navigation/types';
import { useMyReturns } from '../hooks/use-orders';
import { ISSUE_STATUS } from '../components/OrderIssuesList';
import { ToneLabel } from '../components/ToneLabel';
import type { IMyReturnOrder } from '../types/order';
import { getOrderCode } from '../utils/order-format';
import { RETURN_STATUS_LABELS } from '../utils/order-returns';

type ReturnsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'Returns'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

function ReturnRow({ order, onOpen }: { order: IMyReturnOrder; onOpen: () => void }) {
  const latest = order.issues[0];
  // Đơn đang trong luồng trả hàng thì theo trạng thái đơn, còn lại theo yêu cầu mới nhất.
  const statusLabel = RETURN_STATUS_LABELS[order.status] ?? (latest ? ISSUE_STATUS[latest.status] : null);
  const itemNames = [
    ...new Set(order.issues.map((issue) => issue.orderItem?.productNameSnapshot).filter(Boolean)),
  ].join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem đổi trả đơn ${getOrderCode(order)}`}
      onPress={onOpen}
      className="gap-1.5 border-b border-landing-line/60 py-4 active:opacity-70"
    >
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Text className="font-mono text-[13px] text-landing-obsidian">{getOrderCode(order)}</Text>
        {statusLabel ? <ToneLabel tone={statusLabel.tone} label={statusLabel.label} /> : null}
      </View>
      {itemNames ? (
        <Text numberOfLines={1} className="font-sans text-[13px] text-landing-obsidian">
          {itemNames}
        </Text>
      ) : null}
      <Text className="font-sans text-[12px] text-landing-muted">
        <Text className="font-mono">{order.issues.length}</Text> yêu cầu · Cập nhật{' '}
        <Text className="font-mono">{formatDateTime(order.updatedAt)}</Text>
        {order.amountRefundedVnd > 0 ? (
          <>
            {' '}· Đã hoàn{' '}
            <Text className="font-mono text-landing-obsidian">{formatCurrency(order.amountRefundedVnd)}</Text>
          </>
        ) : null}
      </Text>
      <Text className={`${ACTION_LABEL_CLASS} mt-1 text-oxblood`}>Xem chi tiết</Text>
    </Pressable>
  );
}

/** Mọi đơn có yêu cầu báo lỗi, trả hàng hoặc hoàn tiền; mỗi dòng mở màn đổi trả của đơn. */
export function MyReturnsScreen() {
  const navigation = useNavigation<ReturnsNavigationProp>();
  const { orders, total, isLoading, isError, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyReturns();

  const header = (
    <View>
      <View className="pt-4">
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <View className="mt-4 border-b border-landing-line pb-5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          Tài khoản
        </Text>
        <Text accessibilityRole="header" className="mt-2 font-display text-[30px] leading-tight text-landing-obsidian">
          Đổi trả & hoàn tiền
        </Text>
        <Text className="mt-2 font-sans text-[12px] text-landing-muted">
          {orders.length > 0
            ? `${total ?? orders.length} đơn có yêu cầu báo lỗi, trả hàng hoặc hoàn tiền, mới cập nhật trước.`
            : 'Các đơn có yêu cầu báo lỗi, trả hàng hoặc hoàn tiền.'}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="items-center gap-3 py-16">
          <ActivityIndicator size="large" color={COLORS.oxblood} />
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Đang tải đổi trả
          </Text>
        </View>
      );
    }
    return (
      <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
        <Text className="font-display text-[18px] leading-snug text-landing-obsidian">
          {isError ? 'Chưa tải được danh sách đổi trả' : 'Chưa có yêu cầu đổi trả'}
        </Text>
        <Text className="mt-2 font-sans text-[12.5px] leading-relaxed text-landing-muted">
          {isError
            ? 'Vui lòng thử lại sau ít phút.'
            : 'Nếu sản phẩm may sai số đo, sai màu / sai mẫu hoặc có lỗi, bạn có 7 ngày kể từ khi đơn hoàn tất để báo lỗi ở trang đơn hàng.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isError ? 'Thử lại' : 'Xem đơn hàng'}
          onPress={() => (isError ? void refetch() : navigation.navigate('Orders'))}
          className="mt-3 h-11 items-center justify-center self-start rounded-subtle border border-landing-line px-4 active:opacity-70"
        >
          <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>{isError ? 'Thử lại' : 'Xem đơn hàng'}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => (
          <ReturnRow order={item} onOpen={() => navigation.navigate('OrderReturns', { orderId: item.id })} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color={COLORS.oxblood} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor={COLORS.oxblood}
          />
        }
        contentContainerClassName="px-4 pb-12"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
