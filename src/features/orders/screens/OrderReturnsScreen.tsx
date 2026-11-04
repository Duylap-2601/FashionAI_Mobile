import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';
import { RootStackParamList } from '@/navigation/types';
import { useOrder, useOrderIssues } from '../hooks/use-orders';
import { OrderIssuesList } from '../components/OrderIssuesList';
import {
  NoticeText,
  OrderNotice,
  OrderRefundLines,
  RefundAccount,
  ReturnHistoryTimeline,
} from '../components/OrderReturnParts';
import { ReportIssueModal, type ReportableOrderItem } from '../components/ReportIssueModal';
import type { IOrderReturnsView } from '../types/order';
import {
  RETURN_FLOW_TITLES,
  canReportRefundNotReceived,
  hasOpenRefundNotReceivedIssue,
  isReturnFlowStatus,
  isReturnHistoryEvent,
  toVnd,
} from '../utils/order-returns';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderReturns'>;

const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';
const CARD_CLASS = 'mt-4 rounded-subtle border border-landing-line bg-ivory p-4';

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 items-center justify-center self-start rounded-subtle border border-landing-line px-4 active:opacity-70"
    >
      <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>{label}</Text>
    </Pressable>
  );
}

function AmountRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4 py-1">
      <Text className={`font-sans text-[12px] ${strong ? 'font-semibold text-landing-obsidian' : 'text-landing-muted'}`}>
        {label}
      </Text>
      <Text className={`shrink-0 font-mono ${strong ? 'text-[15px] text-oxblood' : 'text-[12px] text-landing-obsidian'}`}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

/**
 * Đổi trả & hoàn tiền của một đơn: hướng dẫn gửi hàng về, các yêu cầu báo lỗi, các khoản
 * hoàn (tiền hàng, phí ship) kèm chứng từ, báo chưa nhận được tiền và lịch sử đổi trả.
 */
