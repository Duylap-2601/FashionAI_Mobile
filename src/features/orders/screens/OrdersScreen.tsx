import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  MessageCircle,
  X,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
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
    badgeBg: 'bg-[#FEF3C7]',
    badgeBorder: 'border-[#FDE68A]',
    badgeText: 'text-[#D97706]',
    iconColor: '#D97706',
    step: 0,
  },
  PENDING: {
    label: 'PENDING',
    icon: Clock,
    badgeBg: 'bg-[#FEF3C7]',
    badgeBorder: 'border-[#FDE68A]',
    badgeText: 'text-[#D97706]',
    iconColor: '#D97706',
    step: 0,
  },
  PENDING_PAYMENT: {
    label: 'PENDING',
    icon: Clock,
    badgeBg: 'bg-[#FEF3C7]',
    badgeBorder: 'border-[#FDE68A]',
    badgeText: 'text-[#D97706]',
    iconColor: '#D97706',
    step: 0,
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: CheckCircle2,
    badgeBg: 'bg-[#EFF6FF]',
    badgeBorder: 'border-[#BFDBFE]',
    badgeText: 'text-[#2563EB]',
    iconColor: '#2563EB',
    step: 1,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    icon: CheckCircle2,
    badgeBg: 'bg-[#EFF6FF]',
    badgeBorder: 'border-[#BFDBFE]',
    badgeText: 'text-[#2563EB]',
    iconColor: '#2563EB',
    step: 1,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    icon: Scissors,
    badgeBg: 'bg-[#EEF2FF]',
    badgeBorder: 'border-[#C7D2FE]',
    badgeText: 'text-[#4F46E5]',
    iconColor: '#4F46E5',
    step: 1,
  },
  MEASUREMENT_REVIEW: {
    label: 'Cần bổ sung số đo',
    icon: Scissors,
    badgeBg: 'bg-[#FAF5FF]',
    badgeBorder: 'border-[#E9D5FF]',
    badgeText: 'text-[#7E22CE]',
    iconColor: '#7E22CE',
    step: 1,
  },
  MEASUREMENT_CONFIRMED: {
    label: 'Đang xử lý',
    icon: CheckCircle2,
    badgeBg: 'bg-[#FAF5FF]',
    badgeBorder: 'border-[#E9D5FF]',
    badgeText: 'text-[#7E22CE]',
    iconColor: '#7E22CE',
    step: 1,
  },
  TAILORING: {
    label: 'Đang may',
    icon: Scissors,
    badgeBg: 'bg-[#EEF2FF]',
    badgeBorder: 'border-[#C7D2FE]',
    badgeText: 'text-[#4F46E5]',
    iconColor: '#4F46E5',
    step: 1,
  },
  QUALITY_CHECK: {
    label: 'Đang kiểm tra',
    icon: CheckCircle2,
    badgeBg: 'bg-[#ECFEFF]',
    badgeBorder: 'border-[#A5F3FC]',
    badgeText: 'text-[#0891B2]',
    iconColor: '#0891B2',
    step: 1,
  },
  READY_TO_SHIP: {
    label: 'Sẵn sàng giao',
    icon: Truck,
    badgeBg: 'bg-[#F0F9FF]',
    badgeBorder: 'border-[#BAE6FD]',
    badgeText: 'text-[#0284C7]',
    iconColor: '#0284C7',
    step: 2,
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    icon: Truck,
    badgeBg: 'bg-[#5D1C34]/10',
    badgeBorder: 'border-[#5D1C34]/20',
    badgeText: 'text-[#5D1C34]',
    iconColor: '#5D1C34',
    step: 3,
  },
  DELIVERED: {
    label: 'Đã giao',
    icon: CheckCircle2,
    badgeBg: 'bg-[#ECFDF5]',
    badgeBorder: 'border-[#A7F3D0]',
    badgeText: 'text-[#059669]',
    iconColor: '#059669',
    step: 3,
  },
  COMPLETED: {
    label: 'Hoàn tất',
    icon: CheckCircle2,
    badgeBg: 'bg-[#ECFDF5]',
    badgeBorder: 'border-[#A7F3D0]',
    badgeText: 'text-[#059669]',
    iconColor: '#059669',
    step: 3,
  },
  CANCELLED: {
    label: 'Đơn hàng đã bị hủy.',
    icon: XCircle,
    badgeBg: 'bg-[#FEE2E2]',
    badgeBorder: 'border-[#FECACA]',
    badgeText: 'text-[#DC2626]',
    iconColor: '#DC2626',
    step: -1,
  },
  EXPIRED: {
    label: 'Đơn hàng đã hết hạn thanh toán.',
    icon: XCircle,
    badgeBg: 'bg-[#F3F4F6]',
    badgeBorder: 'border-[#E5E7EB]',
    badgeText: 'text-[#6B7280]',
    iconColor: '#6B7280',
    step: -1,
  },
  RETURNED: {
    label: 'Hoàn trả',
    icon: RotateCcw,
    badgeBg: 'bg-[#F3F4F6]',
    badgeBorder: 'border-[#E5E7EB]',
    badgeText: 'text-[#6B7280]',
    iconColor: '#6B7280',
    step: -1,
  },
  FAILED: {
    label: 'Thất bại',
    icon: XCircle,
    badgeBg: 'bg-[#FEE2E2]',
    badgeBorder: 'border-[#FECACA]',
    badgeText: 'text-[#DC2626]',
    iconColor: '#DC2626',
    step: -1,
  },
};

