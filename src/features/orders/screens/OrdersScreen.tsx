import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Check, ChevronDown, ChevronUp, Copy, Package, Search, X } from 'lucide-react-native';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useDebouncedValue } from '@/features/products/hooks/use-debounced-value';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { formatDate, formatDateTime } from '@/utils/date';
import { useInfiniteOrders, useCancelOrder, useConfirmDelivery } from '../hooks/use-orders';
import { ToneLabel } from '../components/ToneLabel';
import { getOrderItemImage, getOrderItemName } from '../utils/order-items';
import { RETURN_HISTORY_STATUSES } from '../utils/order-returns';
import { getCarrierLabel } from '../utils/order-shipping';
import { ORDER_STATUS_CONFIG } from '../utils/order-status';

// Mỗi tab là một trạng thái BE lọc được (GET /orders?status=), giống trang Đơn hàng trên web.
const FILTER_TABS: { id: string; label: string; status?: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán', status: 'CREATED' },
  { id: 'measurement', label: 'Duyệt số đo', status: 'MEASUREMENT_REVIEW' },
  { id: 'tailoring', label: 'Đang may', status: 'TAILORING' },
  { id: 'ready_to_ship', label: 'Chờ giao', status: 'READY_TO_SHIP' },
  { id: 'shipping', label: 'Đang giao', status: 'SHIPPING' },
  { id: 'delivered', label: 'Đã giao', status: 'DELIVERED' },
  { id: 'completed', label: 'Hoàn tất', status: 'COMPLETED' },
  { id: 'cancelled', label: 'Đã hủy', status: 'CANCELLED' },
];

const SEARCH_DEBOUNCE_MS = 400;

const STEPS = ['Đã đặt', 'Duyệt số đo', 'Đang may', 'Đang giao', 'Giao xong'] as const;

const STATUS_CONFIG = ORDER_STATUS_CONFIG;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  ZALOPAY: 'ZaloPay',
  BANK_TRANSFER: 'Chuyển khoản',
  BANK: 'Chuyển khoản',
  SEPAY: 'Chuyển khoản',
  MOMO: 'MoMo',
  WALLET: 'Ví FashionAI',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  EXPIRED: 'Hết hạn thanh toán',
  REFUND_REQUIRED: 'Cần hoàn tiền',
  REFUND_PENDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn một phần',
  COD_COLLECTED: 'Đã thu khi giao',
};

const LABEL_CLASS =
  'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const CARD_ACTION_CLASS = 'h-11 items-center justify-center rounded-subtle px-3';
const CARD_ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

// expo-image không nhận className (chưa cssInterop), nên kích thước ảnh dùng style.
const THUMB_STYLE = { width: 48, height: 64 } as const;

