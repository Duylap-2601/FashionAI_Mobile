import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Package,
  Search,
  X,
} from 'lucide-react-native';
import { useCart } from '@/features/cart/hooks/use-cart';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { useOrders, useCancelOrder, useConfirmDelivery } from '../hooks/use-orders';
import { formatDate, formatDateTime } from '@/utils/date';

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'measurement', label: 'Duyệt số đo' },
  { id: 'tailoring', label: 'Đang may' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
] as const;

const STEPS = ['Đã đặt', 'Duyệt số đo', 'Đang may', 'Đang giao', 'Giao xong'] as const;

type StatusTone = 'attention' | 'active' | 'done' | 'closed' | 'error';

const STATUS_TONE_CLASSES: Record<StatusTone, { dot: string; text: string }> = {
  attention: { dot: 'bg-brass', text: 'text-brass-ink' },
  active: { dot: 'bg-oxblood', text: 'text-landing-obsidian' },
  done: { dot: 'bg-sage', text: 'text-sage-ink' },
  closed: { dot: 'bg-taupe', text: 'text-landing-muted' },
  error: { dot: 'bg-danger', text: 'text-danger' },
};

const STATUS_CONFIG: Record<string, { label: string; tone: StatusTone; step: number }> = {
  CREATED: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PENDING: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PAID: { label: 'Đã thanh toán', tone: 'active', step: 0 },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'active', step: 0 },
  MEASUREMENT_REVIEW: { label: 'Đang duyệt số đo', tone: 'active', step: 1 },
  MEASUREMENT_CONFIRMED: { label: 'Đã chốt số đo', tone: 'active', step: 1 },
  PROCESSING: { label: 'Đang chuẩn bị', tone: 'active', step: 2 },
  TAILORING: { label: 'Đang may', tone: 'active', step: 2 },
  QUALITY_CHECK: { label: 'Kiểm tra chất lượng', tone: 'active', step: 2 },
  READY_TO_SHIP: { label: 'Chờ giao', tone: 'active', step: 3 },
  SHIPPING: { label: 'Đang giao', tone: 'active', step: 3 },
  DELIVERED: { label: 'Đã giao', tone: 'done', step: 3 },
  COMPLETED: { label: 'Hoàn tất', tone: 'done', step: 4 },
  CANCELLED: { label: 'Đã hủy', tone: 'closed', step: -1 },
  EXPIRED: { label: 'Hết hạn thanh toán', tone: 'closed', step: -1 },
  RETURNED: { label: 'Đã hoàn trả', tone: 'closed', step: -1 },
  RETURN_REQUESTED: { label: 'Yêu cầu hoàn trả', tone: 'attention', step: -1 },
  RETURN_APPROVED: { label: 'Đã duyệt hoàn trả', tone: 'attention', step: -1 },
  RETURNING: { label: 'Đang hoàn trả', tone: 'attention', step: -1 },
  FAILED: { label: 'Thanh toán thất bại', tone: 'error', step: -1 },
};

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

function fmtPrice(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function getProductImage(item: any): string {
  const fallback =
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop&auto=format';
  if (item?.productImageSnapshot) return item.productImageSnapshot;
  if (item?.imageUrl) return item.imageUrl;
  if (item?.product?.images) {
    try {
      const parsed =
        typeof item.product.images === 'string'
          ? JSON.parse(item.product.images)
          : item.product.images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') {
          return first.url || first.uri || first.imageUrl || fallback;
        }
      }
    } catch {}
  }
  return fallback;
}

function getOrderCode(order: any): string {
  return `ORD-${order?.orderCode || order?.orderNumber || order?.id}`;
}

function getItemName(item: any): string {
  return item?.product?.name || item?.productName || 'Sản phẩm công sở';
}

function getItems(order: any): any[] {
  return Array.isArray(order?.items) ? order.items : [];
}

function getItemCount(items: any[]): number {
  return items.reduce((sum, item) => sum + (item?.quantity || 1), 0);
}

