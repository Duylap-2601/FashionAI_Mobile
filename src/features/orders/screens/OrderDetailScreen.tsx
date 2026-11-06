import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { AlertTriangle, Check, ChevronLeft, Copy, ExternalLink, X } from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';
import { RootStackParamList } from '@/navigation/types';
import { useCart } from '@/features/cart/hooks/use-cart';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { useOrder, useCancelOrder, useConfirmDelivery, useOrderIssues } from '../hooks/use-orders';
import { ReportIssueModal, type ReportableOrderItem } from '../components/ReportIssueModal';
import { ISSUE_STATUS } from '../components/OrderIssuesList';
import { STATUS_TONE_CLASSES, ToneLabel, type StatusTone } from '../components/ToneLabel';
import type { OrderIssueStatus } from '../types/order';
import { getOrderItemImage, getOrderItemName } from '../utils/order-items';
import { getShippingLabel, getTransferContent } from '../utils/order-shipping';
import {
  RETURN_HISTORY_STATUSES,
  RETURN_STATUS_LABELS,
  canReportOrderIssue,
  getBlockedReportItemIds,
  toVnd,
} from '../utils/order-returns';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: StatusTone; step: number; description: string }
> = {
  CREATED: {
    label: 'Chờ thanh toán',
    tone: 'attention',
    step: 0,
    description: 'Shop bắt đầu may sau khi nhận được tiền.',
  },
  PENDING: {
    label: 'Chờ thanh toán',
    tone: 'attention',
    step: 0,
    description: 'Đơn đã được ghi nhận và đang chờ thanh toán.',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    tone: 'attention',
    step: 0,
    description: 'Đơn đã được ghi nhận và đang chờ thanh toán.',
  },
  PAID: {
    label: 'Đã thanh toán',
    tone: 'active',
    step: 0,
    description: 'Shop đã nhận tiền và chuẩn bị duyệt số đo.',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    tone: 'active',
    step: 1,
    description: 'Shop đã xác nhận đơn và số đo của bạn.',
  },
  MEASUREMENT_REVIEW: {
    label: 'Đang duyệt số đo',
    tone: 'active',
    step: 1,
    description: 'Kỹ thuật viên đang kiểm tra số đo trước khi cắt vải.',
  },
  MEASUREMENT_CONFIRMED: {
    label: 'Đã chốt số đo',
    tone: 'active',
    step: 1,
    description: 'Số đo đã chốt, đơn chuyển sang xưởng may.',
  },
  PROCESSING: {
    label: 'Đang chuẩn bị',
    tone: 'active',
    step: 2,
    description: 'Xưởng đang chuẩn bị vải và đường may cho đơn.',
  },
  TAILORING: {
    label: 'Đang may',
    tone: 'active',
    step: 2,
    description: 'Đơn đang được may theo số đo riêng của bạn.',
  },
  QUALITY_CHECK: {
    label: 'Kiểm tra chất lượng',
    tone: 'active',
    step: 2,
    description: 'Đơn đang được kiểm tra đường may trước khi giao.',
  },
  READY_TO_SHIP: {
    label: 'Chờ giao',
    tone: 'active',
    step: 3,
    description: 'Đơn đã đóng gói và chờ bàn giao vận chuyển.',
  },
  SHIPPING: {
    label: 'Đang giao',
    tone: 'active',
    step: 3,
    description: 'Kiện hàng đang trên đường tới bạn.',
  },
  DELIVERED: {
    label: 'Đã giao',
    tone: 'done',
    step: 3,
    description: 'Kiện hàng đã tới nơi, xác nhận khi bạn đã nhận.',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    tone: 'done',
    step: 4,
    description: 'Đơn may đo của bạn đã hoàn tất.',
  },
  CANCELLED: {
    label: 'Đã hủy',
    tone: 'closed',
    step: -1,
    description: 'Đơn đã hủy và không thể khôi phục.',
  },
  EXPIRED: {
    label: 'Hết hạn thanh toán',
    tone: 'closed',
    step: -1,
    description: 'Quá hạn thanh toán nên đơn đã tự hủy.',
  },
  RETURNED: {
    label: 'Đã hoàn trả',
    tone: 'closed',
    step: -1,
    description: 'Đơn đã được hoàn trả về cửa hàng.',
  },
  RETURN_REQUESTED: {
    label: 'Yêu cầu hoàn trả',
    tone: 'attention',
    step: -1,
    description: 'Shop đang xem xét yêu cầu hoàn trả.',
  },
  RETURN_APPROVED: {
    label: 'Đã duyệt hoàn trả',
    tone: 'attention',
    step: -1,
    description: 'Yêu cầu hoàn trả đã được duyệt.',
  },
  RETURNING: {
    label: 'Đang hoàn trả',
    tone: 'attention',
    step: -1,
    description: 'Hàng đang trên đường gửi về cửa hàng.',
  },
  FAILED: {
    label: 'Thanh toán thất bại',
    tone: 'error',
    step: -1,
    description: 'Thanh toán chưa hoàn tất, vui lòng thử lại.',
  },
  REFUND_PENDING: {
    label: 'Chờ hoàn tiền',
    tone: 'attention',
    step: -1,
    description: 'Shop đang chuyển khoản hoàn tiền cho bạn.',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    tone: 'done',
    step: -1,
    description: 'Tiền đã được hoàn về tài khoản của bạn.',
  },
};

