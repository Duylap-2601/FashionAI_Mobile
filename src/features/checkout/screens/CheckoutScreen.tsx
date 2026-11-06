import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Wallet,
  X,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/features/cart/hooks/use-cart';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';
import {
  IOrderShippingInfo,
  IUnpaidOrder,
  OrderCreatePayload,
  ordersApi,
} from '@/features/orders/api/orders.api';
import { useUnpaidOrders } from '@/features/orders/hooks/use-orders';
import { EPaymentMethod } from '@/features/orders/types/order';
import {
  getCheckoutSubtotal,
  getUnpaidOrderCode,
  getUnpaidOrderTotal,
} from '@/features/checkout/utils/checkout-display';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/types/api';
import { IUserAddress } from '@/features/profile/api/users.api';
import { AddressForm, IAddressDraft } from '@/features/profile/components/AddressForm';
import { useUserAddresses } from '@/features/profile/hooks/use-address-book';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';

const CHECKOUT_STEPS = ['Giỏ hàng', 'Giao hàng & thanh toán', 'Hoàn tất'];
const ACTIVE_STEP = 1;
const NOTE_QUOTE_DELAY_MS = 600;

function formatAddress(address: IUserAddress) {
  return [address.addressLine, address.wardName, address.provinceName]
    .filter(Boolean)
    .join(', ');
}

function formatDraftAddress(address: IAddressDraft) {
  return [address.addressLine, address.wardName, address.provinceName]
    .filter(Boolean)
    .join(', ');
}

function buildShippingInfo(address: IAddressDraft): IOrderShippingInfo {
  return {
    name: address.recipientName,
    phone: address.phone,
    address: formatDraftAddress(address),
    provinceName: address.provinceName,
    wardName: address.wardName,
    ghnProvinceV3Id: address.ghnProvinceV3Id,
    ghnWardV3Id: address.ghnWardV3Id,
  };
}

function isAddressError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'ADDRESS_RECONFIRM_REQUIRED' ||
      error.code === 'SHIPPING_ROUTE_UNAVAILABLE' ||
      error.code === 'ADDRESS_VERSION_CONFLICT' ||
      error.code === 'ADDRESS_INVALID')
  );
}

function getQuoteErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return 'Không thể tính phí vận chuyển. Vui lòng thử lại.';
  }
  if (
    error.code === 'ADDRESS_RECONFIRM_REQUIRED' ||
    error.code === 'SHIPPING_ROUTE_UNAVAILABLE'
  ) {
    return 'GHN báo địa chỉ này không giao được. Vui lòng kiểm tra lại số nhà và Phường/Xã.';
  }
  if (error.code === 'ADDRESS_VERSION_CONFLICT') {
    return 'Địa chỉ vừa được cập nhật. Vui lòng tải lại địa chỉ rồi thử lại.';
  }
  if (error.code === 'ADDRESS_INVALID') {
    return error.message || 'Địa chỉ giao hàng không hợp lệ.';
  }
  return error.message || 'Không thể tính phí vận chuyển. Vui lòng thử lại.';
}

function getCouponErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  return 'Mã giảm giá không dùng được cho đơn này.';
}