export function OrderReturnsScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const orderQuery = useOrder(orderId);
  const order: IOrderReturnsView | undefined = orderQuery.order;
  const { issues, refetch: refetchIssues } = useOrderIssues(orderId);
  const [reportingItem, setReportingItem] = useState<ReportableOrderItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const goToAllReturns = () => navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'Returns' } });
  const goToOrder = () => navigation.navigate('OrderDetail', { orderId });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([orderQuery.refetch(), refetchIssues()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (orderQuery.isLoading) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={COLORS.oxblood} />
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Đang tải đổi trả
          </Text>
        </View>
      </View>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
            Không tìm thấy đơn hàng
          </Text>
          <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Đơn này không tồn tại hoặc không thuộc tài khoản của bạn.
          </Text>
          <OutlineButton label="Xem đổi trả của tôi" onPress={goToAllReturns} />
        </View>
      </View>
    );
  }

  const status = String(order.status || 'CREATED').toUpperCase();
  const orderCode = `ORD-${order.orderNumber || order.orderCode || order.id}`;
  const refunds = order.refunds ?? [];
  const hasReturns = issues.length > 0 || refunds.length > 0;
  const isInReturnFlow = isReturnFlowStatus(status);
  const pendingNotReceived = hasOpenRefundNotReceivedIssue(issues);
  const canReportNotReceived = canReportRefundNotReceived(order);
  const paidVnd = toVnd(order.amountPaidVnd);
  const refundedVnd = toVnd(order.amountRefundedVnd);
  const returnEvents = (order.history ?? []).filter(isReturnHistoryEvent);

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.oxblood} />
        }
      >
        <View className="pt-4">
          <BackButton onPress={() => navigation.goBack()} label="Quay lại" />
        </View>

        <View className="mt-4 border-b border-landing-line pb-5">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
            Tài khoản
          </Text>
          <Text accessibilityRole="header" className="mt-2 font-display text-[30px] leading-tight text-landing-obsidian">
            Đổi trả & hoàn tiền
          </Text>
          <Text className="mt-2 font-sans text-[12px] text-landing-muted">
            Đơn <Text className="font-mono text-landing-obsidian">{orderCode}</Text> · Đặt lúc{' '}
            <Text className="font-mono">{formatDateTime(order.createdAt)}</Text>
          </Text>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <OutlineButton label="Xem đơn hàng" onPress={goToOrder} />
          <OutlineButton label="Tất cả đổi trả" onPress={goToAllReturns} />
        </View>

        {isInReturnFlow ? (
          <View className="mt-4">
            <OrderNotice title={RETURN_FLOW_TITLES[status]}>
              <NoticeText>
                Vui lòng gửi hàng về cửa hàng. Sau khi nhận và kiểm tra, shop sẽ chuyển khoản hoàn tiền vào tài khoản
                bạn đã cung cấp.
              </NoticeText>
              <RefundAccount order={order} />
            </OrderNotice>
          </View>
        ) : null}

        {status === 'RETURNED' ? (
          <View className="mt-4">
            <OrderNotice
              tone={order.refundStatus === 'COMPLETED' ? 'done' : 'attention'}
              title="Đơn hàng đã được hoàn trả"
            >
              <NoticeText>
                {order.refundStatus === 'COMPLETED'
                  ? 'Shop đã chuyển khoản hoàn tiền cho bạn. Chứng từ chuyển khoản nằm ở mục Hoàn tiền.'
                  : 'Shop đang xử lý hoàn tiền cho đơn này. Kiểm tra tài khoản hoặc liên hệ hỗ trợ nếu cần.'}
              </NoticeText>
              <RefundAccount order={order} />
              {canReportNotReceived ? (
                pendingNotReceived ? (
                  <NoticeText>Bạn đã báo chưa nhận được tiền. Trạng thái xử lý nằm ở mục Yêu cầu bên dưới.</NoticeText>
                ) : (
                  <OutlineButton
                    label="Chưa nhận được tiền hoàn"
                    onPress={() => setReportingItem(order.items?.[0] ?? null)}
                  />
                )
              ) : null}
            </OrderNotice>
          </View>
        ) : null}

        {!hasReturns ? (
          <View className={CARD_CLASS}>
            <Text className="font-display text-[18px] leading-snug text-landing-obsidian">
              Đơn này chưa có yêu cầu đổi trả
            </Text>
            <Text className="mt-2 font-sans text-[12.5px] leading-relaxed text-landing-muted">
              Nếu sản phẩm may sai số đo, sai màu / sai mẫu hoặc có lỗi, bạn có 7 ngày kể từ khi đơn hoàn tất để báo lỗi
              ở trang đơn hàng.
            </Text>
            <View className="mt-3">
              <OutlineButton label="Xem đơn hàng" onPress={goToOrder} />
            </View>
          </View>
        ) : (
          <>
            {issues.length > 0 ? (
              <View className={CARD_CLASS}>
                <Text className={LABEL_CLASS}>Yêu cầu</Text>
                <OrderIssuesList orderId={orderId} />
              </View>
            ) : null}

            <View className={CARD_CLASS}>
              <Text className="font-display text-[20px] leading-tight text-landing-obsidian">Hoàn tiền</Text>
              <Text className="mt-1 font-sans text-[12px] text-landing-muted">
                Các khoản shop chuyển khoản hoàn cho đơn này.
              </Text>
              <View className="mt-3">
                {refunds.length > 0 ? (
                  <OrderRefundLines order={order} />
                ) : (
                  <Text className="font-sans text-[13px] leading-relaxed text-landing-muted">
                    Shop chưa ghi nhận khoản hoàn nào. Khoản hoàn hiện ở đây khi yêu cầu được duyệt.
                  </Text>
                )}
              </View>
              <View className="mt-4 border-t border-landing-line/60 pt-3">
                <AmountRow label="Đã thanh toán" value={paidVnd} />
                <AmountRow label="Đã hoàn" value={refundedVnd} strong />
              </View>
            </View>

            <View className={CARD_CLASS}>
              <Text className="font-display text-[20px] leading-tight text-landing-obsidian">Lịch sử đổi trả</Text>
              <View className="mt-3">
                <ReturnHistoryTimeline events={returnEvents} emptyText="Chưa có cập nhật đổi trả." />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ReportIssueModal
        visible={!!reportingItem}
        onClose={() => setReportingItem(null)}
        orderId={orderId}
        orderItem={reportingItem}
        mode="REFUND_NOT_RECEIVED"
        defaultBank={{
          bankName: order.refundBankName,
          accountNumber: order.refundAccountNumber,
          accountHolder: order.refundAccountHolder,
        }}
      />
    </View>
  );
}