const ORDER_STEPS = ['Đã đặt', 'Duyệt số đo', 'Đang may', 'Đang giao', 'Đã nhận'] as const;

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

const MEASUREMENT_FIELDS: { key: string; label: string }[] = [
  { key: 'height', label: 'Cao' },
  { key: 'shoulder', label: 'Vai' },
  { key: 'chest', label: 'Ngực' },
  { key: 'waist', label: 'Eo' },
  { key: 'hip', label: 'Hông' },
  { key: 'inseam', label: 'Dài quần' },
];

const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatClockDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

function getMeasurementRows(item: any): { key: string; label: string; value: string }[] {
  const snapshot = item?.measurementSnapshot ?? item?.measurements;
  if (!snapshot || typeof snapshot !== 'object') return [];

  const rows: { key: string; label: string; value: string }[] = [];
  for (const field of MEASUREMENT_FIELDS) {
    const raw =
      snapshot[field.key] ?? (field.key === 'hip' ? snapshot.hips : undefined) ?? undefined;
    if (raw === undefined || raw === null || raw === '') continue;
    const text = String(raw);
    rows.push({
      key: field.key,
      label: field.label,
      value: /cm/i.test(text) ? text : `${text} cm`,
    });
  }
  return rows;
}

function StepProgress({ step }: { step: number }) {
  return (
    <View className="flex-row gap-1.5">
      {ORDER_STEPS.map((label, index) => {
        const reached = index <= step;
        const isCurrent = index === step;

        return (
          <View key={label} className="flex-1 gap-1.5">
            <View className={`h-[2px] w-full ${reached ? 'bg-oxblood' : 'bg-taupe'}`} />
            <Text
              numberOfLines={2}
              className={`font-sans text-[10px] uppercase leading-snug tracking-[0.08em] ${
                isCurrent
                  ? 'font-semibold text-oxblood'
                  : reached
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

function SummaryRow({
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
        <Text className="shrink-0 text-right font-mono text-[20px] text-oxblood">{value}</Text>
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

function PaperActionSheet({
  visible,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  tone,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  tone: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng hộp thoại"
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
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={onClose}
              className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
            >
              <X size={18} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>
          </View>

          <View className="mt-3">{description}</View>

          <View className="mt-6 gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={onConfirm}
              className={`h-11 items-center justify-center rounded-subtle ${
                tone === 'danger'
                  ? 'border border-danger/40 active:opacity-70'
                  : 'bg-oxblood active:opacity-90'
              } disabled:opacity-60`}
            >
              <Text
                className={`${ACTION_LABEL_CLASS} ${
                  tone === 'danger' ? 'text-danger' : 'text-landing-paper'
                } tracking-[0.16em]`}
              >
                {isPending ? pendingLabel : confirmLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Giữ lại"
              disabled={isPending}
              onPress={onClose}
              className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
            >
              <Text className={`${ACTION_LABEL_CLASS} tracking-[0.16em] text-landing-obsidian`}>
                Giữ lại
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { order, isLoading, isError, refetch } = useOrder(orderId);
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();
  const { issues } = useOrderIssues(orderId);
  const { addItem } = useCart();

  const [copied, setCopied] = useState(false);
  const [reportingItem, setReportingItem] = useState<ReportableOrderItem | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { mutate: startPayment, isPending: isStartingPayment } = useMutation({
    mutationFn: (provider: string) => paymentsApi.checkout({ orderId, provider }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={COLORS.oxblood} />
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Đang tải đơn hàng
          </Text>
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
            Không tải được đơn hàng
          </Text>
          <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Đơn này có thể không còn tồn tại. Kiểm tra kết nối rồi thử lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử lại"
            onPress={() => void refetch()}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Thử lại
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const status = String(order.status || 'PENDING').toUpperCase();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const tone = STATUS_TONE_CLASSES[cfg.tone];
  const orderCode = `ORD-${order.orderNumber || order.orderCode || order.id}`;
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + (item?.quantity || 1), 0);

  const totalAmount = order.totalVnd ?? order.totalAmount ?? order.total ?? 0;
  const subtotal = order.itemsSubtotalVnd ?? order.subtotal ?? order.subtotalAmount ?? 0;
  const shippingFee = order.shippingFeeVnd ?? order.shippingFee ?? 0;
  const discount = order.discountVnd ?? order.discountAmount ?? order.discount ?? 0;
  const paidAmount =
    order.amountPaidVnd ?? order.amountPaid ?? order.paidAmount ?? order.paidAmountVnd ?? 0;
  const refundedAmount = toVnd(order.amountRefundedVnd);
  // Báo lỗi, trả hàng và hoàn tiền nằm ở màn riêng; màn đơn chỉ giữ thẻ tóm tắt.
  const hasReturns =
    issues.length > 0 || (order.refunds?.length ?? 0) > 0 || RETURN_HISTORY_STATUSES.includes(status);
  const returnsStatus =
    RETURN_STATUS_LABELS[status] ?? (issues[0] ? ISSUE_STATUS[issues[0].status as OrderIssueStatus] : null);

  const isPaid = order.isPaid === true;
  const isPendingPayment = ['PENDING', 'PENDING_PAYMENT', 'CREATED'].includes(status) && !isPaid;
  const paymentDueAt = order.paymentDueAt || order.paymentExpiresAt || order.paymentDeadline || '';
  // BE quyết định được hủy / xác nhận nhận hàng (allowedActions), như web.
  const isCancellable = order.allowedActions?.cancel === true;
  const canConfirmDelivery = order.allowedActions?.confirmDelivery === true;
  const shippingLabel = getShippingLabel(order);
  const transferContent = getTransferContent(order);
  // Khớp BE: chỉ báo lỗi khi đơn đã hoàn tất / đang hoàn trả và còn trong 7 ngày.
  const canReportIssue = canReportOrderIssue(order);
  const blockedReportItemIds = getBlockedReportItemIds(issues);

  const paymentMethodLabel =
    PAYMENT_METHOD_LABELS[String(order.paymentMethod || '')] ||
    order.paymentMethod ||
    'Chuyển khoản';
  const paymentStatusLabel =
    PAYMENT_STATUS_LABELS[String(order.paymentStatus || '')] ||
    order.paymentStatus ||
    (isPaid ? 'Đã thanh toán' : 'Chờ thanh toán');

  const trackingCode =
    order.trackingCode || order.currentShipment?.providerOrderCode || order.shipment?.trackingCode;
  const trackingUrl =
    order.trackingUrl || order.currentShipment?.trackingUrl || order.shipment?.trackingUrl;

  const rawHistory: any[] = Array.isArray(order.history) ? order.history : [];
  const newestHistory = rawHistory.length > 0 ? rawHistory[rawHistory.length - 1] : null;
  const latestTimestamp =
    newestHistory?.occurredAt ||
    newestHistory?.createdAt ||
    order.updatedAt ||
    order.createdAt;
  const latestMessage =
    newestHistory?.publicMessage ||
    newestHistory?.message ||
    newestHistory?.toStatus ||
    (status === 'CANCELLED'
      ? 'Đơn hàng đã bị hủy.'
      : isPendingPayment
        ? 'Đơn hàng đã được tạo và đang chờ thanh toán.'
        : 'Đơn hàng đang được xử lý.');

  const recipientName =
    order.shippingInfo?.name ||
    order.shippingAddress?.fullName ||
    order.shippingAddress?.name ||
    'Khách hàng';
  const recipientPhone = order.shippingInfo?.phone || order.shippingAddress?.phone || '';
  const recipientAddress =
    order.shippingInfo?.address ||
    [
      order.shippingAddress?.address || order.shippingAddress?.addressLine,
      order.shippingAddress?.wardName,
      order.shippingAddress?.provinceName,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Chưa có địa chỉ giao hàng';

  const history = [...rawHistory].reverse();
  const placedAt = formatClockDate(order.createdAt) || formatDateTime(order.createdAt);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePay = () => {
    setPaymentError(null);
    const provider =
      order.paymentProvider === 'SEPAY' || order.paymentMethod === 'SEPAY' ? 'SEPAY' : 'ZALOPAY';

    startPayment(provider, {
      onSuccess: (result) => {
        const url = result.checkoutUrl || result.payUrl;
        if (!url) {
          setPaymentError('Không lấy được đường dẫn thanh toán. Vui lòng thử lại.');
          return;
        }
        navigation.navigate('Payment', {
          checkoutUrl: url,
          provider,
          qrCode: result.qrCode || url,
          orderCode: result.orderCode || orderCode,
          totalAmount,
          paymentId: result.paymentId,
          orderId: order.id,
        });
      },
      onError: () => setPaymentError('Không tạo được thanh toán lúc này. Vui lòng thử lại.'),
    });
  };

  const handleCancel = () => {
    cancelOrder(order.id, {
      onSuccess: () => {
        setShowCancelSheet(false);
        navigation.goBack();
      },
    });
  };

  const handleConfirmDelivery = () => {
    confirmDelivery(
      { id: order.id },
      {
        onSuccess: () => {
          setShowConfirmSheet(false);
          void refetch();
        },
      },
    );
  };

  const handleProductPress = (productId?: string | number) => {
    if (productId === undefined || productId === null) return;
    navigation.navigate('ProductDetail', { productId: String(productId) });
  };

  const handleReorder = () => {
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
    navigation.navigate('Cart');
  };

  const handleOpenTracking = () => {
    if (!trackingUrl) return;
    void Linking.openURL(String(trackingUrl));
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4">
          <BackButton onPress={() => navigation.goBack()} label="Đơn hàng" />
        </View>

        <View className="mt-4 border-b border-landing-line pb-5">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
            Tài khoản
          </Text>
          <Text
            accessibilityRole="header"
            className="mt-2 font-display text-[30px] leading-tight text-landing-obsidian"
          >
            Chi tiết đơn hàng
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
            <Text className="font-mono text-[13px] tracking-[0.02em] text-landing-obsidian">
              {orderCode}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Đã sao chép mã đơn' : 'Sao chép mã đơn hàng'}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={handleCopyCode}
              className="h-11 w-11 items-center justify-center active:opacity-60"
            >
              {copied ? (
                <Check size={14} strokeWidth={2} color={COLORS.sageInk} />
              ) : (
                <Copy size={14} strokeWidth={1.75} color={COLORS.muted} />
              )}
            </Pressable>
            <Text className="font-sans text-[12px] text-landing-muted">
              Đặt lúc <Text className="font-mono text-[12px] text-landing-muted">{placedAt}</Text>
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          {isPendingPayment ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thanh toán đơn hàng"
              accessibilityState={{ disabled: isStartingPayment }}
              disabled={isStartingPayment}
              onPress={handlePay}
              className="h-11 items-center justify-center rounded-subtle bg-oxblood px-4 active:opacity-90 disabled:opacity-60"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>
                {isStartingPayment ? 'Đang mở…' : 'Thanh toán'}
              </Text>
            </Pressable>
          ) : null}

          {isCancellable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hủy đơn hàng"
              accessibilityState={{ disabled: isCancelling }}
              disabled={isCancelling}
              onPress={() => setShowCancelSheet(true)}
              className="h-11 items-center justify-center rounded-subtle border border-danger/40 px-4 active:opacity-70 disabled:opacity-60"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-danger`}>Hủy đơn</Text>
            </Pressable>
          ) : null}

          {canConfirmDelivery ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xác nhận đã nhận hàng"
              accessibilityState={{ disabled: isConfirmingDelivery }}
              disabled={isConfirmingDelivery}
              onPress={() => setShowConfirmSheet(true)}
              className="h-11 items-center justify-center rounded-subtle bg-oxblood px-4 active:opacity-90 disabled:opacity-60"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>
                {isConfirmingDelivery ? 'Đang xác nhận…' : 'Đã nhận hàng'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mua lại đơn hàng"
            onPress={handleReorder}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-4 active:opacity-70"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Mua lại</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Về danh sách đơn hàng"
          onPress={() => navigation.goBack()}
          className="mt-2 h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
        >
          <ChevronLeft size={13} strokeWidth={1.75} color={COLORS.muted} />
          <Text className="font-sans text-xs uppercase tracking-[0.14em] text-landing-muted">
            Tất cả đơn hàng
          </Text>
        </Pressable>

        {isPendingPayment ? (
          <View className="mt-2 rounded-subtle border border-landing-line bg-ivory p-4">
            <Text className="font-display text-[16px] leading-snug text-landing-obsidian">
              Đơn đang chờ thanh toán
            </Text>
            <Text className="mt-2 font-sans text-[12.5px] leading-relaxed text-landing-muted">
              Shop bắt đầu may sau khi nhận được tiền. Bấm Thanh toán để mở lại QR ZaloPay hoặc cổng
              chuyển khoản.
            </Text>
            {paymentDueAt ? (
              <Text className="mt-2 font-sans text-[12.5px] leading-relaxed text-landing-muted">
                Thanh toán trước{' '}
                <Text className="font-mono text-[12.5px] text-landing-obsidian">
                  {formatClockDate(paymentDueAt) || formatDateTime(paymentDueAt)}
                </Text>
                . Quá hạn đơn sẽ tự hủy.
              </Text>
            ) : null}
            {transferContent ? (
              <>
                <Text className="mt-2 font-sans text-[12.5px] leading-relaxed text-landing-muted">
                  Nội dung chuyển khoản:{' '}
                  <Text className="font-mono text-[13px] text-oxblood">{transferContent}</Text>
                </Text>
                <Text className="mt-1 font-sans text-[12px] leading-relaxed text-landing-muted">
                  Nếu đã chuyển khoản mà đơn chưa cập nhật, hãy kiểm tra nội dung chuyển khoản đã ghi đúng mã này.
                </Text>
              </>
            ) : null}
            {paymentError ? (
              <Text className="mt-2 font-sans text-[12px] leading-relaxed text-danger">
                {paymentError}
              </Text>
            ) : null}
          </View>
        ) : null}

        {hasReturns ? (
          <View className="mt-4 gap-3 rounded-subtle border border-landing-line bg-ivory p-4">
            <View className="gap-1.5">
              <Text className={LABEL_CLASS}>Đổi trả & hoàn tiền</Text>
              <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                {returnsStatus ? <ToneLabel tone={returnsStatus.tone} label={returnsStatus.label} /> : null}
                <Text className="font-sans text-[12px] text-landing-muted">
                  <Text className="font-mono">{issues.length}</Text> yêu cầu
                  {refundedAmount > 0 ? (
                    <>
                      {' '}· Đã hoàn{' '}
                      <Text className="font-mono text-landing-obsidian">{formatCurrency(refundedAmount)}</Text>
                    </>
                  ) : null}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem đổi trả và hoàn tiền"
              onPress={() => navigation.navigate('OrderReturns', { orderId: order.id })}
              className="h-11 items-center justify-center self-start rounded-subtle border border-landing-line px-4 active:opacity-70"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Xem đổi trả & hoàn tiền</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-4 rounded-subtle border border-landing-line bg-ivory">
          <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-landing-line/70 px-4 py-3">
            <View className="flex-row items-center gap-2">
              <View className={`h-1.5 w-1.5 shrink-0 ${tone.dot}`} />
              <Text
                className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${tone.text}`}
              >
                {cfg.label}
              </Text>
            </View>
            <Text className="font-sans text-[12px] text-landing-muted">{cfg.description}</Text>
          </View>
          <View className="px-4 py-4">
            {cfg.step >= 0 ? (
              <StepProgress step={cfg.step} />
            ) : (
              <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
                Đơn không còn trong tiến trình may. Liên hệ shop nếu bạn cần hỗ trợ thêm.
              </Text>
            )}
          </View>
        </View>

        <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
          <Text className={LABEL_CLASS}>Vận chuyển</Text>
          {/* Trạng thái đi theo GHN (displayStatus của BE), như web. */}
          <Text className="mt-2 font-sans text-[13px] text-landing-obsidian">{shippingLabel}</Text>
          {trackingCode ? (
            <Text className="mt-1 font-sans text-[12px] text-landing-muted">
              Mã vận đơn <Text className="font-mono text-landing-obsidian">{trackingCode}</Text>
            </Text>
          ) : null}
          {trackingCode && trackingUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở trang theo dõi vận đơn"
              onPress={handleOpenTracking}
              className="mt-1 h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                Theo dõi vận đơn
              </Text>
              <ExternalLink size={12} strokeWidth={1.75} color={COLORS.oxblood} />
            </Pressable>
          ) : null}

          <View className="mt-3 border-t border-landing-line/70 pt-3">
            <Text className={LABEL_CLASS}>Cập nhật</Text>
            <Text className="mt-1.5 font-mono text-[11.5px] text-landing-muted">
              {formatDateTime(latestTimestamp)}
            </Text>
            <Text className="mt-1 font-sans text-[12.5px] leading-relaxed text-landing-obsidian">
              {latestMessage}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
          <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
            Sản phẩm
          </Text>
          <Text className="mt-1 font-sans text-[12px] text-landing-muted">
            {itemCount} sản phẩm may đo theo số đo của bạn.
          </Text>

          <View className="mt-4 gap-4">
            {items.map((item: any, index: number) => {
              const measurementRows = getMeasurementRows(item);
              const lineTotal = (item.price || 0) * (item.quantity || 1);

              return (
                <View key={item.id || index} className="gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xem sản phẩm ${getOrderItemName(item)}`}
                    onPress={() =>
                      handleProductPress(item.productId ?? item.product?.id ?? item.id)
                    }
                    className="flex-row items-start gap-3 active:opacity-70"
                  >
                    <View className="h-20 w-16 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
                      <Image
                        source={{ uri: getOrderItemImage(item) }}
                        style={{ width: 64, height: 80 }}
                        contentFit="cover"
                      />
                    </View>

                    <View className="min-w-0 flex-1 gap-1">
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

                    <Text className="shrink-0 text-right font-mono text-[13px] text-landing-obsidian">
                      {formatCurrency(lineTotal)}
                    </Text>
                  </Pressable>

                  {measurementRows.length > 0 ? (
                    <View className="rounded-subtle border border-landing-line bg-ivory px-3 py-2.5">
                      <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                        Số đo may riêng
                      </Text>
                      <View className="mt-1.5 flex-row flex-wrap gap-x-4 gap-y-1">
                        {measurementRows.map((row) => (
                          <View key={row.key} className="flex-row gap-1.5">
                            <Text className="font-sans text-[11px] text-landing-muted">
                              {row.label}
                            </Text>
                            <Text className="font-mono text-[11px] text-landing-obsidian">
                              {row.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {canReportIssue ? (
                    item.id !== undefined && blockedReportItemIds.has(String(item.id)) ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Đã gửi yêu cầu, xem trạng thái"
                        onPress={() => navigation.navigate('OrderReturns', { orderId: order.id })}
                        className="h-11 justify-center self-start active:opacity-60"
                      >
                        <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
                          Đã gửi yêu cầu · xem trạng thái
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Báo lỗi sản phẩm này"
                        onPress={() => setReportingItem(item)}
                        className="h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
                      >
                        <AlertTriangle size={13} strokeWidth={1.75} color={COLORS.danger} />
                        <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger">
                          Báo lỗi sản phẩm này
                        </Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
          <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
            Giao đến
          </Text>
          <View className="mt-3 gap-1">
            <Text className="font-sans text-[13px] font-medium text-landing-obsidian">
              {recipientName}
            </Text>
            {recipientPhone ? (
              <Text className="font-mono text-[12px] text-landing-obsidian">{recipientPhone}</Text>
            ) : null}
            <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
              {recipientAddress}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
          <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
            Thanh toán
          </Text>
          <View className="mt-2">
            <SummaryRow label="Phương thức" value={paymentMethodLabel} />
            <SummaryRow label="Trạng thái" value={paymentStatusLabel} />
            <SummaryRow label="Tạm tính" value={formatCurrency(subtotal)} />
            <SummaryRow label="Phí giao hàng" value={formatCurrency(shippingFee)} />
            {discount > 0 ? (
              <SummaryRow label="Giảm giá" value={`-${formatCurrency(discount)}`} />
            ) : null}
            <SummaryRow label="Tổng cộng" value={formatCurrency(totalAmount)} strong />
            <SummaryRow label="Đã thanh toán" value={formatCurrency(paidAmount)} />
            {refundedAmount > 0 ? (
              <SummaryRow
                label={paidAmount > 0 && refundedAmount < paidAmount ? 'Đã hoàn một phần' : 'Đã hoàn tiền'}
                value={formatCurrency(refundedAmount)}
              />
            ) : null}
          </View>
        </View>

        {history.length > 0 ? (
          <View className="mt-4 rounded-subtle border border-landing-line bg-ivory p-4">
            <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
              Lịch sử đơn hàng
            </Text>
            <View className="mt-3">
              {history.map((entry: any, index: number) => {
                const isLatest = index === 0;
                const message =
                  entry?.publicMessage ||
                  entry?.message ||
                  entry?.toStatus ||
                  entry?.type ||
                  'Cập nhật đơn hàng';

                return (
                  <View key={entry?.id || index} className="flex-row gap-3">
                    <View className="items-center pt-1.5">
                      <View
                        className={`h-1.5 w-1.5 shrink-0 ${isLatest ? 'bg-oxblood' : 'bg-taupe'}`}
                      />
                      {index < history.length - 1 ? (
                        <View className="mt-1 w-[1px] flex-1 bg-landing-line" />
                      ) : null}
                    </View>
                    <View className="flex-1 pb-3">
                      <Text
                        className={`font-sans text-[12.5px] leading-relaxed ${
                          isLatest ? 'font-medium text-landing-obsidian' : 'text-landing-obsidian'
                        }`}
                      >
                        {message}
                      </Text>
                      <Text className="mt-0.5 font-mono text-[11px] text-landing-muted">
                        {formatDateTime(entry?.occurredAt || entry?.createdAt || order.updatedAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <PaperActionSheet
        visible={showCancelSheet}
        title="Hủy đơn hàng?"
        description={
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Đơn <Text className="font-mono text-landing-obsidian">{orderCode}</Text> sẽ bị hủy và
            không thể hoàn tác.
          </Text>
        }
        confirmLabel="Hủy đơn"
        pendingLabel="Đang hủy…"
        isPending={isCancelling}
        tone="danger"
        onConfirm={handleCancel}
        onClose={() => setShowCancelSheet(false)}
      />

      <PaperActionSheet
        visible={showConfirmSheet}
        title="Đã nhận hàng?"
        description={
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Bạn xác nhận đã nhận kiện hàng của đơn{' '}
            <Text className="font-mono text-landing-obsidian">{orderCode}</Text> và hàng hóa đang ở
            trạng thái tốt.
          </Text>
        }
        confirmLabel="Xác nhận"
        pendingLabel="Đang xác nhận…"
        isPending={isConfirmingDelivery}
        tone="primary"
        onConfirm={handleConfirmDelivery}
        onClose={() => setShowConfirmSheet(false)}
      />

      <ReportIssueModal
        visible={!!reportingItem}
        onClose={() => setReportingItem(null)}
        orderId={orderId}
        orderItem={reportingItem}
        defaultBank={{
          bankName: order.refundBankName,
          accountNumber: order.refundAccountNumber,
          accountHolder: order.refundAccountHolder,
        }}
        onSuccess={() => navigation.navigate('OrderReturns', { orderId: order.id })}
      />
    </View>
  );
}
