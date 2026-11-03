import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import {
  Search,
  ShoppingBag,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Check,
  Truck,
  XCircle,
  MapPin,
  Phone,
  Scissors,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react-native';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { useOrders, useCancelOrder, useConfirmDelivery } from '../hooks/use-orders';
import { formatDate } from '@/utils/date';

// ─── Filter Tabs & Constants ──────────────────────────────────────────────────
const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'tailoring', label: 'Đang may' },
  { id: 'ready_to_ship', label: 'Sẵn sàng giao' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'delivered', label: 'Đã giao' },
  { id: 'completed', label: 'Hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
] as const;

const STEPS = ['Đã tạo', 'Đang xử lý', 'Sẵn sàng giao', 'Vận chuyển/Hoàn tất'] as const;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: any;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    iconColor: string;
    step: number;
  }
> = {
  CREATED: {
    label: 'PENDING',
    icon: Clock,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 0,
  },
  PENDING: {
    label: 'PENDING',
    icon: Clock,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 0,
  },
  PENDING_PAYMENT: {
    label: 'PENDING',
    icon: Clock,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 0,
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-sage-ink',
    iconColor: COLORS.sageInk,
    step: 1,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-sage-ink',
    iconColor: COLORS.sageInk,
    step: 1,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    icon: Scissors,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-landing-obsidian',
    iconColor: COLORS.obsidian,
    step: 1,
  },
  MEASUREMENT_REVIEW: {
    label: 'Cần bổ sung số đo',
    icon: Scissors,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 1,
  },
  MEASUREMENT_CONFIRMED: {
    label: 'Đang xử lý',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 1,
  },
  TAILORING: {
    label: 'Đang may',
    icon: Scissors,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-landing-obsidian',
    iconColor: COLORS.obsidian,
    step: 1,
  },
  QUALITY_CHECK: {
    label: 'Đang kiểm tra',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-landing-obsidian',
    iconColor: COLORS.obsidian,
    step: 1,
  },
  READY_TO_SHIP: {
    label: 'Sẵn sàng giao',
    icon: Truck,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-brass',
    badgeText: 'text-brass-ink',
    iconColor: COLORS.brassInk,
    step: 2,
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    icon: Truck,
    badgeBg: 'bg-oxblood',
    badgeBorder: 'border-oxblood',
    badgeText: 'text-landing-paper',
    iconColor: COLORS.paper,
    step: 3,
  },
  DELIVERED: {
    label: 'Đã giao',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-sage-ink',
    iconColor: COLORS.sageInk,
    step: 3,
  },
  COMPLETED: {
    label: 'Hoàn tất',
    icon: CheckCircle2,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-sage-ink',
    iconColor: COLORS.sageInk,
    step: 3,
  },
  CANCELLED: {
    label: 'Đơn hàng đã bị hủy.',
    icon: XCircle,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-danger',
    badgeText: 'text-oxblood',
    iconColor: COLORS.oxblood,
    step: -1,
  },
  EXPIRED: {
    label: 'Đơn hàng đã hết hạn thanh toán.',
    icon: XCircle,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-landing-muted',
    iconColor: COLORS.muted,
    step: -1,
  },
  RETURNED: {
    label: 'Hoàn trả',
    icon: RotateCcw,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-landing-line',
    badgeText: 'text-landing-muted',
    iconColor: COLORS.muted,
    step: -1,
  },
  FAILED: {
    label: 'Thất bại',
    icon: XCircle,
    badgeBg: 'bg-landing-paper',
    badgeBorder: 'border-danger',
    badgeText: 'text-oxblood',
    iconColor: COLORS.oxblood,
    step: -1,
  },
};