function matchStatus(status: string | undefined, filterId: string): boolean {
  const s = (status || 'PENDING').toUpperCase();
  if (filterId === 'all') return true;
  if (filterId === 'pending') {
    return ['PENDING', 'PENDING_PAYMENT', 'CREATED'].includes(s);
  }
  if (filterId === 'measurement') {
    return ['MEASUREMENT_REVIEW', 'MEASUREMENT_CONFIRMED'].includes(s);
  }
  if (filterId === 'tailoring') {
    return [
      'PROCESSING',
      'TAILORING',
      'QUALITY_CHECK',
      'CONFIRMED',
      'PAID',
      'READY_TO_SHIP',
    ].includes(s);
  }
  if (filterId === 'shipping') return s === 'SHIPPING';
  if (filterId === 'completed') return s === 'DELIVERED' || s === 'COMPLETED';
  if (filterId === 'cancelled') {
    return [
      'CANCELLED',
      'EXPIRED',
      'FAILED',
      'RETURN_REQUESTED',
      'RETURN_APPROVED',
      'RETURNING',
      'RETURNED',
    ].includes(s);
  }
  return false;
}

function StatusLine({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const tone = STATUS_TONE_CLASSES[config.tone];

  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-1.5 w-1.5 shrink-0 ${tone.dot}`} />
      <Text className={`font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.text}`}>
        {config.label}
      </Text>
    </View>
  );
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

  const { orders: fetchedOrders, isLoading, isError, refetch } = useOrders();
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const allOrders = useMemo(
    () => (fetchedOrders && Array.isArray(fetchedOrders) ? fetchedOrders : []),
    [fetchedOrders],
  );

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FILTER_TABS.forEach((tab) => {
      counts[tab.id] = allOrders.filter((o: any) => matchStatus(o.status, tab.id)).length;
    });
    return counts;
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      const matchTab = matchStatus(order.status, activeFilter);

      const orderCode = getOrderCode(order);
      const searchTrimmed = search.trim().toLowerCase();
      const matchSearch =
        !searchTrimmed ||
        orderCode.toLowerCase().includes(searchTrimmed) ||
        (order.items || []).some((item: any) => {
          const name = item.product?.name || item.productName || '';
          return name.toLowerCase().includes(searchTrimmed);
        });

      return matchTab && matchSearch;
    });
  }, [allOrders, activeFilter, search]);

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
        productName: getItemName(item),
        price: item.price || 0,
        quantity: item.quantity || 1,
        color: item.color || undefined,
        imageUrl: getProductImage(item),
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

  const handleConfirmDelivery = (order: any) => {
    confirmDelivery(
      { id: order.id },
      {
        onSuccess: () => Alert.alert('Thành công', 'Cảm ơn bạn đã xác nhận đã nhận hàng!'),
        onError: () => Alert.alert('Lỗi', 'Chưa thể xác nhận nhận hàng lúc này.'),
      }
    );
  };

  const renderOrderCard = (order: any) => {
    const rawStatus = (order.status || 'PENDING').toUpperCase();
    const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.PENDING;

    const orderCode = getOrderCode(order);
    const total = order.totalVnd ?? order.totalAmount ?? order.total ?? 0;
    const isExpanded = expandedOrders.has(order.id);
    const isCopied = copiedId === order.id;

    const items = getItems(order);
    const firstItem = items[0];
    const itemCount = getItemCount(items);

    const isAwaitingPayment =
      ['PENDING', 'PENDING_PAYMENT', 'CREATED'].includes(rawStatus) && Boolean(order.paymentDueAt);

    const address =
      order.shippingInfo?.address ||
      order.shippingAddress?.address ||
      [
        order.shippingAddress?.address,
        order.shippingAddress?.wardName,
        order.shippingAddress?.districtName,
        order.shippingAddress?.provinceName,
      ]
        .filter(Boolean)
        .join(', ') ||
      'Thị trấn An Phú, Huyện An Phú, An Giang';

    const recipient =
      order.shippingInfo?.name ||
      order.shippingAddress?.name ||
      order.shippingAddress?.fullName ||
      'Khách hàng';

    const phone =
      order.shippingInfo?.phone ||
      order.shippingAddress?.phone ||
      '0912345678';

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

    const isCancellable = order.allowedActions?.cancel || rawStatus === 'PENDING';

    return (
      <View
        key={String(order.id)}
        className="gap-3 rounded-subtle border border-landing-line bg-ivory p-4"
      >
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

        <StatusLine status={rawStatus} />

        <View className="flex-row items-start gap-3">
          <View className="h-16 w-12 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
            <Image
              source={{ uri: getProductImage(firstItem) }}
              style={{ width: 48, height: 64 }}
              contentFit="cover"
            />
          </View>

          <View className="min-w-0 flex-1 gap-1">
            <Text
              numberOfLines={1}
              className="font-sans text-[13.5px] leading-snug text-landing-obsidian"
            >
              {firstItem ? getItemName(firstItem) : 'Đơn may đo'}
            </Text>
            <Text className="font-sans text-[12px] text-landing-muted">{itemCount} sản phẩm</Text>
            <Text className="font-mono text-[15px] text-landing-obsidian">{fmtPrice(total)}</Text>
          </View>
        </View>

        {isAwaitingPayment ? (
          <View className="flex-row items-center gap-2 border-l-2 border-brass bg-landing-paper/60 px-3 py-2">
            <Text className="flex-1 font-sans text-[12px] leading-relaxed text-landing-obsidian">
              Đơn đang chờ thanh toán, hạn{' '}
              <Text className="font-mono">{formatDateTime(order.paymentDueAt)}</Text>.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thanh toán đơn ${orderCode}`}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              className="min-h-11 justify-center active:opacity-60"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                Thanh toán
              </Text>
            </Pressable>
          </View>
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
              hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
              disabled={isConfirmingDelivery}
              onPress={() => handleConfirmDelivery(order)}
              className="h-9 items-center justify-center rounded-subtle bg-oxblood px-3 active:opacity-90 disabled:opacity-60"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                {isConfirmingDelivery ? 'Đang xác nhận…' : 'Đã nhận hàng'}
              </Text>
            </Pressable>
          ) : null}

          {isCancellable ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
              disabled={isCancelling}
              onPress={() => handleCancel(order)}
              className="h-9 items-center justify-center rounded-subtle border border-danger/40 px-3 active:opacity-70 disabled:opacity-60"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger">
                Hủy đơn
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
            onPress={() => handleReorder(order)}
            className="h-9 items-center justify-center rounded-subtle border border-landing-line px-3 active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Mua lại
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            className="h-9 items-center justify-center rounded-subtle border border-landing-line px-3 active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Xem đơn
            </Text>
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
                        <Image
                          source={{ uri: getProductImage(item) }}
                          style={{ width: 48, height: 64 }}
                          contentFit="cover"
                        />
                      </View>
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text
                          numberOfLines={2}
                          className="font-sans text-[13px] leading-snug text-landing-obsidian"
                        >
                          {getItemName(item)}
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
                <Text className="font-sans text-[13px] font-medium text-landing-obsidian">
                  {recipient}
                </Text>
                <Text className="font-mono text-[12px] text-landing-obsidian">{phone}</Text>
                <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
                  {address}
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

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
          />
        }
      >
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
            <Text className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">
              {String(filteredOrders.length).padStart(2, '0')} đơn
            </Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}>
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab.id;
              const count = tabCounts[tab.id] ?? 0;

              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveFilter(tab.id)}
                  className={`h-11 flex-row items-center gap-1.5 border-b-2 ${
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
                  <Text
                    className={`font-mono text-[10.5px] ${
                      isSelected ? 'text-oxblood' : 'text-landing-muted'
                    }`}
                  >
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {isLoading && allOrders.length === 0 ? (
          <OrdersSkeleton />
        ) : isError ? (
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
        ) : filteredOrders.length === 0 ? (
          <View className="items-center gap-5 rounded-subtle border border-dashed border-taupe bg-ivory px-6 py-14">
            <View className="h-16 w-16 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper">
              <Package size={24} strokeWidth={1.5} color={COLORS.oxblood} />
            </View>
            <View className="gap-2">
              <Text className="text-center font-display text-[20px] text-landing-obsidian">
                Chưa có đơn hàng nào
              </Text>
              <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                {search.trim()
                  ? 'Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.'
                  : 'Bạn chưa có đơn hàng nào trong danh mục này.'}
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
        ) : (
          <>
            <Text className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-landing-muted">
              <Text className="text-landing-obsidian">{filteredOrders.length}</Text> đơn
            </Text>
            <View className="gap-md">{filteredOrders.map((order: any) => renderOrderCard(order))}</View>
          </>
        )}
      </ScrollView>

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