function fmtPrice(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function getOrderCode(order: any): string {
  return `ORD-${order?.orderCode || order?.orderNumber || order?.id}`;
}

function getItems(order: any): any[] {
  return Array.isArray(order?.items) ? order.items : [];
}

function getItemCount(items: any[]): number {
  return items.reduce((sum, item) => sum + (item?.quantity || 1), 0);
}

function StepProgress({ step }: { step: number }) {
  return (
    <View className="flex-row gap-1.5">
      {STEPS.map((label, index) => {
        const isDone = index <= step;
        const isCurrent = index === step;

        return (
          <View key={label} className="flex-1 gap-1.5">
            <View className={`h-[2px] w-full ${isDone ? 'bg-oxblood' : 'bg-taupe'}`} />
            <Text
              numberOfLines={2}
              className={`font-sans text-[10px] leading-snug ${
                isCurrent
                  ? 'font-semibold text-oxblood'
                  : isDone
                    ? 'text-landing-obsidian'
                    : 'text-landing-muted'
              }`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  if (strong) {
    return (
      <View className="mt-1 flex-row items-baseline justify-between gap-4 border-t border-landing-line pt-2.5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
          {label}
        </Text>
        <Text className="shrink-0 text-right font-mono text-[15px] text-oxblood">{value}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-baseline justify-between gap-4 py-1">
      <Text className="font-sans text-[12px] text-landing-muted">{label}</Text>
      <Text className="shrink-0 text-right font-mono text-[12px] text-landing-obsidian">
        {value}
      </Text>
    </View>
  );
}

function OrderNote({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-2 border-l-2 border-brass bg-landing-paper/60 px-3 py-2">
      {children}
    </View>
  );
}

function OrdersSkeleton() {
  return (
    <View className="gap-md">
      {[0, 1, 2].map((key) => (
        <View key={key} className="gap-3 rounded-subtle border border-landing-line bg-ivory p-4">
          <View className="h-3 w-1/2 bg-taupe" />
          <View className="h-2.5 w-1/4 bg-taupe" />
          <View className="flex-row items-center gap-3">
            <View className="h-16 w-12 bg-taupe" />
            <View className="flex-1 gap-2">
              <View className="h-3 w-2/3 bg-taupe" />
              <View className="h-2.5 w-1/3 bg-taupe" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function CancelOrderModal({
  order,
  onClose,
  onConfirm,
  isPending,
  errorMessage,
}: {
  order: any | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={order !== null}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng hộp thoại hủy đơn"
          onPress={onClose}
          className="absolute inset-0 bg-landing-obsidian/45"
        />

        <View
          className="w-full max-w-[420px] self-center border-t border-landing-line bg-landing-paper px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="flex-row items-start justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="flex-1 font-display text-[24px] leading-tight text-landing-obsidian"
            >
              Hủy đơn hàng?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
            >
              <X size={18} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>
          </View>

          <Text className="mt-3 font-sans text-body-md leading-relaxed text-landing-muted">
            Đơn <Text className="font-mono text-landing-obsidian">{order ? getOrderCode(order) : ''}</Text>{' '}
            chưa thanh toán sẽ bị hủy và không khôi phục được.
          </Text>

          {errorMessage ? (
            <Text className="mt-3 font-sans text-[12px] leading-relaxed text-danger">
              {errorMessage}
            </Text>
          ) : null}

          <View className="mt-6 gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hủy đơn hàng"
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={onConfirm}
              className="h-11 items-center justify-center rounded-subtle border border-danger/40 active:opacity-70 disabled:opacity-60"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-danger">
                {isPending ? 'Đang hủy…' : 'Hủy đơn'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Giữ lại đơn hàng"
              onPress={onClose}
              className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Giữ lại
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { addItem } = useCart();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const activeTab = FILTER_TABS.find((tab) => tab.id === activeFilter) ?? FILTER_TABS[0];

  const {
    orders,
    total,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOrders({ status: activeTab.status, search: debouncedSearch || undefined });
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();

  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isFiltered = activeTab.status !== undefined || debouncedSearch.length > 0;

  const toggleExpand = (id: string | number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyCode = async (orderCode: string, id: string | number) => {
    await Clipboard.setStringAsync(orderCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleReorder = (order: any) => {
    const items = getItems(order);
    if (items.length === 0) return;

    items.forEach((item: any) => {
      addItem({
        productId: item.productId || item.id,
        productName: getOrderItemName(item),
        price: item.price || 0,
        quantity: item.quantity || 1,
        color: item.color || undefined,
        imageUrl: getOrderItemImage(item),
      });
    });

    Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng.', [
      { text: 'Tiếp tục xem', style: 'cancel' },
      { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleCancel = (order: any) => {
    setCancelError(null);
    setCancelTarget(order);
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    setCancelError(null);
    cancelOrder(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
      onError: () => setCancelError('Không thể hủy đơn hàng lúc này. Vui lòng thử lại.'),
    });
  };

  // Hỏi lại trước khi xác nhận, vì xác nhận xong đơn chuyển sang hoàn tất.
  const handleConfirmDelivery = (order: any) => {
    Alert.alert(
      'Đã nhận hàng?',
      `Bạn xác nhận đã nhận kiện hàng của đơn ${getOrderCode(order)} và hàng hóa đang ở trạng thái tốt.`,
      [
        { text: 'Chưa', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () =>
            confirmDelivery(
              { id: order.id },
              {
                onSuccess: () => Alert.alert('Thành công', 'Cảm ơn bạn đã xác nhận đã nhận hàng!'),
                onError: () => Alert.alert('Lỗi', 'Chưa thể xác nhận nhận hàng lúc này.'),
              },
            ),
        },
      ],
    );
  };

  const renderOrderCard = (order: any) => {
    const rawStatus = (order.status || 'PENDING').toUpperCase();
    const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.PENDING;
    const carrierLabel = getCarrierLabel(order);

    const orderCode = getOrderCode(order);
    const total = order.totalVnd ?? order.totalAmount ?? order.total ?? 0;
    const isExpanded = expandedOrders.has(order.id);
    const isCopied = copiedId === order.id;

    const items = getItems(order);
    const firstItem = items[0];
    const itemCount = getItemCount(items);

    const isAwaitingPayment = rawStatus === 'CREATED' && order.paymentStatus === 'PENDING';

    const address = [
      order.shippingInfo?.address || order.shippingAddress?.address || order.shippingAddress?.addressLine,
      order.shippingInfo?.wardName || order.shippingAddress?.wardName,
      order.shippingInfo?.provinceName || order.shippingAddress?.provinceName,
    ]
      .filter(Boolean)
      .join(', ');
    const recipient =
      order.shippingInfo?.name || order.shippingAddress?.name || order.shippingAddress?.fullName;
    const phone = order.shippingInfo?.phone || order.shippingAddress?.phone;

    const shippingFee = order.shippingFeeVnd ?? order.shippingFee ?? 0;
    const discount = order.discountVnd ?? order.discountAmount ?? order.discount ?? 0;

    const paymentMethodLabel =
      PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || 'Chuyển khoản';
    const paymentStatusLabel =
      PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || 'Chờ thanh toán';

    const latestMessage =
      order.history && order.history.length > 0
        ? order.history[order.history.length - 1]?.publicMessage ||
          order.history[order.history.length - 1]?.toStatus
        : rawStatus === 'PENDING' || rawStatus === 'CREATED' || rawStatus === 'PENDING_PAYMENT'
          ? 'Đơn hàng đã được tạo và đang chờ thanh toán.'
          : rawStatus === 'CANCELLED'
            ? 'Đơn hàng đã bị hủy.'
            : rawStatus === 'EXPIRED'
              ? 'Đơn hàng đã hết hạn thanh toán.'
              : 'Đơn hàng đang được xử lý.';

    return (
      <View className="gap-3 rounded-subtle border border-landing-line bg-ivory p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-row items-center gap-1">
            <Text
              numberOfLines={1}
              className="shrink font-mono text-[13px] tracking-[0.02em] text-landing-obsidian"
            >
              {orderCode}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isCopied ? 'Đã sao chép mã đơn' : 'Sao chép mã đơn hàng'}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => handleCopyCode(orderCode, order.id)}
              className="h-8 w-8 items-center justify-center active:opacity-60"
            >
              {isCopied ? (
                <Check size={13} strokeWidth={2} color={COLORS.sageInk} />
              ) : (
                <Copy size={13} strokeWidth={1.75} color={COLORS.muted} />
              )}
            </Pressable>
          </View>

          <Text
            numberOfLines={1}
            className="shrink-0 text-right font-mono text-[11px] uppercase tracking-[0.1em] text-landing-muted"
          >
            Đặt ngày {formatDate(order.createdAt)}
          </Text>
        </View>

        <View className="gap-1">
          <ToneLabel tone={config.tone} label={config.label} />
          {carrierLabel ? (
            <Text className="font-sans text-[12px] text-landing-muted">Vận chuyển: {carrierLabel}</Text>
          ) : null}
        </View>

        <View className="flex-row items-start gap-3">
          <View className="h-16 w-12 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
            <Image source={{ uri: getOrderItemImage(firstItem) }} style={THUMB_STYLE} contentFit="cover" />
          </View>

          <View className="min-w-0 flex-1 gap-1">
            <Text
              numberOfLines={1}
              className="font-sans text-[13.5px] leading-snug text-landing-obsidian"
            >
              {firstItem ? getOrderItemName(firstItem) : 'Đơn may đo'}
            </Text>
            <Text className="font-sans text-[12px] text-landing-muted">
              {items.length > 1 ? `và ${items.length - 1} món khác · ` : ''}
              {itemCount} sản phẩm
            </Text>
            <Text className="font-mono text-[15px] text-landing-obsidian">{fmtPrice(total)}</Text>
          </View>
        </View>

        {isAwaitingPayment ? (
          <OrderNote>
            <Text className="flex-1 font-sans text-[12px] leading-relaxed text-landing-obsidian">
              Đơn đang chờ thanh toán
              {order.paymentDueAt ? (
                <>
                  , hạn <Text className="font-mono">{formatDateTime(order.paymentDueAt)}</Text>
                </>
              ) : null}
              .
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thanh toán đơn ${orderCode}`}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              className="min-h-11 justify-center active:opacity-60"
            >
              <Text className={`${CARD_ACTION_LABEL_CLASS} text-oxblood`}>Thanh toán</Text>
            </Pressable>
          </OrderNote>
        ) : null}

        {order.allowedActions?.updateMeasurement ? (
          <OrderNote>
            <Text className="flex-1 font-sans text-[12px] leading-relaxed text-landing-obsidian">
              Shop cần bạn xem lại số đo cho đơn này.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mở đơn ${orderCode} để xem lại số đo`}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              className="min-h-11 justify-center active:opacity-60"
            >
              <Text className={`${CARD_ACTION_LABEL_CLASS} text-oxblood`}>Mở đơn</Text>
            </Pressable>
          </OrderNote>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Thu gọn chi tiết đơn hàng' : 'Xem chi tiết đơn hàng'}
          accessibilityState={{ expanded: isExpanded }}
          onPress={() => toggleExpand(order.id)}
          className="h-11 flex-row items-center border-t border-landing-line active:opacity-70"
        >
          <View className="flex-row items-center gap-1.5">
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
              {isExpanded ? 'Thu gọn' : 'Chi tiết'}
            </Text>
            {isExpanded ? (
              <ChevronUp size={14} strokeWidth={1.75} color={COLORS.muted} />
            ) : (
              <ChevronDown size={14} strokeWidth={1.75} color={COLORS.muted} />
            )}
          </View>
        </Pressable>

        <View className="flex-row flex-wrap items-center gap-2">
          {order.allowedActions?.confirmDelivery ? (
            <Pressable
              accessibilityRole="button"
              disabled={isConfirmingDelivery}
              onPress={() => handleConfirmDelivery(order)}
              className={`${CARD_ACTION_CLASS} bg-oxblood active:opacity-90 disabled:opacity-60`}
            >
              <Text className={`${CARD_ACTION_LABEL_CLASS} text-landing-paper`}>
                {isConfirmingDelivery ? 'Đang xác nhận…' : 'Đã nhận hàng'}
              </Text>
            </Pressable>
          ) : null}

          {order.allowedActions?.cancel ? (
            <Pressable
              accessibilityRole="button"
              disabled={isCancelling}
              onPress={() => handleCancel(order)}
              className={`${CARD_ACTION_CLASS} border border-danger/40 active:opacity-70 disabled:opacity-60`}
            >
              <Text className={`${CARD_ACTION_LABEL_CLASS} text-danger`}>Hủy đơn</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => handleReorder(order)}
            className={`${CARD_ACTION_CLASS} border border-landing-line active:opacity-70`}
          >
            <Text className={`${CARD_ACTION_LABEL_CLASS} text-landing-obsidian`}>Mua lại</Text>
          </Pressable>

          {RETURN_HISTORY_STATUSES.includes(rawStatus) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Đổi trả đơn ${orderCode}`}
              onPress={() => navigation.navigate('OrderReturns', { orderId: order.id })}
              className={`${CARD_ACTION_CLASS} border border-landing-line active:opacity-70`}
            >
              <Text className={`${CARD_ACTION_LABEL_CLASS} text-landing-obsidian`}>Đổi trả</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            className={`${CARD_ACTION_CLASS} border border-landing-line active:opacity-70`}
          >
            <Text className={`${CARD_ACTION_LABEL_CLASS} text-landing-obsidian`}>Xem đơn</Text>
          </Pressable>
        </View>

        {isExpanded ? (
          <View className="gap-4 border-t border-landing-line pt-4">
            {config.step >= 0 ? <StepProgress step={config.step} /> : null}

            <View className="gap-2">
              <Text className={LABEL_CLASS}>Sản phẩm</Text>
              <View className="gap-3">
                {items.map((item: any, itemIdx: number) => {
                  const lineTotal = (item.price || 0) * (item.quantity || 1);

                  return (
                    <View key={item.id || itemIdx} className="flex-row items-center gap-3">
                      <View className="h-16 w-12 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
                        <Image source={{ uri: getOrderItemImage(item) }} style={THUMB_STYLE} contentFit="cover" />
                      </View>
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text
                          numberOfLines={2}
                          className="font-sans text-[13px] leading-snug text-landing-obsidian"
                        >
                          {getOrderItemName(item)}
                        </Text>
                        <Text className="font-sans text-[11.5px] text-landing-muted">
                          Màu: {item.color || 'Mặc định'} · May đo · SL {item.quantity || 1}
                        </Text>
                      </View>
                      <Text className="shrink-0 text-right font-mono text-[12.5px] text-landing-obsidian">
                        {fmtPrice(lineTotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className={LABEL_CLASS}>Giao đến</Text>
              <View className="gap-1">
                {recipient ? (
                  <Text className="font-sans text-[13px] font-medium text-landing-obsidian">
                    {recipient}
                  </Text>
                ) : null}
                {phone ? <Text className="font-mono text-[12px] text-landing-obsidian">{phone}</Text> : null}
                <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
                  {address || 'Chưa có địa chỉ giao hàng'}
                </Text>
                {latestMessage ? (
                  <Text className="mt-1 font-sans text-[11.5px] leading-relaxed text-landing-muted">
                    Cập nhật mới nhất:{' '}
                    <Text className="text-landing-obsidian">{latestMessage}</Text>
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="gap-2">
              <Text className={LABEL_CLASS}>Thanh toán</Text>
              <View>
                <SummaryLine label="Phương thức" value={paymentMethodLabel} />
                <SummaryLine label="Trạng thái" value={paymentStatusLabel} />
                <SummaryLine label="Phí giao hàng" value={fmtPrice(shippingFee)} />
                {discount > 0 ? (
                  <SummaryLine label="Giảm giá" value={`-${fmtPrice(discount)}`} />
                ) : null}
                <SummaryLine label="Tổng cộng" value={fmtPrice(total)} strong />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  // Phần đầu là element (không phải component) để ô tìm kiếm không mất focus khi danh sách render lại.
  const listHeader = (
    <View>
      <BackButton onPress={() => navigation.goBack()} />

      <View className="mb-lg mt-4 gap-2.5 border-b border-landing-line pb-5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          Tài khoản
        </Text>
        <View className="flex-row items-end justify-between gap-3">
          <Text
            accessibilityRole="header"
            className="flex-1 font-display text-headline-lg text-landing-obsidian"
          >
            Đơn hàng
          </Text>
          {total !== undefined ? (
            <Text className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">
              {String(total).padStart(2, '0')} đơn
            </Text>
          ) : null}
        </View>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          Theo dõi đơn may đo từ lúc đặt, duyệt số đo, may cho tới khi giao.
        </Text>
      </View>

      <View className="mb-lg h-11 flex-row items-center rounded-subtle border border-landing-line bg-ivory px-3.5">
        <Search size={15} strokeWidth={1.75} color={COLORS.brassInk} />
        <TextInput
          placeholder="Tìm mã đơn, sản phẩm…"
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Tìm đơn hàng"
          returnKeyType="search"
          className="ml-2.5 flex-1 p-0 font-sans text-body-md text-landing-obsidian"
        />
        {search.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa từ khóa tìm kiếm"
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-8 w-8 items-center justify-center active:opacity-60"
          >
            <X size={15} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      <View className="-mx-4 mb-lg border-b border-landing-line">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-5 px-4"
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setActiveFilter(tab.id)}
                className={`h-11 flex-row items-center border-b-2 ${
                  isSelected ? 'border-oxblood' : 'border-transparent'
                }`}
              >
                <Text
                  className={`font-sans text-[13px] ${
                    isSelected ? 'font-medium text-oxblood' : 'text-landing-muted'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return <OrdersSkeleton />;
    if (isError) {
      return (
        <View className="items-center gap-4 rounded-subtle border border-landing-line bg-ivory px-6 py-12">
          <Text className="text-center font-display text-[20px] text-landing-obsidian">
            Không tải được đơn hàng
          </Text>
          <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Kiểm tra kết nối rồi thử lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => refetch()}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Thử lại
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View className="items-center gap-5 rounded-subtle border border-dashed border-taupe bg-ivory px-6 py-14">
        <View className="h-16 w-16 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper">
          <Package size={24} strokeWidth={1.5} color={COLORS.oxblood} />
        </View>
        <View className="gap-2">
          <Text className="text-center font-display text-[20px] text-landing-obsidian">
            {isFiltered ? 'Không có đơn phù hợp' : 'Chưa có đơn hàng nào'}
          </Text>
          <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            {debouncedSearch
              ? 'Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.'
              : isFiltered
                ? 'Bạn chưa có đơn hàng nào trong mục này.'
                : 'Đơn may đo đầu tiên của bạn sẽ hiện ở đây.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
          className="h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
        >
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            Khám phá sản phẩm
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <FlatList
        data={orders}
        keyExtractor={(order: any) => String(order.id)}
        renderItem={({ item }) => renderOrderCard(item)}
        ItemSeparatorComponent={() => <View className="h-md" />}
        ListHeaderComponent={listHeader}
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
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
          />
        }
      />

      <CancelOrderModal
        order={cancelTarget}
        onClose={() => {
          setCancelError(null);
          setCancelTarget(null);
        }}
        onConfirm={confirmCancel}
        isPending={isCancelling}
        errorMessage={cancelError}
      />
    </View>
  );
}

export default OrdersScreen;