// Helper: Format price as "610.500đ"
function fmtPrice(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

// Helper: Safely resolve product image URL
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

// Helper: Match an order's status to a filter tab
function matchStatus(status: string | undefined, filterId: string): boolean {
  const s = (status || 'PENDING').toUpperCase();
  if (filterId === 'all') return true;
  if (filterId === 'pending') {
    return ['PENDING', 'PENDING_PAYMENT', 'CREATED'].includes(s);
  }
  if (filterId === 'tailoring') {
    return [
      'PROCESSING',
      'MEASUREMENT_REVIEW',
      'MEASUREMENT_CONFIRMED',
      'TAILORING',
      'QUALITY_CHECK',
      'CONFIRMED',
      'PAID',
    ].includes(s);
  }
  if (filterId === 'ready_to_ship') return s === 'READY_TO_SHIP';
  if (filterId === 'shipping') return s === 'SHIPPING';
  if (filterId === 'delivered') return s === 'DELIVERED';
  if (filterId === 'completed') return s === 'COMPLETED';
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

// ─── Main Orders Screen ───────────────────────────────────────────────────────
export function OrdersScreen() {
  const navigation = useNavigation<any>();
  const addItem = useCartStore((state) => state.addItem);

  const { orders: fetchedOrders, isLoading, refetch } = useOrders();
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());

  const allOrders = useMemo(
    () => (fetchedOrders && Array.isArray(fetchedOrders) ? fetchedOrders : []),
    [fetchedOrders],
  );

  // Compute counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FILTER_TABS.forEach((tab) => {
      counts[tab.id] = allOrders.filter((o: any) => matchStatus(o.status, tab.id)).length;
    });
    return counts;
  }, [allOrders]);

  // Filtered orders list by tab & search query
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      const matchTab = matchStatus(order.status, activeFilter);

      const orderCode = `ORD-${order.orderCode || order.orderNumber || order.id}`;
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

  // Toggle order card detail accordion
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

  // Copy order code to clipboard
  const handleCopyCode = async (orderCode: string, id: string | number) => {
    await Clipboard.setStringAsync(orderCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Re-order (Mua lại) action
  const handleReorder = (order: any) => {
    const items = order.items || [];
    if (items.length === 0) return;

    items.forEach((item: any) => {
      addItem({
        productId: item.productId || item.id,
        productName: item.product?.name || item.productName || 'Sản phẩm công sở',
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

  // Cancel order action
  const handleCancel = (order: any) => {
    const code = `ORD-${order.orderCode || order.orderNumber || order.id}`;
    Alert.alert('Hủy đơn hàng', `Bạn có chắc chắn muốn hủy đơn hàng #${code}?`, [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: () => cancelOrder(order.id),
      },
    ]);
  };

  // Confirm delivery action
  const handleConfirmDelivery = (order: any) => {
    confirmDelivery(
      { id: order.id },
      {
        onSuccess: () => Alert.alert('Thành công', 'Cảm ơn bạn đã xác nhận đã nhận hàng!'),
        onError: () => Alert.alert('Lỗi', 'Chưa thể xác nhận nhận hàng lúc này.'),
      }
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

        <View className="mt-4 mb-lg gap-3 border-b border-landing-line pb-5">
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
            Theo dõi và quản lý tất cả đơn hàng của bạn
          </Text>
        </View>

        {/* ── Search Bar ── */}
        <View className="mb-lg h-11 flex-row items-center border border-landing-line bg-ivory px-3.5">
          <Search size={15} strokeWidth={1.75} color={COLORS.brassInk} />
          <TextInput
            placeholder="Tìm mã đơn, sản phẩm..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
            className="ml-2.5 flex-1 p-0 font-sans text-body-md text-landing-obsidian"
          />
          {search.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Xóa từ khóa tìm kiếm"
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="h-8 w-8 items-center justify-center"
            >
              <X size={15} strokeWidth={1.75} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 mb-lg px-4"
          contentContainerStyle={{ gap: 20 }}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;
            const count = tabCounts[tab.id] ?? 0;

            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setActiveFilter(tab.id)}
                className={`h-11 flex-row items-center gap-1.5 border-b-2 ${
                  isSelected ? 'border-oxblood' : 'border-transparent'
                }`}
              >
                <Text
                  className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isSelected ? 'text-oxblood' : 'text-landing-muted'
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
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Order List ── */}
        {filteredOrders.length === 0 ? (
          <View className="my-3 items-center gap-5 border border-dashed border-taupe bg-ivory px-6 py-14">
            <View className="h-16 w-16 items-center justify-center border border-landing-line">
              <Package size={24} strokeWidth={1.5} color={COLORS.oxblood} />
            </View>
            <View className="gap-2">
              <Text className="text-center font-display text-[20px] text-landing-obsidian">
                Chưa có đơn hàng nào
              </Text>
              <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                {search
                  ? 'Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.'
                  : 'Bạn chưa có đơn hàng nào trong danh mục này.'}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
              className="h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                Khám phá sản phẩm
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order: any) => {
            const rawStatus = (order.status || 'PENDING').toUpperCase();
            const cfg = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;

            const orderCode = `ORD-${order.orderCode || order.orderNumber || order.id}`;
            const total = order.totalVnd ?? order.totalAmount ?? order.total ?? 0;
            const isExpanded = expandedOrders.has(order.id);
            const isCopied = copiedId === order.id;

            const items = order.items || [];
            const firstItem = items[0];
            const remainingCount = items.length - 1;

            // Address line
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

            const phone =
              order.shippingInfo?.phone ||
              order.shippingAddress?.phone ||
              '0912345678';

            // Shipping Fee & Discount
            const shippingFee = order.shippingFeeVnd ?? order.shippingFee ?? 0;
            const discount = order.discountVnd ?? order.discountAmount ?? order.discount ?? 0;

            // Latest history message
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
              <View
                key={String(order.id)}
                className="mb-md overflow-hidden rounded-subtle border border-landing-line bg-ivory"
              >
                <View className="flex-row items-start justify-between gap-3 border-b border-landing-line px-md pb-3 pt-3.5">
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-1">
                      <Text className="font-mono text-[12.5px] tracking-[0.02em] text-landing-obsidian">
                        #{orderCode}
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Sao chép mã đơn hàng"
                        onPress={() => handleCopyCode(orderCode, order.id)}
                        className="h-8 w-8 items-center justify-center active:opacity-60"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {isCopied ? (
                          <CheckCircle2 size={13} strokeWidth={1.75} color={COLORS.sageInk} />
                        ) : (
                          <Copy size={13} strokeWidth={1.75} color={COLORS.muted} />
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  <View
                    className={`flex-row items-center gap-1.5 rounded-subtle border px-2 py-1 ${cfg.badgeBg} ${cfg.badgeBorder}`}
                  >
                    <StatusIcon size={11} strokeWidth={1.75} color={cfg.iconColor} />
                    <Text
                      className={`font-sans text-[9.5px] font-semibold uppercase tracking-[0.14em] ${cfg.badgeText}`}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between px-md py-3">
                  <Text className="font-mono text-[15px] text-oxblood">{fmtPrice(total)}</Text>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? 'Thu gọn chi tiết đơn hàng' : 'Xem chi tiết đơn hàng'}
                    onPress={() => toggleExpand(order.id)}
                    className="h-11 flex-row items-center gap-1 active:opacity-70"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                      Chi tiết
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={14} strokeWidth={1.75} color={COLORS.muted} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.75} color={COLORS.muted} />
                    )}
                  </TouchableOpacity>
                </View>

                <View className="h-px bg-landing-line" />

                <View className="flex-row items-center justify-between gap-3 px-md py-3">
                  <View className="min-w-0 flex-1 flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1.5">
                      {items.slice(0, 2).map((it: any, idx: number) => (
                        <View
                          key={it.id || idx}
                          className="h-14 w-12 overflow-hidden rounded-subtle border border-landing-line bg-landing-paper"
                        >
                          <Image
                            source={{ uri: getProductImage(it) }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        </View>
                      ))}
                    </View>

                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-display text-[15px] leading-snug text-landing-obsidian"
                      >
                        {firstItem?.product?.name ||
                          firstItem?.productName ||
                          'Sản phẩm công sở'}
                      </Text>
                      {remainingCount > 0 && (
                        <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
                          và {remainingCount} sản phẩm khác
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.9}
                    onPress={() => handleReorder(order)}
                    className="h-11 shrink-0 flex-row items-center gap-1.5 rounded-subtle bg-oxblood px-3.5 active:opacity-90"
                  >
                    <ShoppingBag size={13} strokeWidth={1.75} color={COLORS.paper} />
                    <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                      Mua lại
                    </Text>
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View className="gap-xl border-t border-landing-line bg-landing-paper/60 p-md pt-lg">
                    {cfg.step >= 0 && (
                      <View>
                        <Text className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brass-ink">
                          Trạng thái vận chuyển
                        </Text>
                        <View className="w-full flex-row items-center justify-between px-1">
                          {STEPS.map((stepLabel, idx) => {
                            const isDone = idx <= cfg.step;
                            const isActive = idx === cfg.step;

                            return (
                              <React.Fragment key={stepLabel}>
                                <View className="flex-1 flex-col items-center">
                                  <View
                                    className={`mb-1.5 h-6 w-6 items-center justify-center rounded-subtle border ${
                                      isDone
                                        ? 'border-oxblood bg-oxblood'
                                        : 'border-landing-line bg-ivory'
                                    }`}
                                  >
                                    {isDone && (
                                      <Check
                                        size={12}
                                        strokeWidth={2.5}
                                        color={COLORS.paper}
                                      />
                                    )}
                                  </View>
                                  <Text
                                    numberOfLines={1}
                                    className={`text-center font-sans text-[9.5px] uppercase leading-tight tracking-[0.06em] ${
                                      isActive
                                        ? 'font-semibold text-oxblood'
                                        : isDone
                                          ? 'text-landing-obsidian/80'
                                          : 'text-landing-muted'
                                    }`}
                                  >
                                    {stepLabel}
                                  </Text>
                                </View>

                                {idx < STEPS.length - 1 && (
                                  <View
                                    className={`mx-0.5 -mt-4 h-[2px] flex-1 ${
                                      idx < cfg.step ? 'bg-oxblood' : 'bg-landing-line'
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <View>
                      <Text className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brass-ink">
                        Sản phẩm
                      </Text>
                      <View className="gap-2">
                        {items.map((it: any, itemIdx: number) => {
                          const itemTotal = (it.price || 0) * (it.quantity || 1);

                          return (
                            <View
                              key={it.id || itemIdx}
                              className="flex-row items-center gap-3 rounded-subtle border border-landing-line bg-ivory p-2"
                            >
                              <View className="h-[72px] w-14 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-landing-paper">
                                <Image
                                  source={{ uri: getProductImage(it) }}
                                  style={{ width: 56, height: 72 }}
                                  contentFit="cover"
                                />
                              </View>
                              <View className="min-w-0 flex-1">
                                <Text
                                  numberOfLines={1}
                                  className="font-display text-[14px] leading-snug text-landing-obsidian"
                                >
                                  {it.product?.name ||
                                    it.productName ||
                                    'Sản phẩm công sở'}
                                </Text>
                                <Text className="mt-0.5 font-sans text-[11px] text-landing-muted">
                                  Màu: {it.color || 'Trắng'} · May đo
                                </Text>
                                <Text className="mt-0.5 font-mono text-[10.5px] text-landing-muted">
                                  x{it.quantity || 1}
                                </Text>
                              </View>
                              <Text className="shrink-0 font-mono text-[13px] text-oxblood">
                                {fmtPrice(itemTotal)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View>
                      <Text className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brass-ink">
                        Địa chỉ nhận hàng
                      </Text>
                      <View className="gap-2 rounded-subtle border border-landing-line bg-ivory p-3">
                        <View className="flex-row items-start gap-2">
                          <MapPin
                            size={14}
                            strokeWidth={1.75}
                            color={COLORS.brassInk}
                            className="mt-0.5 shrink-0"
                          />
                          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                            {address}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Phone
                            size={14}
                            strokeWidth={1.75}
                            color={COLORS.brassInk}
                            className="shrink-0"
                          />
                          <Text className="font-mono text-[12px] text-landing-obsidian">
                            {phone}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View>
                      <Text className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brass-ink">
                        Thanh toán
                      </Text>
                      <View className="gap-2 rounded-subtle border border-landing-line bg-ivory p-3.5">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-sans text-body-sm text-landing-muted">
                            Phí giao hàng
                          </Text>
                          <Text className="font-mono text-[12px] text-landing-obsidian">
                            {fmtPrice(shippingFee)}
                          </Text>
                        </View>

                        {discount > 0 && (
                          <View className="flex-row items-center justify-between">
                            <Text className="font-sans text-body-sm text-landing-muted">
                              Giảm giá
                            </Text>
                            <Text className="font-mono text-[12px] text-sage-ink">
                              -{fmtPrice(discount)}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row items-center justify-between">
                          <Text className="font-sans text-body-sm text-landing-muted">
                            Thanh toán
                          </Text>
                          <Text className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-brass-ink">
                            {order.paymentStatus || 'PENDING'}
                          </Text>
                        </View>

                        <View className="my-1 h-px bg-landing-line" />

                        <View className="flex-row items-center justify-between">
                          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                            Tổng cộng
                          </Text>
                          <Text className="font-mono text-[16px] text-oxblood">
                            {fmtPrice(total)}
                          </Text>
                        </View>

                        <Text className="mt-1 font-mono text-[10.5px] text-landing-muted">
                          Phương thức: {order.paymentMethod || 'BANK_TRANSFER'}
                        </Text>
                        <Text className="font-sans text-[11px] leading-relaxed text-landing-muted">
                          Mốc mới nhất: {latestMessage}
                        </Text>

                        <View className="mt-1 flex-row flex-wrap items-center gap-2 border-t border-landing-line pt-3">
                          <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() =>
                              navigation.navigate('OrderDetail', { orderId: order.id })
                            }
                            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-subtle border border-landing-line active:bg-landing-paper"
                          >
                            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                              Xem trang đơn
                            </Text>
                            <ExternalLink size={12} strokeWidth={1.75} color={COLORS.obsidian} />
                          </TouchableOpacity>

                          {order.allowedActions?.confirmDelivery && (
                            <TouchableOpacity
                              accessibilityRole="button"
                              onPress={() => handleConfirmDelivery(order)}
                              disabled={isConfirmingDelivery}
                              className="h-11 items-center justify-center rounded-subtle bg-oxblood px-3.5 active:opacity-90 disabled:opacity-60"
                            >
                              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                                {isConfirmingDelivery ? 'Đang xác nhận…' : 'Đã nhận hàng'}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {(order.allowedActions?.cancel || rawStatus === 'PENDING') && (
                            <TouchableOpacity
                              accessibilityRole="button"
                              onPress={() => handleCancel(order)}
                              disabled={isCancelling}
                              className="h-11 items-center justify-center rounded-subtle border border-danger px-3.5 active:opacity-80 disabled:opacity-60"
                            >
                              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                                Hủy đơn
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

    </View>
  );
}

export default OrdersScreen;