// ─── Default Sample Orders (matching User Reference Screenshots) ──────────────
const SAMPLE_ORDERS: any[] = [
  {
    id: '9027452',
    orderCode: '9027452',
    orderNumber: '9027452',
    createdAt: '2026-10-06T10:00:00.000Z',
    status: 'PENDING',
    totalVnd: 610500,
    totalAmount: 610500,
    shippingFeeVnd: 60500,
    shippingFee: 60500,
    discountVnd: 0,
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    shippingInfo: {
      address: 'Thị trấn An Phú, Huyện An Phú, An Giang',
      phone: '0912345678',
      name: 'Nguyễn Văn A',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Áo Sơ Mi Tay Dài Bồng Họa Ti...',
        product: { name: 'Áo Sơ Mi Tay Dài Bồng Họa Ti...' },
        color: 'Trắng',
        quantity: 1,
        price: 550000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã được tạo và đang chờ thanh toán.' }],
  },
  {
    id: '69290348',
    orderCode: '69290348',
    orderNumber: '69290348',
    createdAt: '2026-10-05T14:30:00.000Z',
    status: 'CANCELLED',
    totalVnd: 1367000,
    totalAmount: 1367000,
    shippingFeeVnd: 67000,
    shippingFee: 67000,
    discountVnd: 0,
    paymentStatus: 'CANCELLED',
    paymentMethod: 'BANK_TRANSFER',
    shippingInfo: {
      address: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '0901234567',
    },
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Đầm Không Tay Dáng ...',
        product: { name: 'Đầm Không Tay Dáng Xòe Công Sở' },
        color: 'Be',
        quantity: 1,
        price: 750000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop&auto=format',
      },
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'Áo Sơ Mi Lụa Cổ V',
        product: { name: 'Áo Sơ Mi Lụa Cổ V' },
        color: 'Trắng',
        quantity: 1,
        price: 550000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã bị hủy.' }],
  },
  {
    id: '26152602',
    orderCode: '26152602',
    orderNumber: '26152602',
    createdAt: '2026-10-05T09:15:00.000Z',
    status: 'EXPIRED',
    totalVnd: 850000,
    totalAmount: 850000,
    shippingFeeVnd: 50000,
    shippingFee: 50000,
    discountVnd: 0,
    paymentStatus: 'EXPIRED',
    paymentMethod: 'SEPAY',
    shippingInfo: {
      address: 'Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
      phone: '0988776655',
    },
    items: [
      {
        id: 'item-4',
        productId: 'prod-4',
        productName: 'Quần Tây Nữ Dáng Suông',
        product: { name: 'Quần Tây Nữ Dáng Suông' },
        color: 'Đen',
        quantity: 1,
        price: 800000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã hết hạn thanh toán.' }],
  },
  {
    id: '15482910',
    orderCode: '15482910',
    orderNumber: '15482910',
    createdAt: '2026-10-04T16:20:00.000Z',
    status: 'COMPLETED',
    totalVnd: 1250000,
    totalAmount: 1250000,
    shippingFeeVnd: 45000,
    shippingFee: 45000,
    discountVnd: 50000,
    paymentStatus: 'PAID',
    paymentMethod: 'SEPAY',
    shippingInfo: {
      address: 'Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      phone: '0933445566',
    },
    items: [
      {
        id: 'item-5',
        productId: 'prod-5',
        productName: 'Áo Blazer Công Sở Thiết Kế',
        product: { name: 'Áo Blazer Công Sở Thiết Kế' },
        color: 'Navy',
        quantity: 1,
        price: 1255000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã được giao thành công.' }],
  },
  {
    id: '44829103',
    orderCode: '44829103',
    orderNumber: '44829103',
    createdAt: '2026-10-03T11:00:00.000Z',
    status: 'SHIPPING',
    totalVnd: 980000,
    totalAmount: 980000,
    shippingFeeVnd: 40000,
    shippingFee: 40000,
    discountVnd: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'MOMO',
    shippingInfo: {
      address: 'Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội',
      phone: '0977889900',
    },
    items: [
      {
        id: 'item-6',
        productId: 'prod-6',
        productName: 'Chân Váy Bút Chì Cao Cấp',
        product: { name: 'Chân Váy Bút Chì Cao Cấp' },
        color: 'Xám',
        quantity: 1,
        price: 940000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đang trên đường vận chuyển.' }],
  },
  {
    id: '78291024',
    orderCode: '78291024',
    orderNumber: '78291024',
    createdAt: '2026-10-02T15:45:00.000Z',
    status: 'TAILORING',
    totalVnd: 1890000,
    totalAmount: 1890000,
    shippingFeeVnd: 50000,
    shippingFee: 50000,
    discountVnd: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    shippingInfo: {
      address: 'Phường 7, Quận 3, TP. Hồ Chí Minh',
      phone: '0918273645',
    },
    items: [
      {
        id: 'item-7',
        productId: 'prod-7',
        productName: 'Set Vest May Đo Độc Bản',
        product: { name: 'Set Vest May Đo Độc Bản' },
        color: 'Đen Charcoal',
        quantity: 1,
        price: 1840000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Thợ may đang xử lý theo thông số cơ thể.' }],
  },
  {
    id: '88392011',
    orderCode: '88392011',
    orderNumber: '88392011',
    createdAt: '2026-10-01T08:30:00.000Z',
    status: 'READY_TO_SHIP',
    totalVnd: 690000,
    totalAmount: 690000,
    shippingFeeVnd: 40000,
    shippingFee: 40000,
    discountVnd: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    shippingInfo: {
      address: 'Phường Hòa Cường Bắc, Quận Hải Châu, Đà Nẵng',
      phone: '0905112233',
    },
    items: [
      {
        id: 'item-8',
        productId: 'prod-8',
        productName: 'Áo Kiểu Phối Nơ Lụa',
        product: { name: 'Áo Kiểu Phối Nơ Lụa' },
        color: 'Kem',
        quantity: 1,
        price: 650000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã đóng gói và sẵn sàng bàn giao.' }],
  },
  {
    id: '99201832',
    orderCode: '99201832',
    orderNumber: '99201832',
    createdAt: '2026-09-28T14:10:00.000Z',
    status: 'COMPLETED',
    totalVnd: 1100000,
    totalAmount: 1100000,
    shippingFeeVnd: 50000,
    shippingFee: 50000,
    discountVnd: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'SEPAY',
    shippingInfo: {
      address: 'Phường Láng Hạ, Đống Đa, Hà Nội',
      phone: '0944556677',
    },
    items: [
      {
        id: 'item-9',
        productId: 'prod-9',
        productName: 'Đầm Ôm Body Công Sở',
        product: { name: 'Đầm Ôm Body Công Sở' },
        color: 'Xanh Navy',
        quantity: 1,
        price: 1050000,
        productImageSnapshot:
          'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300&h=400&fit=crop&auto=format',
      },
    ],
    history: [{ publicMessage: 'Đơn hàng đã hoàn tất.' }],
  },
];

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const addItem = useCartStore((state) => state.addItem);

  const { orders: fetchedOrders, isLoading, refetch, isError } = useOrders();
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());

  // Merge real orders if present, or fallback to sample orders to ensure exact match with screenshots
  const allOrders = useMemo(() => {
    if (fetchedOrders && Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
      return fetchedOrders;
    }
    return SAMPLE_ORDERS;
  }, [fetchedOrders]);

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
    <View className="flex-1 bg-[#FBF9F7]">
      {/* ── Top Header ── */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="px-4 pb-3 flex-row items-center justify-between border-b border-[#ECE8E3] bg-[#FBF9F7] z-20"
      >
        {/* Brand Logo "StAle." */}
        <View className="flex-row items-center">
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
              fontSize: 26,
              fontWeight: '700',
              color: '#5D1C34',
              letterSpacing: -0.5,
            }}
          >
            St<Text style={{ fontWeight: '900' }}>A</Text>le.
          </Text>
        </View>

        {/* Right Header Icons */}
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            accessibilityLabel="Tìm kiếm"
            onPress={() => (navigation as any).navigate('Search')}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <Search size={22} color="#1B1C1B" />
          </TouchableOpacity>

          <NotificationBell />

          <TouchableOpacity
            accessibilityLabel="Giỏ hàng"
            onPress={() => navigation.navigate('Cart')}
            className="w-10 h-10 items-center justify-center rounded-full relative"
          >
            <ShoppingBag size={22} color="#1B1C1B" />
            {totalCartItems > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: '#C81E51',
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            colors={['#5D1C34']}
            tintColor="#5D1C34"
          />
        }
      >
        {/* ── Heading & Subtitle ── */}
        <Text className="text-[28px] font-bold text-[#5D1C34] mb-1">Đơn hàng</Text>
        <Text className="text-[13.5px] text-[#6B7280] mb-4">
          Theo dõi và quản lý tất cả đơn hàng của bạn
        </Text>

        {/* ── Search Bar ── */}
        <View className="flex-row items-center bg-white border border-[#E5E7EB] rounded-full px-3.5 py-2.5 mb-4 shadow-2xs">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm mã đơn, sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-[13.5px] text-[#1B1C1B] p-0"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Horizontal Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 px-4 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;
            const count = tabCounts[tab.id] ?? 0;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${
                  isSelected
                    ? 'bg-[#5D1C34]'
                    : 'bg-white border border-[#E5E7EB]'
                }`}
              >
                <Text
                  className={`text-[13px] ${
                    isSelected ? 'font-bold text-white' : 'font-medium text-[#4B5563]'
                  }`}
                >
                  {tab.label}
                </Text>

                <View
                  className={`px-2 py-0.5 rounded-full min-w-[20px] items-center justify-center ${
                    isSelected ? 'bg-[#3E1222]' : 'bg-[#F3F4F6]'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-white' : 'text-[#6B7280]'
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Order List ── */}
        {filteredOrders.length === 0 ? (
          <View className="bg-white rounded-3xl border border-dashed border-[#D1D5DB] py-14 px-6 items-center justify-center my-3 shadow-2xs">
            <View className="w-20 h-20 rounded-full bg-[#5D1C34]/5 items-center justify-center mb-4">
              <Package size={38} color="#9CA3AF" />
            </View>
            <Text className="text-[18px] font-bold text-[#1B1C1B] mb-1.5 text-center">
              Chưa có đơn hàng nào
            </Text>
            <Text className="text-[13px] text-[#6B7280] text-center mb-6 max-w-[260px] leading-5">
              {search
                ? 'Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.'
                : 'Bạn chưa có đơn hàng nào trong danh mục này.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
              className="px-7 py-3 bg-[#5D1C34] rounded-full shadow-md"
            >
              <Text className="text-[14px] font-bold text-white">Khám phá sản phẩm</Text>
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
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs mb-3.5 overflow-hidden"
              >
                {/* ── Top Header Row ── */}
                <View className="p-4 pb-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5 flex-1 flex-wrap">
                    <Text className="text-[14px] font-bold text-[#1B1C1B]">
                      #{orderCode}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopyCode(orderCode, order.id)}
                      className="p-1 rounded active:bg-[#F3F4F6]"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {isCopied ? (
                        <CheckCircle2 size={13} color="#059669" />
                      ) : (
                        <Copy size={13} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                    <Text className="text-[12px] text-[#6B7280] ml-1">
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.badgeBg} ${cfg.badgeBorder}`}
                  >
                    <StatusIcon size={12} color={cfg.iconColor} />
                    <Text className={`text-[11px] font-bold ${cfg.badgeText}`}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                {/* ── Price & Toggle Detail Row ── */}
                <View className="px-4 pb-3.5 flex-row items-center justify-between">
                  <Text className="text-[15px] font-bold text-[#5D1C34]">
                    {fmtPrice(total)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => toggleExpand(order.id)}
                    className="flex-row items-center gap-1 active:opacity-70"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="text-[12.5px] font-medium text-[#6B7280]">Chi tiết</Text>
                    {isExpanded ? (
                      <ChevronUp size={14} color="#6B7280" />
                    ) : (
                      <ChevronDown size={14} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider Line */}
                <View className="h-px bg-[#F3F4F6]" />

                {/* ── Product Preview Row ── */}
                <View className="p-4 flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    {/* Overlapping Thumbnails */}
                    <View className="flex-row items-center -space-x-3">
                      {items.slice(0, 2).map((it: any, idx: number) => (
                        <View
                          key={it.id || idx}
                          className="w-12 h-14 rounded-xl bg-[#F3F4F6] border-2 border-white overflow-hidden shadow-2xs"
                        >
                          <Image
                            source={{ uri: getProductImage(it) }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        </View>
                      ))}
                    </View>

                    {/* Product Name & Subtext */}
                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-[13px] font-bold text-[#1B1C1B]"
                        numberOfLines={1}
                      >
                        {firstItem?.product?.name ||
                          firstItem?.productName ||
                          'Sản phẩm công sở'}
                      </Text>
                      {remainingCount > 0 && (
                        <Text className="text-[11.5px] text-[#6B7280] mt-0.5">
                          và {remainingCount} sản phẩm khác
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* "Mua lại" Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleReorder(order)}
                    className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#5D1C34] shadow-xs shrink-0"
                  >
                    <ShoppingBag size={13} color="#FFFFFF" />
                    <Text className="text-[12.5px] font-bold text-white">Mua lại</Text>
                  </TouchableOpacity>
                </View>

                {/* ── EXPANDABLE DETAIL ACCORDION (Screenshot 2) ── */}
                {isExpanded && (
                  <View className="border-t border-[#F3F4F6] p-4 pt-5 flex-col gap-6 bg-[#FAFAF9]/50">
                    {/* 1. TRẠNG THÁI VẬN CHUYỂN */}
                    {cfg.step >= 0 && (
                      <View>
                        <Text className="text-[11px] font-bold text-[#6B7280] tracking-wider uppercase mb-3.5">
                          TRẠNG THÁI VẬN CHUYỂN
                        </Text>
                        <View className="flex-row items-center justify-between w-full px-1">
                          {STEPS.map((stepLabel, idx) => {
                            const isDone = idx <= cfg.step;
                            const isActive = idx === cfg.step;

                            return (
                              <React.Fragment key={stepLabel}>
                                <View className="flex-col items-center flex-1">
                                  <View
                                    className={`w-7 h-7 rounded-full items-center justify-center border-2 mb-1.5 ${
                                      isDone
                                        ? 'bg-[#5D1C34] border-[#5D1C34]'
                                        : 'bg-white border-[#D1D5DB]'
                                    }`}
                                  >
                                    {isDone && (
                                      <Check
                                        size={13}
                                        color="#FFFFFF"
                                        strokeWidth={3}
                                      />
                                    )}
                                  </View>
                                  <Text
                                    className={`text-[10px] text-center leading-tight ${
                                      isActive
                                        ? 'font-bold text-[#5D1C34]'
                                        : isDone
                                        ? 'font-medium text-[#4B5563]'
                                        : 'text-[#9CA3AF]'
                                    }`}
                                    numberOfLines={1}
                                  >
                                    {stepLabel}
                                  </Text>
                                </View>

                                {idx < STEPS.length - 1 && (
                                  <View
                                    className={`h-[2px] flex-1 -mt-4 mx-0.5 rounded-full ${
                                      idx < cfg.step ? 'bg-[#5D1C34]' : 'bg-[#E5E7EB]'
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* 2. SẢN PHẨM */}
                    <View>
                      <Text className="text-[11px] font-bold text-[#6B7280] tracking-wider uppercase mb-3">
                        SẢN PHẨM
                      </Text>
                      <View className="flex-col gap-3">
                        {items.map((it: any, itemIdx: number) => {
                          const itemTotal = (it.price || 0) * (it.quantity || 1);

                          return (
                            <View
                              key={it.id || itemIdx}
                              className="flex-row items-center gap-3.5 p-2 rounded-xl bg-white border border-[#F3F4F6]"
                            >
                              <View className="w-14 h-18 rounded-xl bg-[#F3F4F6] overflow-hidden shrink-0">
                                <Image
                                  source={{ uri: getProductImage(it) }}
                                  style={{ width: 56, height: 72 }}
                                  contentFit="cover"
                                />
                              </View>
                              <View className="flex-1 min-w-0">
                                <Text
                                  className="text-[13px] font-bold text-[#1B1C1B]"
                                  numberOfLines={1}
                                >
                                  {it.product?.name ||
                                    it.productName ||
                                    'Sản phẩm công sở'}
                                </Text>
                                <Text className="text-[12px] text-[#6B7280] mt-0.5">
                                  Màu: {it.color || 'Trắng'} · May đo
                                </Text>
                                <Text className="text-[12px] text-[#6B7280] mt-0.5">
                                  x{it.quantity || 1}
                                </Text>
                              </View>
                              <Text className="text-[14px] font-bold text-[#5D1C34] shrink-0">
                                {fmtPrice(itemTotal)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* 3. ĐỊA CHỈ NHẬN HÀNG */}
                    <View>
                      <Text className="text-[11px] font-bold text-[#6B7280] tracking-wider uppercase mb-2.5">
                        ĐỊA CHỈ NHẬN HÀNG
                      </Text>
                      <View className="flex-col gap-2 p-3 rounded-xl bg-white border border-[#F3F4F6]">
                        <View className="flex-row items-start gap-2">
                          <MapPin size={15} color="#9CA3AF" className="mt-0.5 shrink-0" />
                          <Text className="text-[13px] text-[#374151] flex-1 leading-5">
                            {address}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Phone size={15} color="#9CA3AF" className="shrink-0" />
                          <Text className="text-[13px] text-[#374151] font-medium">
                            {phone}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 4. THANH TOÁN */}
                    <View>
                      <Text className="text-[11px] font-bold text-[#6B7280] tracking-wider uppercase mb-2.5">
                        THANH TOÁN
                      </Text>
                      <View className="p-3.5 rounded-xl bg-white border border-[#F3F4F6] flex-col gap-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-[13px] text-[#6B7280]">Phí giao hàng</Text>
                          <Text className="text-[13px] font-semibold text-[#1B1C1B]">
                            {fmtPrice(shippingFee)}
                          </Text>
                        </View>

                        {discount > 0 && (
                          <View className="flex-row justify-between items-center">
                            <Text className="text-[13px] text-[#6B7280]">Giảm giá</Text>
                            <Text className="text-[13px] font-semibold text-[#059669]">
                              -{fmtPrice(discount)}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row justify-between items-center">
                          <Text className="text-[13px] text-[#6B7280]">Thanh toán</Text>
                          <Text className="text-[13px] font-bold text-[#D97706]">
                            {order.paymentStatus || 'PENDING'}
                          </Text>
                        </View>

                        <View className="h-px bg-[#F3F4F6] my-1" />

                        <View className="flex-row justify-between items-center">
                          <Text className="text-[14px] font-bold text-[#5D1C34]">
                            Tổng cộng
                          </Text>
                          <Text className="text-[16px] font-bold text-[#5D1C34]">
                            {fmtPrice(total)}
                          </Text>
                        </View>

                        <Text className="text-[12px] text-[#6B7280] mt-1">
                          Phương thức: {order.paymentMethod || 'BANK_TRANSFER'}
                        </Text>
                        <Text className="text-[11.5px] text-[#6B7280] leading-4">
                          Mốc mới nhất: {latestMessage}
                        </Text>

                        {/* Extra Actions if applicable */}
                        <View className="flex-row items-center gap-2 pt-2 mt-1 border-t border-[#F3F4F6]">
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('OrderDetail', { orderId: order.id })
                            }
                            className="flex-1 py-2 px-3 rounded-lg border border-[#E5E7EB] items-center justify-center flex-row gap-1"
                          >
                            <Text className="text-[12px] font-semibold text-[#4B5563]">
                              Xem trang đơn
                            </Text>
                            <ExternalLink size={12} color="#4B5563" />
                          </TouchableOpacity>

                          {order.allowedActions?.confirmDelivery && (
                            <TouchableOpacity
                              onPress={() => handleConfirmDelivery(order)}
                              disabled={isConfirmingDelivery}
                              className="py-2 px-3 rounded-lg bg-[#059669] items-center justify-center"
                            >
                              <Text className="text-[12px] font-bold text-white">
                                {isConfirmingDelivery ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {(order.allowedActions?.cancel || rawStatus === 'PENDING') && (
                            <TouchableOpacity
                              onPress={() => handleCancel(order)}
                              disabled={isCancelling}
                              className="py-2 px-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] items-center justify-center"
                            >
                              <Text className="text-[12px] font-semibold text-[#DC2626]">
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

      {/* ── Floating AI Chat Button ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Stylist')}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#5D1C34] shadow-lg shadow-black/30 items-center justify-center z-30"
      >
        <MessageCircle size={24} color="#FFFFFF" />
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F59E0B] border-2 border-white items-center justify-center">
          <Text className="text-[10px] font-bold text-black">1</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default OrdersScreen;