interface ISectionHeadingProps {
  index: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function SectionHeading({ index, title, description, action }: ISectionHeadingProps) {
  return (
    <View className="mb-4 flex-row items-end justify-between gap-3">
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-baseline gap-2.5">
          <Text className="font-mono text-[13px] text-brass-ink">{index}</Text>
          <Text className="flex-1 font-display text-[20px] leading-tight text-landing-obsidian">
            {title}
          </Text>
        </View>
        {description ? (
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

interface IOutlineActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
}

function OutlineAction({
  label,
  onPress,
  disabled,
  compact,
  accessibilityLabel,
}: IOutlineActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      className={`shrink-0 items-center justify-center rounded-subtle border border-landing-line px-3.5 ${
        compact ? 'h-9' : 'h-11'
      } ${disabled ? 'opacity-50' : 'active:bg-ivory'}`}
    >
      <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
        {label}
      </Text>
    </Pressable>
  );
}

interface IPaymentCardProps {
  selected: boolean;
  title: string;
  description: string;
  mark: React.ReactNode;
  onPress: () => void;
}

function PaymentCard({ selected, title, description, mark, onPress }: IPaymentCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-row items-start gap-3 rounded-subtle border px-4 py-3.5 ${
        selected ? 'border-oxblood bg-ivory' : 'border-landing-line bg-ivory/50 active:bg-ivory'
      }`}
    >
      <View
        className={`mt-0.5 h-4 w-4 items-center justify-center rounded-subtle border ${
          selected ? 'border-oxblood' : 'border-taupe'
        }`}
      >
        {selected ? <View className="h-2 w-2 bg-oxblood" /> : null}
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          {mark}
          <Text className="flex-1 font-sans text-body-md font-medium text-landing-obsidian">
            {title}
          </Text>
        </View>
        <Text className="mt-1 font-sans text-xs leading-relaxed text-landing-muted">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

interface IUnpaidOrdersNoticeProps {
  orders: IUnpaidOrder[];
  onPayOrder: (orderId: string) => void;
}

/** Nhắc khách thanh toán đơn cũ còn chờ trả tiền thay vì đặt thêm đơn trùng (giống web). */
function UnpaidOrdersNotice({ orders, onPayOrder }: IUnpaidOrdersNoticeProps) {
  return (
    <View className="border-l-2 border-brass bg-ivory px-4 py-3.5">
      <Text className="font-sans text-body-md font-medium text-landing-obsidian">
        Bạn còn {orders.length} đơn chưa thanh toán
      </Text>
      <Text className="mt-1.5 font-sans text-xs leading-relaxed text-landing-muted">
        Nếu đây là các món bạn đã đặt, hãy thanh toán đơn cũ thay vì đặt thêm đơn mới. Đơn quá
        hạn thanh toán sẽ tự hủy.
      </Text>
      <View className="mt-3 border-y border-landing-line">
        {orders.map((order, index) => {
          const orderCode = getUnpaidOrderCode(order);
          return (
            <View
              key={order.id}
              className={`items-start gap-2 py-2.5 ${index > 0 ? 'border-t border-landing-line' : ''}`}
            >
              <Text className="font-sans text-xs leading-relaxed text-landing-muted">
                <Text className="font-mono text-landing-obsidian">{orderCode}</Text>
                {' · '}
                <Text className="font-mono text-landing-obsidian">
                  {formatCurrency(getUnpaidOrderTotal(order))}
                </Text>
                {order.paymentDueAt ? (
                  <>
                    {' · hạn '}
                    <Text className="font-mono">{formatDateTime(order.paymentDueAt)}</Text>
                  </>
                ) : null}
              </Text>
              <OutlineAction
                label="Thanh toán đơn này"
                accessibilityLabel={`Thanh toán đơn ${orderCode}`}
                onPress={() => onPayOrder(order.id)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<EPaymentMethod>(EPaymentMethod.ZALOPAY);
  const [shippingNote, setShippingNote] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponAttempt, setCouponAttempt] = useState(0);

  const {
    items,
    getTotalItems,
    isLoading: isCartLoading,
    isError: isCartError,
    refetch: refetchCart,
  } = useCart();
  const totalItems = getTotalItems();
  const { unpaidOrders, refetch: refetchUnpaidOrders } = useUnpaidOrders();
  // Checkout vẫn nằm dưới stack khi khách mở đơn cũ để trả tiền: quay lại thì tải lại danh sách
  // để không nhắc đơn vừa trả. Lần focus đầu bỏ qua vì query vừa tự tải khi mount.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      refetchUnpaidOrders();
    }, [refetchUnpaidOrders]),
  );

  const addressesQuery = useUserAddresses();
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState<IAddressDraft | null>(null);
  const [addressSeed, setAddressSeed] = useState<IUserAddress | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuoteNote(shippingNote), NOTE_QUOTE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shippingNote]);

  const selectedAddress = useMemo(() => {
    if (manualAddress) return null;
    return (
      addresses.find((address) => address.id === selectedAddressId) ??
      addresses.find((address) => address.isDefault) ??
      addresses[0] ??
      null
    );
  }, [addresses, manualAddress, selectedAddressId]);
  const hasShippingAddress = !!selectedAddress || !!manualAddress;

  const quoteAddress = useMemo(() => {
    if (selectedAddress) {
      return {
        shippingAddressId: selectedAddress.id,
        addressVersion: selectedAddress.version,
      };
    }
    if (manualAddress) {
      return { shippingInfo: buildShippingInfo(manualAddress) };
    }
    return null;
  }, [manualAddress, selectedAddress]);

  const quoteQuery = useQuery({
    queryKey: [
      'orderQuote',
      items,
      selectedAddress?.id,
      selectedAddress?.version,
      manualAddress,
      quoteNote,
      appliedCoupon,
      couponAttempt,
    ],
    queryFn: async ({ signal }) => {
      if (!quoteAddress) throw new Error('Chưa có địa chỉ giao hàng.');
      const basePayload = {
        items: items.map((item) => ({
          productId: item.productId,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
        })),
        ...quoteAddress,
        ...(quoteNote.trim() ? { shippingNote: quoteNote.trim() } : {}),
        paymentMethod: 'BANK_TRANSFER',
      };

      if (!appliedCoupon) {
        const quote = await ordersApi.quote(basePayload, { signal });
        return { quote, couponError: null as string | null };
      }

      try {
        const quote = await ordersApi.quote(
          { ...basePayload, couponCode: appliedCoupon },
          { signal },
        );
        return { quote, couponError: null as string | null };
      } catch (error) {
        if (isAddressError(error)) throw error;
        const quote = await ordersApi.quote(basePayload, { signal });
        return { quote, couponError: getCouponErrorMessage(error) };
      }
    },
    enabled: items.length > 0 && !!quoteAddress,
    staleTime: 4 * 60 * 1000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const quoteRes = quoteQuery.data?.quote;
  const couponError = quoteQuery.data?.couponError ?? null;
  const isCouponApplied = !!appliedCoupon && !couponError;
  const isQuoting = quoteQuery.isFetching;
  const quoteErrorMessage = quoteQuery.error
    ? getQuoteErrorMessage(quoteQuery.error)
    : null;
  const quoteReady = !!quoteRes && !isQuoting && !quoteErrorMessage;
  const shippingFee = quoteRes ? quoteRes.shippingFee : null;
  const discountAmount = Math.max(0, quoteRes?.discountAmount ?? 0);

  const localSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  // Chỉ để hiển thị: Tạm tính theo giá niêm yết, trừ dòng sale; Tổng cộng vẫn lấy từ báo giá.
  const { subtotal: displaySubtotal, saleDiscount } = getCheckoutSubtotal(
    quoteRes,
    localSubtotal,
  );
  const displayTotal = quoteRes?.totalAmount ?? localSubtotal;
  const isNotePending = shippingNote !== quoteNote;

  const createOrderMutation = useMutation({
    mutationFn: (payload: OrderCreatePayload) => ordersApi.createOrder(payload),
    // Đơn vừa tạo chưa trả tiền: quay lại checkout thì khối "đơn chưa thanh toán" phải có nó.
    // Không return promise để không bắt bước tạo thanh toán chờ tải lại danh sách đơn.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const checkoutPaymentMutation = useMutation({
    mutationFn: (payload: { orderId: string | number; provider: string }) =>
      paymentsApi.checkout(payload),
  });

  const { canOrder, completeness, byCategory } = useMeasurementsCompleteness();

  const manualInitial = useMemo<Partial<IUserAddress>>(() => {
    if (addressSeed) {
      return {
        recipientName: addressSeed.recipientName,
        phone: addressSeed.phone,
        addressLine: addressSeed.addressLine,
        ghnProvinceV3Id: addressSeed.ghnProvinceV3Id,
        ghnWardV3Id: addressSeed.ghnWardV3Id,
        provinceName: addressSeed.provinceName,
        wardName: addressSeed.wardName,
        isDefault: addressSeed.isDefault,
      };
    }
    if (manualAddress) {
      return {
        recipientName: manualAddress.recipientName,
        phone: manualAddress.phone,
        addressLine: manualAddress.addressLine,
        ghnProvinceV3Id: manualAddress.ghnProvinceV3Id,
        ghnWardV3Id: manualAddress.ghnWardV3Id,
        provinceName: manualAddress.provinceName,
        wardName: manualAddress.wardName,
        isDefault: manualAddress.isDefault,
      };
    }
    return {
      recipientName: user?.name ?? '',
      isDefault: addresses.length === 0,
    };
  }, [addressSeed, addresses.length, manualAddress, user?.name]);

  const handleChangeAddress = () => {
    if (addresses.length > 0) {
      setShowAddressPicker(true);
      return;
    }
    setAddressSeed(null);
    setShowManualForm(true);
  };

  const handleToggleAddForm = () => {
    if (showManualForm) {
      setShowManualForm(false);
      setAddressSeed(null);
      return;
    }
    setAddressSeed(null);
    setShowManualForm(true);
  };

  const handleEditSelectedAddress = () => {
    if (!selectedAddress) return;
    setAddressSeed(selectedAddress);
    setManualAddress(null);
    setShowManualForm(true);
  };

  const handleRetryQuote = async () => {
    const error = quoteQuery.error;
    const shouldReloadAddress =
      !!selectedAddress &&
      error instanceof ApiError &&
      (error.code === 'ADDRESS_VERSION_CONFLICT' || error.code === 'ADDRESS_INVALID');

    if (shouldReloadAddress) {
      await addressesQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ['orderQuote'] });
      return;
    }
    await quoteQuery.refetch();
  };

  const handleSelectSavedAddress = (address: IUserAddress) => {
    setSelectedAddressId(address.id);
    setManualAddress(null);
    setAddressSeed(null);
    setShowManualForm(false);
    setShowAddressPicker(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressPicker(false);
    setManualAddress(null);
    setAddressSeed(null);
    setShowManualForm(true);
  };

  const handleManualSubmit = (address: IAddressDraft) => {
    setManualAddress(address);
    setSelectedAddressId(null);
    setAddressSeed(null);
    setShowManualForm(false);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setAppliedCoupon(code);
    setCouponAttempt((value) => value + 1);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponCode('');
    setCouponAttempt((value) => value + 1);
  };

  const handlePlaceOrder = async () => {
    if (!hasShippingAddress) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng.');
      return;
    }
    if (!quoteReady || !quoteRes) {
      Alert.alert(
        'Chưa có báo giá',
        isQuoting
          ? 'Hệ thống đang tính phí vận chuyển. Vui lòng chờ một chút.'
          : quoteErrorMessage || 'Vui lòng kiểm tra lại địa chỉ giao hàng.',
      );
      return;
    }
    if (completeness && !canOrder) {
      const missingLabels: string[] = [];
      completeness.byCategory.forEach((cat: any) => {
        if (!cat.complete && cat.missing) {
          cat.missing.forEach((m: any) => {
            if (!missingLabels.includes(m.label)) missingLabels.push(m.label);
          });
        }
      });

      const missingText =
        missingLabels.length > 0
          ? `\n\nBạn còn thiếu các số đo: ${missingLabels.join(', ')}`
          : '';

      Alert.alert(
        'Chưa thể đặt hàng',
        `Vui lòng cập nhật đầy đủ số đo cơ thể trong hồ sơ trước khi đặt may.${missingText}`,
        [{ text: 'Đóng', style: 'cancel' }],
      );
      return;
    }

    const addressPayload = selectedAddress
      ? {
          shippingAddressId: selectedAddress.id,
          addressVersion: selectedAddress.version,
        }
      : manualAddress
        ? { shippingInfo: buildShippingInfo(manualAddress) }
        : null;

    if (!addressPayload) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng.');
      return;
    }

    try {
      const orderPayload: OrderCreatePayload = {
        items: items.map((item) => ({
          productId: item.productId,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
        })),
        ...addressPayload,
        quoteToken: quoteRes.quoteToken,
        totalAmount: quoteRes.totalAmount,
        paymentMethod: 'BANK_TRANSFER',
        ...(quoteNote.trim() ? { shippingNote: quoteNote.trim() } : {}),
        ...(isCouponApplied ? { couponCode: appliedCoupon } : {}),
      };

      const newOrder = await createOrderMutation.mutateAsync(orderPayload);
      const orderId = newOrder.id;

      const provider =
        paymentMethod === EPaymentMethod.SEPAY ? 'SEPAY' : 'ZALOPAY';
      const checkoutInfo = await checkoutPaymentMutation.mutateAsync({
        orderId,
        provider,
      });

      const url = checkoutInfo.checkoutUrl || checkoutInfo.payUrl;
      const qrCode = checkoutInfo.qrCode || url;

      if (url) {
        navigation.navigate('Payment', {
          checkoutUrl: url,
          provider,
          qrCode,
          orderCode: checkoutInfo.orderCode,
          totalAmount: quoteRes.totalAmount,
          paymentId: checkoutInfo.paymentId,
          orderId,
        });
      } else {
        Alert.alert('Lỗi', 'Không lấy được đường dẫn thanh toán.');
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === 'QUOTE_EXPIRED' || error.code === 'QUOTE_CHANGED')
      ) {
        await quoteQuery.refetch();
        Alert.alert(
          'Báo giá đã thay đổi',
          'Thông tin đơn hàng hoặc địa chỉ vừa được cập nhật. Vui lòng kiểm tra tổng tiền và đặt hàng lại.',
        );
        return;
      }
      if (error instanceof ApiError && error.code === 'ADDRESS_VERSION_CONFLICT') {
        await addressesQuery.refetch();
        await queryClient.invalidateQueries({ queryKey: ['orderQuote'] });
        Alert.alert(
          'Địa chỉ đã thay đổi',
          'Địa chỉ giao hàng vừa được cập nhật. Vui lòng kiểm tra lại thông tin và đặt hàng lại.',
        );
        return;
      }

      Alert.alert(
        'Lỗi đặt hàng',
        error instanceof ApiError
          ? error.message
          : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.',
      );
    }
  };

  const isSubmitting = createOrderMutation.isPending || checkoutPaymentMutation.isPending;
  const canPlaceOrder =
    hasShippingAddress &&
    quoteReady &&
    !isQuoting &&
    !isNotePending &&
    !isSubmitting;

  const submitLabel = isSubmitting
    ? 'Đang đặt hàng…'
    : isQuoting || isNotePending
      ? 'Đang cập nhật tổng tiền…'
      : 'Đặt hàng';

  const renderHeader = () => (
    <>
      <BackButton onPress={() => navigation.goBack()} label="Quay lại" />

      <View className="mt-4 gap-2 border-b border-landing-line pb-5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          Đặt hàng
        </Text>
        <Text
          accessibilityRole="header"
          className="font-display text-headline-lg text-landing-obsidian"
        >
          Giao hàng và thanh toán
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          Phí giao hàng do GHN báo theo địa chỉ. Tổng tiền được tính lại ở máy chủ trước khi tạo đơn.
        </Text>
      </View>

      <View className="flex-row gap-3 border-b border-landing-line pb-4">
        {CHECKOUT_STEPS.map((step, index) => (
          <View key={step} className="flex-1 gap-1">
            <Text
              className={`font-mono text-[10px] tracking-[0.14em] ${
                index === ACTIVE_STEP ? 'text-oxblood' : 'text-landing-muted'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text
              className={`font-sans text-[10px] font-semibold uppercase leading-[14px] tracking-[0.1em] ${
                index === ACTIVE_STEP ? 'text-oxblood' : 'text-landing-muted'
              }`}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  const measurementsGate = !canOrder && completeness ? (
    <View className="border-l-2 border-brass bg-ivory px-4 py-3.5">
      <Text className="font-sans text-body-md font-medium text-landing-obsidian">
        Cần bổ sung số đo để đặt may
      </Text>
      <Text className="mt-1.5 font-sans text-xs leading-relaxed text-landing-muted">
        Đơn may đo cần đủ số đo trong hồ sơ.
      </Text>
      <View className="mt-2.5 gap-1">
        {byCategory
          .filter((cat) => !cat.complete)
          .map((cat, index) => (
            <Text key={index} className="font-sans text-xs text-landing-muted">
              <Text className="font-mono text-[11px] text-landing-obsidian">
                {cat.category === 'UPPER'
                  ? 'Áo'
                  : cat.category === 'LOWER'
                    ? 'Quần/Váy'
                    : 'Đồ bộ'}
              </Text>
              {': '}
              {cat.missing.map((measurement) => measurement.label).join(' · ')}
            </Text>
          ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('Main', {
            screen: 'ProfileTab',
            params: { screen: 'Measurements' },
          })
        }
        className="mt-3 h-9 items-center justify-center self-start rounded-subtle border border-landing-line px-3.5 active:bg-landing-paper"
      >
        <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
          Cập nhật số đo
        </Text>
      </Pressable>
    </View>
  ) : null;

  const addressCard = hasShippingAddress ? (
    <View className="rounded-subtle border border-landing-line bg-ivory px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline">
          <Text className="font-sans text-body-md font-medium text-landing-obsidian">
            {selectedAddress?.recipientName || manualAddress?.recipientName}
          </Text>
          {selectedAddress?.isDefault || manualAddress?.isDefault ? (
            <Text className="ml-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
              Mặc định
            </Text>
          ) : null}
        </View>
        <Text className="shrink-0 font-mono text-xs text-landing-muted">
          {selectedAddress?.phone || manualAddress?.phone}
        </Text>
      </View>
      <Text className="mt-1.5 font-sans text-body-sm leading-relaxed text-landing-muted">
        {selectedAddress
          ? formatAddress(selectedAddress)
          : manualAddress
            ? formatDraftAddress(manualAddress)
            : ''}
      </Text>

      {isQuoting ? (
        <View className="mt-3 flex-row items-center gap-2">
          <ActivityIndicator size="small" color={COLORS.oxblood} />
          <Text className="font-sans text-xs text-landing-muted">
            Đang tính phí giao hàng…
          </Text>
        </View>
      ) : quoteErrorMessage ? (
        <View className="mt-3 border-l-2 border-danger pl-3">
          <Text className="font-sans text-xs leading-relaxed text-danger">
            {quoteErrorMessage}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRetryQuote}
            className="mt-2 h-9 flex-row items-center gap-1.5 self-start rounded-subtle border border-landing-line px-3 active:bg-landing-paper"
          >
            <RefreshCw size={13} strokeWidth={1.75} color={COLORS.oxblood} />
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Thử lại
            </Text>
          </Pressable>
        </View>
      ) : quoteReady ? (
        <View className="mt-3 flex-row items-center gap-1.5">
          <CheckCircle2 size={14} strokeWidth={1.75} color={COLORS.sageInk} />
          <Text className="font-sans text-xs text-sage-ink">
            GHN hỗ trợ giao đến địa chỉ này
          </Text>
        </View>
      ) : null}

      <View className="mt-3.5 flex-row items-center gap-2">
        <OutlineAction label="Đổi địa chỉ" onPress={handleChangeAddress} compact />
        <OutlineAction label="Sửa" onPress={handleEditSelectedAddress} compact />
      </View>

      {showManualForm ? (
        <View className="mt-4">
          <AddressForm
            key={addressSeed?.id ?? (manualAddress ? 'manual-filled' : 'manual-empty')}
            initial={manualInitial}
            mode="checkout"
            onCancel={() => {
              setShowManualForm(false);
              setAddressSeed(null);
            }}
            onSubmit={handleManualSubmit}
          />
        </View>
      ) : null}
    </View>
  ) : (
    <View className="gap-3 rounded-subtle border border-landing-line bg-ivory px-5 py-8">
      {addressesQuery.isLoading ? (
        <View className="items-center gap-2.5">
          <ActivityIndicator size="small" color={COLORS.oxblood} />
          <Text className="font-sans text-body-sm text-landing-muted">
            Đang tải sổ địa chỉ…
          </Text>
        </View>
      ) : addressesQuery.isError ? (
        <View className="items-center gap-2">
          <MapPin size={24} strokeWidth={1.5} color={COLORS.oxblood} />
          <Text className="text-center font-sans text-body-sm text-danger">
            {addressesQuery.error instanceof ApiError
              ? addressesQuery.error.message
              : 'Không thể tải sổ địa chỉ.'}
          </Text>
          <OutlineAction label="Thử lại" onPress={() => addressesQuery.refetch()} compact />
        </View>
      ) : (
        <>
          <Text className="font-display text-[19px] leading-tight text-landing-obsidian">
            Bạn chưa có địa chỉ giao hàng.
          </Text>
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            Thêm một địa chỉ để GHN báo phí giao.
          </Text>
          {showManualForm ? (
            <View className="mt-1">
              <AddressForm
                key="manual-empty"
                initial={manualInitial}
                mode="checkout"
                onCancel={() => {
                  setShowManualForm(false);
                  setAddressSeed(null);
                }}
                onSubmit={handleManualSubmit}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  if (isCartError) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-lg px-lg pb-giant pt-lg"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          <View className="items-center justify-center gap-3 rounded-subtle border border-landing-line bg-ivory px-6 py-16">
            <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
              Không tải được giỏ hàng
            </Text>
            <Text className="max-w-[260px] text-center font-sans text-sm leading-relaxed text-landing-muted">
              Kiểm tra kết nối mạng rồi thử lại.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => refetchCart()}
              className="mt-2 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:bg-landing-paper"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Thử lại
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (isCartLoading && items.length === 0) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="small" color={COLORS.oxblood} />
          <Text className="font-sans text-body-sm text-landing-muted">
            Đang tải giỏ hàng…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-lg px-lg pb-giant pt-lg"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        {items.length === 0 ? (
          <View className="items-center justify-center gap-3 rounded-subtle border border-landing-line bg-ivory px-6 py-16">
            <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
              Giỏ hàng đang trống
            </Text>
            <Text className="max-w-[260px] text-center font-sans text-sm leading-relaxed text-landing-muted">
              Chọn một thiết kế rồi quay lại đây để đặt may.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              className="mt-2 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:bg-landing-paper"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Quay lại
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Ẩn khi đang tạo đơn/thanh toán, giống web ẩn lúc khoá món chờ trả tiền. */}
            {unpaidOrders.length > 0 && !isSubmitting ? (
              <UnpaidOrdersNotice
                orders={unpaidOrders}
                onPayOrder={(orderId) => navigation.navigate('OrderDetail', { orderId })}
              />
            ) : null}

            {measurementsGate}

            <View className="border-t border-landing-line pt-6">
              <SectionHeading
                index="01"
                title="Địa chỉ giao hàng"
                description="Kiểm tra kỹ: không đổi được địa chỉ sau khi đặt hàng."
                action={
                  <OutlineAction
                    label={showManualForm ? 'Đóng' : 'Thêm địa chỉ'}
                    onPress={handleToggleAddForm}
                  />
                }
              />
              {addressCard}

              <View className="mt-5">
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                  Ghi chú giao hàng
                </Text>
                <TextInput
                  value={shippingNote}
                  onChangeText={setShippingNote}
                  placeholder="Ví dụ: giao giờ hành chính"
                  placeholderTextColor={COLORS.muted}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  className="mt-2 min-h-[88px] rounded-subtle border border-landing-line bg-ivory px-3.5 py-3 font-sans text-body-md leading-relaxed text-landing-obsidian"
                />
              </View>
            </View>

            <View className="border-t border-landing-line pt-6">
              <SectionHeading
                index="02"
                title="Phương thức thanh toán"
                description="Đơn được xác nhận khi cổng thanh toán báo đã nhận tiền."
              />
              <View className="gap-2.5" accessibilityRole="radiogroup">
                <PaymentCard
                  selected={paymentMethod === EPaymentMethod.ZALOPAY}
                  onPress={() => setPaymentMethod(EPaymentMethod.ZALOPAY)}
                  title="ZaloPay"
                  description="Quét QR hoặc mở ứng dụng ZaloPay. Trạng tự cập nhật khi thanh toán xong."
                  mark={
                    <View className="h-7 w-7 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper">
                      <Wallet size={14} strokeWidth={1.75} color={COLORS.oxblood} />
                    </View>
                  }
                />
                <PaymentCard
                  selected={paymentMethod === EPaymentMethod.SEPAY}
                  onPress={() => setPaymentMethod(EPaymentMethod.SEPAY)}
                  title="Chuyển khoản ngân hàng"
                  description="Qua cổng SePay. Ghi đúng nội dung chuyển khoản để đơn được xác nhận tự động."
                  mark={
                    <View className="h-7 w-7 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper">
                      <QrCode size={14} strokeWidth={1.75} color={COLORS.oxblood} />
                    </View>
                  }
                />
              </View>
            </View>

            <View className="rounded-subtle border border-landing-line bg-ivory p-5">
              <View className="flex-row items-baseline justify-between gap-4">
                <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
                  Đơn hàng
                </Text>
                <Text className="font-sans text-xs text-landing-muted">
                  <Text className="font-mono text-landing-obsidian">{totalItems}</Text> sản phẩm
                </Text>
              </View>

              {items.map((item, index) => (
                <View key={index} className="mt-3 flex-row items-center gap-3">
                  <View className="h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-subtle bg-ivory">
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <ShoppingBag size={16} strokeWidth={1.25} color={COLORS.muted} />
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-sans text-body-md text-landing-obsidian"
                    >
                      {item.productName}
                    </Text>
                    <Text className="mt-0.5 font-sans text-xs text-landing-muted">
                      Màu: {item.color || 'Mặc định'} · SL {item.quantity}
                    </Text>
                  </View>
                  <Text className="shrink-0 font-mono text-sm text-landing-obsidian">
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              ))}

              <View className="mt-4 border-t border-landing-line pt-4">
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                  Mã giảm giá
                </Text>
                <View className="mt-2 flex-row items-center gap-2">
                  <TextInput
                    value={couponCode}
                    onChangeText={setCouponCode}
                    onSubmitEditing={handleApplyCoupon}
                    editable={!isCouponApplied}
                    placeholder="Nhập mã"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="h-11 flex-1 rounded-subtle border border-landing-line bg-landing-paper px-3 font-mono text-body-md uppercase text-landing-obsidian"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={isCouponApplied ? handleRemoveCoupon : handleApplyCoupon}
                    disabled={!isCouponApplied && !couponCode.trim()}
                    className={`h-11 items-center justify-center rounded-subtle border border-landing-line px-4 active:bg-landing-paper ${
                      !isCouponApplied && !couponCode.trim() ? 'opacity-50' : ''
                    }`}
                  >
                    <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                      {isCouponApplied ? 'Bỏ mã' : 'Áp dụng'}
                    </Text>
                  </Pressable>
                </View>
                {appliedCoupon && isQuoting && !couponError ? (
                  <Text className="mt-2 font-sans text-xs text-landing-muted">
                    Đang kiểm tra mã…
                  </Text>
                ) : null}
                {isCouponApplied && discountAmount > 0 ? (
                  <Text className="mt-2 font-sans text-xs text-sage-ink">
                    Đã giảm{' '}
                    <Text className="font-mono">{formatCurrency(discountAmount)}</Text>
                  </Text>
                ) : null}
                {couponError && couponCode.trim().toUpperCase() === appliedCoupon ? (
                  <Text
                    accessibilityRole="alert"
                    className="mt-2 border-l-2 border-danger pl-2 font-sans text-xs leading-relaxed text-danger"
                  >
                    {couponError}
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 gap-2.5 border-t border-landing-line pt-4">
                <View className="flex-row items-baseline justify-between gap-4">
                  <Text className="font-sans text-sm text-landing-muted">Tạm tính</Text>
                  <Text className="font-mono text-sm text-landing-obsidian">
                    {formatCurrency(displaySubtotal)}
                  </Text>
                </View>
                {saleDiscount > 0 ? (
                  <View className="flex-row items-baseline justify-between gap-4">
                    <Text className="font-sans text-sm text-landing-muted">Giảm giá sale</Text>
                    <Text className="font-mono text-sm text-sage-ink">
                      -{formatCurrency(saleDiscount)}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row items-baseline justify-between gap-4">
                  <Text className="font-sans text-sm text-landing-muted">
                    Phí giao hàng (GHN)
                  </Text>
                  <Text
                    className={`text-sm ${
                      shippingFee === null ? 'font-sans text-landing-muted' : 'font-mono text-landing-obsidian'
                    }`}
                  >
                    {shippingFee === null
                      ? 'Tính theo địa chỉ'
                      : shippingFee === 0
                        ? 'Miễn phí'
                        : formatCurrency(shippingFee)}
                  </Text>
                </View>
                {discountAmount > 0 ? (
                  <View className="flex-row items-baseline justify-between gap-4">
                    <Text className="font-sans text-sm text-landing-muted">Mã giảm giá</Text>
                    <Text className="font-mono text-sm text-sage-ink">
                      -{formatCurrency(discountAmount)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="mt-4 flex-row items-end justify-between gap-4 border-t border-landing-line pt-4">
                <Text className="font-sans text-sm text-landing-obsidian">
                  Tổng cộng
                  {shippingFee === null ? (
                    <Text className="font-sans text-xs text-landing-muted">
                      {'\n'}Chưa gồm phí giao hàng
                    </Text>
                  ) : null}
                </Text>
                <Text
                  className={`font-mono text-[22px] text-oxblood ${
                    isQuoting || isNotePending ? 'opacity-50' : ''
                  }`}
                >
                  {formatCurrency(displayTotal)}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canPlaceOrder }}
                onPress={handlePlaceOrder}
                disabled={!canPlaceOrder}
                className={`mt-5 h-12 flex-row items-center justify-center gap-2 rounded-subtle ${
                  canPlaceOrder ? 'bg-oxblood active:bg-landing-obsidian' : 'bg-oxblood/40'
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.paper} />
                ) : null}
                <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                  {submitLabel}
                </Text>
                {!isSubmitting ? (
                  <ArrowRight size={15} strokeWidth={1.75} color={COLORS.paper} />
                ) : null}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAddressPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <SafeAreaView className="flex-1 bg-landing-paper">
          <View className="flex-row items-center justify-between border-b border-landing-line px-4 py-3">
            <Text className="flex-1 font-display text-headline-sm text-landing-obsidian">
              Chọn địa chỉ giao hàng
            </Text>
            <Pressable
              onPress={() => setShowAddressPicker(false)}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              className="-mr-2 min-h-11 min-w-11 items-center justify-center active:opacity-60"
            >
              <X size={20} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>
          </View>

          <FlatList
            className="flex-1"
            data={addresses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <MapPin size={30} strokeWidth={1.5} color={COLORS.oxblood} />
                <Text className="mt-3 text-center font-sans text-body-md text-landing-muted">
                  Bạn chưa có địa chỉ giao hàng.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedAddressId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelectSavedAddress(item)}
                  className={`mb-2.5 rounded-subtle border px-4 py-3.5 ${
                    isSelected
                      ? 'border-oxblood bg-ivory'
                      : 'border-landing-line bg-ivory/50 active:bg-ivory'
                  }`}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 flex-row flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Text className="font-sans text-body-md font-medium text-landing-obsidian">
                        {item.recipientName}
                      </Text>
                      {item.isDefault ? (
                        <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                          Mặc định
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Check size={16} strokeWidth={1.75} color={COLORS.oxblood} />
                    ) : null}
                  </View>
                  <Text className="mt-1 font-mono text-xs text-landing-muted">
                    {item.phone}
                  </Text>
                  <Text className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                    {formatAddress(item)}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View className="border-t border-landing-line px-4 py-4">
            <Pressable
              accessibilityRole="button"
              onPress={handleAddNewAddress}
              className="h-12 flex-row items-center justify-center gap-2 rounded-subtle border border-landing-line active:bg-ivory"
            >
              <Plus size={15} strokeWidth={1.75} color={COLORS.oxblood} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Thêm địa chỉ mới
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
