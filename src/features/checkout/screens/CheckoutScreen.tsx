import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { formatCurrency } from '@/utils/format';
import {
  IOrderShippingInfo,
  OrderCreatePayload,
  ordersApi,
} from '@/features/orders/api/orders.api';
import { EPaymentMethod } from '@/features/orders/types/order';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { IUserAddress } from '@/features/profile/api/users.api';
import { AddressForm, IAddressDraft } from '@/features/profile/components/AddressForm';
import { useUserAddresses } from '@/features/profile/hooks/use-address-book';

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

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<EPaymentMethod>(EPaymentMethod.SEPAY);

  const { items, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  const addressesQuery = useUserAddresses();
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState<IAddressDraft | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

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
    ],
    queryFn: ({ signal }) => {
      if (!quoteAddress) throw new Error('Chưa có địa chỉ giao hàng.');
      return ordersApi.quote(
        {
          items: items.map((item) => ({
            productId: item.productId,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
          })),
          ...quoteAddress,
          paymentMethod: 'BANK_TRANSFER',
        },
        { signal },
      );
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

  const quoteRes = quoteQuery.data;
  const isQuoting = quoteQuery.isFetching;
  const quoteErrorMessage = quoteQuery.error
    ? getQuoteErrorMessage(quoteQuery.error)
    : null;
  const quoteReady = !!quoteRes && !isQuoting && !quoteErrorMessage;
  const shippingFee = quoteRes?.shippingFee ?? 0;

  const localSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const localTotal = localSubtotal + shippingFee;
  const displaySubtotal = quoteRes?.itemsTotal ?? localSubtotal;
  const displayTotal = quoteRes?.totalAmount ?? localTotal;

  const createOrderMutation = useMutation({
    mutationFn: (payload: OrderCreatePayload) => ordersApi.createOrder(payload),
  });

  const checkoutPaymentMutation = useMutation({
    mutationFn: (payload: { orderId: string | number; provider: string }) =>
      paymentsApi.checkout(payload),
  });

  const { canOrder, completeness, byCategory } = useMeasurementsCompleteness();

  const manualInitial = useMemo<Partial<IUserAddress>>(() => {
    if (manualAddress) {
      return {
        recipientName: manualAddress.recipientName,
        phone: manualAddress.phone,
        addressLine: manualAddress.addressLine,
        ghnProvinceV3Id: manualAddress.ghnProvinceV3Id,
        ghnWardV3Id: manualAddress.ghnWardV3Id,
        provinceName: manualAddress.provinceName,
        wardName: manualAddress.wardName,
      };
    }
    return { recipientName: user?.name ?? '' };
  }, [manualAddress, user?.name]);

  const handleChangeAddress = () => {
    if (addresses.length > 0) {
      setShowAddressPicker(true);
      return;
    }
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
    setShowManualForm(false);
    setShowAddressPicker(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressPicker(false);
    setManualAddress(null);
    setShowManualForm(true);
  };

  const handleManualSubmit = (address: IAddressDraft) => {
    setManualAddress(address);
    setSelectedAddressId(null);
    setShowManualForm(false);
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

  const canPlaceOrder =
    hasShippingAddress &&
    quoteReady &&
    !isQuoting &&
    createOrderMutation.isPending === false &&
    checkoutPaymentMutation.isPending === false;

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <View className="flex-row items-center border-b border-surface-line bg-surface-lowest px-4 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="-ml-2 min-h-11 min-w-11 items-center justify-center rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 pr-8 text-center text-headline-sm font-semibold text-on-surface">
          Thanh toán
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!canOrder && completeness && (
          <View className="mx-4 my-2 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <Text className="mb-2 text-body-md font-bold text-danger">
              Cần bổ sung số đo cơ thể
            </Text>
            <Text className="mb-3 text-body-sm text-on-surface-variant">
              Giỏ hàng của bạn có trang phục may đo. Vui lòng cập nhật đầy đủ các
              số đo sau:
            </Text>
            <View className="mb-3 pl-2">
              {byCategory
                .filter((cat) => !cat.complete)
                .map((cat, index) => (
                  <View key={index} className="mb-2">
                    <Text className="mb-1 text-label-md font-semibold text-danger">
                      {cat.category === 'UPPER'
                        ? 'Áo (Thân trên)'
                        : cat.category === 'LOWER'
                          ? 'Quần/Váy (Thân dưới)'
                          : 'Đồ bộ (Toàn thân)'}
                      :
                    </Text>
                    {cat.missing.map((measurement, measurementIndex) => (
                      <Text
                        key={measurementIndex}
                        className="text-body-sm text-on-surface-variant"
                      >
                        • {measurement.label}
                      </Text>
                    ))}
                  </View>
                ))}
            </View>
            <Pressable
              className="self-start rounded-lg bg-danger px-4 py-2 active:opacity-80"
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'ProfileTab',
                  params: { screen: 'Measurements' },
                })
              }
            >
              <Text className="text-label-md font-bold text-white">
                Cập nhật số đo
              </Text>
            </Pressable>
          </View>
        )}

        <View className="mb-2 mt-2 border-y border-surface-line bg-surface-lowest p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-headline-sm font-bold text-on-surface">Giao đến</Text>
            <Pressable
              onPress={handleChangeAddress}
              disabled={addressesQuery.isLoading}
              className="min-h-11 flex-row items-center p-1 active:opacity-70"
            >
              <Text className="mr-1 text-label-md font-semibold text-primary">
                {hasShippingAddress ? 'Thay đổi' : 'Chọn địa chỉ'}
              </Text>
              <ChevronRight size={16} color="#5D1C34" />
            </Pressable>
          </View>

          {addressesQuery.isLoading && !manualAddress ? (
            <View className="flex-row items-center rounded-xl border border-surface-line bg-surface p-3">
              <ActivityIndicator size="small" color="#5D1C34" />
              <Text className="ml-3 text-body-sm text-on-surface-variant">
                Đang tải sổ địa chỉ...
              </Text>
            </View>
          ) : addressesQuery.isError && !manualAddress ? (
            <View className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <Text className="text-body-sm text-danger">
                {addressesQuery.error instanceof ApiError
                  ? addressesQuery.error.message
                  : 'Không thể tải sổ địa chỉ.'}
              </Text>
              <Pressable
                onPress={() => addressesQuery.refetch()}
                className="mt-2 min-h-11 flex-row items-center gap-2 self-start"
              >
                <RefreshCw size={15} className="text-danger" />
                <Text className="text-label-md font-semibold text-danger">
                  Thử lại
                </Text>
              </Pressable>
            </View>
          ) : hasShippingAddress ? (
            <>
              <View className="mb-1 flex-row flex-wrap items-center gap-2">
                <Text className="text-body-md font-bold text-on-surface">
                  {selectedAddress?.recipientName || manualAddress?.recipientName}
                </Text>
                <Text className="text-body-sm text-on-surface-variant">•</Text>
                <Text className="text-body-sm text-on-surface-variant">
                  {selectedAddress?.phone || manualAddress?.phone}
                </Text>
                {selectedAddress?.isDefault && (
                  <View className="rounded-full bg-primary/10 px-2 py-0.5">
                    <Text className="text-2xs font-bold text-primary">Mặc định</Text>
                  </View>
                )}
              </View>
              <Text className="mb-2 text-body-sm leading-5 text-on-surface-variant">
                {selectedAddress
                  ? formatAddress(selectedAddress)
                  : manualAddress
                    ? formatDraftAddress(manualAddress)
                    : ''}
              </Text>

              {isQuoting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#5D1C34" />
                  <Text className="ml-2 text-body-sm text-on-surface-variant">
                    Đang tính phí vận chuyển...
                  </Text>
                </View>
              ) : quoteErrorMessage ? (
                <View className="rounded-xl border border-danger/30 bg-danger/5 p-3">
                  <Text className="text-body-sm text-danger">{quoteErrorMessage}</Text>
                  <Pressable
                    onPress={handleRetryQuote}
                    className="mt-2 min-h-11 flex-row items-center gap-2 self-start"
                  >
                    <RefreshCw size={15} className="text-danger" />
                    <Text className="text-label-md font-semibold text-danger">
                      Thử lại
                    </Text>
                  </Pressable>
                </View>
              ) : quoteReady ? (
                <View className="flex-row items-center">
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text className="ml-2 text-body-sm font-medium text-success">
                    GHN hỗ trợ giao đến địa chỉ này
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View className="rounded-xl border border-surface-line bg-surface p-3">
              <View className="flex-row items-center">
                <MapPin size={20} color="#6B7280" />
                <Text className="ml-3 flex-1 text-body-sm text-on-surface-variant">
                  Vui lòng chọn hoặc thêm địa chỉ giao hàng để tính phí vận chuyển.
                </Text>
              </View>
            </View>
          )}

          {showManualForm && (
            <View className="mt-4">
              <AddressForm
                key={manualAddress ? 'manual-filled' : 'manual-empty'}
                initial={manualInitial}
                mode="checkout"
                onCancel={() => setShowManualForm(false)}
                onSubmit={handleManualSubmit}
              />
            </View>
          )}
        </View>

        <View className="mb-2 border-y border-surface-line bg-surface-lowest p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-headline-sm font-bold text-on-surface">Sản phẩm</Text>
              <Text className="text-body-sm text-on-surface-variant">
                ({totalItems} món)
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.goBack()}
              className="min-h-11 justify-center"
            >
              <Text className="text-label-md text-on-surface-variant">Xem lại</Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View key={index} className="mb-4 flex-row gap-4">
              <View className="h-[72px] w-[72px] overflow-hidden rounded-lg border border-surface-line bg-surface-container">
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                )}
              </View>
              <View className="flex-1 justify-center">
                <Text
                  className="text-label-md font-semibold text-on-surface"
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>
                <Text className="mt-1 text-body-sm text-on-surface-variant">
                  {item.color ? `Màu ${item.color} • ` : ''}Size{' '}
                  {item.size || 'Standard'}
                </Text>
                <Text className="mt-2 text-label-md font-bold text-on-surface">
                  {item.quantity} × {formatCurrency(item.price)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mb-2 border-y border-surface-line bg-surface-lowest p-4">
          <Text className="mb-3 text-headline-sm font-bold text-on-surface">
            Phương thức giao hàng
          </Text>
          <View className="flex-row items-center justify-between rounded-xl border border-surface-line bg-surface p-3">
            <View>
              <View className="mb-1 flex-row items-center gap-2">
                <Text className="text-label-md font-bold text-on-surface">
                  🚚 GHN Express
                </Text>
                {quoteReady && shippingFee === 0 && (
                  <View className="rounded border border-success/30 bg-success/10 px-2 py-0.5">
                    <Text className="text-2xs font-bold text-success">Freeship</Text>
                  </View>
                )}
              </View>
              <Text className="text-body-sm text-on-surface-variant">
                Thời gian giao hàng tiêu chuẩn
              </Text>
            </View>
            <View className="items-end">
              {isQuoting ? (
                <ActivityIndicator size="small" color="#5D1C34" />
              ) : quoteReady ? (
                <Text className="text-label-md font-bold text-on-surface">
                  {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                </Text>
              ) : (
                <Text className="text-label-md italic text-on-surface-variant">
                  Chưa xác định
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="mb-2 border-y border-surface-line bg-surface-lowest p-4">
          <Text className="mb-3 text-headline-sm font-bold text-on-surface">
            Phương thức thanh toán
          </Text>

          <Pressable
            onPress={() => setPaymentMethod(EPaymentMethod.SEPAY)}
            className={`mb-3 flex-row items-center rounded-xl border p-4 ${
              paymentMethod === EPaymentMethod.SEPAY
                ? 'border-primary bg-primary/5'
                : 'border-surface-line bg-surface'
            }`}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <QrCode size={20} color="#5D1C34" />
            </View>
            <View className="flex-1">
              <Text className="text-label-md font-bold text-on-surface">
                Chuyển khoản QR (SePay)
              </Text>
              <Text className="mt-1 text-body-sm text-on-surface-variant">
                Quét mã QR bằng ứng dụng ngân hàng 24/7
              </Text>
            </View>
            <View
              className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                paymentMethod === EPaymentMethod.SEPAY
                  ? 'border-primary'
                  : 'border-surface-line'
              }`}
            >
              {paymentMethod === EPaymentMethod.SEPAY && (
                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod(EPaymentMethod.ZALOPAY)}
            className={`mb-4 flex-row items-center rounded-xl border p-4 ${
              paymentMethod === EPaymentMethod.ZALOPAY
                ? 'border-primary bg-primary/5'
                : 'border-surface-line bg-surface'
            }`}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Text className="text-2xs font-bold text-blue-600">ZaloPay</Text>
            </View>
            <View className="flex-1">
              <Text className="text-label-md font-bold text-on-surface">
                Ví ZaloPay
              </Text>
              <Text className="mt-1 text-body-sm text-on-surface-variant">
                Thanh toán qua ví điện tử ZaloPay
              </Text>
            </View>
            <View
              className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                paymentMethod === EPaymentMethod.ZALOPAY
                  ? 'border-primary'
                  : 'border-surface-line'
              }`}
            >
              {paymentMethod === EPaymentMethod.ZALOPAY && (
                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </View>
          </Pressable>
        </View>

        <View className="border-t border-surface-line bg-surface-lowest p-4 pb-32">
          <Text className="mb-4 text-headline-sm font-bold text-on-surface">
            Chi tiết thanh toán
          </Text>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-body-md text-on-surface-variant">Tạm tính</Text>
            <Text className="text-body-md font-semibold text-on-surface">
              {formatCurrency(displaySubtotal)}
            </Text>
          </View>
          <View className="mb-5 flex-row justify-between">
            <Text className="text-body-md text-on-surface-variant">Phí vận chuyển</Text>
            <Text className="text-body-md font-semibold text-on-surface">
              {!hasShippingAddress
                ? 'Chưa tính'
                : isQuoting
                  ? 'Đang tính...'
                  : quoteReady
                    ? shippingFee === 0
                      ? 'Miễn phí'
                      : formatCurrency(shippingFee)
                    : 'Chưa tính'}
            </Text>
          </View>
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-body-lg font-bold text-on-surface">
                Tổng thanh toán
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">
                (Đã bao gồm VAT)
              </Text>
            </View>
            {isQuoting && items.length > 0 && !quoteRes ? (
              <ActivityIndicator size="small" color="#5D1C34" />
            ) : (
              <Text className="text-headline-md font-bold text-on-surface">
                {formatCurrency(displayTotal)}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-surface-line bg-surface-lowest px-4 py-4 pb-8 shadow-hard-4">
        <View>
          <Text className="mb-1 text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Tổng thanh toán
          </Text>
          <Text className="text-headline-md font-bold text-on-surface">
            {formatCurrency(displayTotal)}
          </Text>
        </View>
        <Pressable
          className={`flex-row items-center justify-center rounded-xl px-8 py-3.5 ${
            canPlaceOrder ? 'bg-primary active:bg-primary-strong' : 'bg-surface-line'
          }`}
          disabled={!canPlaceOrder}
          onPress={handlePlaceOrder}
        >
          {createOrderMutation.isPending || checkoutPaymentMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-label-lg font-bold ${
                canPlaceOrder ? 'text-on-primary' : 'text-on-surface-variant'
              }`}
            >
              Đặt hàng
            </Text>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showAddressPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <SafeAreaView className="flex-1 bg-surface-lowest">
          <View className="flex-row items-center border-b border-surface-line px-4 py-3">
            <Text className="flex-1 text-headline-sm font-semibold text-on-surface">
              Chọn địa chỉ giao hàng
            </Text>
            <Pressable
              onPress={() => setShowAddressPicker(false)}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              className="min-h-11 min-w-11 items-center justify-center rounded-full active:bg-surface"
            >
              <X size={22} className="text-on-surface" />
            </Pressable>
          </View>

          <FlatList
            className="flex-1"
            data={addresses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <MapPin size={36} className="text-outline" />
                <Text className="mt-3 text-center text-body-md text-on-surface-variant">
                  Bạn chưa có địa chỉ giao hàng.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedAddressId;
              return (
                <Pressable
                  onPress={() => handleSelectSavedAddress(item)}
                  className={`mb-3 rounded-2xl border p-4 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-surface-line bg-surface-lowest'
                  }`}
                >
                  <View className="mb-1 flex-row items-center justify-between gap-3">
                    <View className="flex-1 flex-row flex-wrap items-center gap-2">
                      <Text className="text-body-md font-bold text-on-surface">
                        {item.recipientName}
                      </Text>
                      {item.isDefault && (
                        <View className="rounded-full bg-primary/10 px-2 py-0.5">
                          <Text className="text-2xs font-bold text-primary">
                            Mặc định
                          </Text>
                        </View>
                      )}
                    </View>
                    {isSelected && <Check size={18} className="text-primary" />}
                  </View>
                  <Text className="mb-1 text-body-sm text-on-surface-variant">
                    {item.phone}
                  </Text>
                  <Text className="text-body-sm leading-5 text-on-surface-variant">
                    {formatAddress(item)}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View className="border-t border-surface-line p-4">
            <Button
              title="Thêm địa chỉ mới"
              variant="outline"
              onPress={handleAddNewAddress}
              className="w-full rounded-xl"
              leftIcon={<Plus size={18} color="#5D1C34" />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
