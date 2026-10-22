import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { formatCurrency } from '@/utils/format';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { CheckCircle2, AlertCircle, RotateCcw, Package, ShoppingBag, XCircle, Clock } from 'lucide-react-native';

export function PaymentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const {
    checkoutUrl,
    provider,
    qrCode,
    orderCode,
    totalAmount,
    paymentId,
    orderId,
    targetTier,
    returnRoute,
  } = route.params || {};

  const [paymentStatusOverride, setPaymentStatusOverride] = useState<'CANCELLED' | 'FAILED' | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      title: provider === 'ZALOPAY' ? 'Thanh toán ZaloPay' : 'Cổng thanh toán',
    });
  }, [navigation, provider]);

  const {
    data: payment,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['paymentStatus', paymentId],
    queryFn: () => paymentsApi.getPaymentStatus(paymentId),
    enabled: !!paymentId && provider === 'ZALOPAY',
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' ? 3000 : false;
    },
  });

  const isPaid = payment?.status === 'PAID' || payment?.status === 'COMPLETED';
  const isFailed = payment?.status === 'FAILED' || paymentStatusOverride === 'FAILED';
  const isCancelled = paymentStatusOverride === 'CANCELLED';
  const isRefundRequired = payment?.status === 'REFUND_REQUIRED';

  const handlePaymentSuccess = () => {
    if (targetTier || returnRoute === 'SubscriptionPlans') {
      navigation.replace('SubscriptionPlans');
    } else if (orderId) {
      navigation.replace('OrderSuccess', {
        orderId,
        orderCode,
        totalAmount,
      });
    }
  };

  useEffect(() => {
    if (isPaid) {
      handlePaymentSuccess();
    }
  }, [isPaid]);

  const handleRetry = () => {
    setPaymentStatusOverride(null);
    if (provider === 'ZALOPAY') {
      refetchStatus();
    } else {
      setWebViewKey((prev) => prev + 1);
    }
  };

  const handleGoToOrder = () => {
    if (orderId) {
      navigation.replace('OrderDetail', { orderId });
    } else {
      navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'Orders' } });
    }
  };

  const handleBackToCart = () => {
    navigation.replace('Cart');
  };

  // Màn hình trạng thái HỦY THANH TOÁN
  if (isCancelled) {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest px-5 py-8 justify-center">
        <View className="bg-surface border border-surface-line rounded-2xl p-6 shadow-sm items-center">
          <View className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center mb-4">
            <AlertCircle size={36} color="#F59E0B" />
          </View>

          <Text className="text-xl font-bold text-on-surface text-center mb-2">
            Thanh toán đã bị hủy
          </Text>

          <Text className="text-body-sm text-on-surface-variant text-center mb-6 leading-relaxed">
            Bạn đã hủy thanh toán. Đơn hàng {orderCode ? `#${orderCode} ` : ''}vẫn được lưu giữ ở trạng thái{' '}
            <Text className="font-semibold text-amber-600">Chờ thanh toán</Text> trong vòng 24 giờ.
          </Text>

          <View className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6">
            <Text className="text-[13px] text-amber-800 leading-relaxed text-center">
              Bạn có thể thanh toán lại ngay bây giờ hoặc truy cập mục Đơn hàng bất kỳ lúc nào để hoàn tất.
            </Text>
          </View>

          <View className="w-full gap-3">
            <Pressable
              onPress={handleRetry}
              className="w-full min-h-[50px] rounded-xl bg-primary flex-row items-center justify-center gap-2 active:opacity-90"
              accessibilityRole="button"
            >
              <RotateCcw size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-label-lg">Thanh toán lại</Text>
            </Pressable>

            {orderId && (
              <Pressable
                onPress={handleGoToOrder}
                className="w-full min-h-[50px] rounded-xl bg-surface border border-surface-line flex-row items-center justify-center gap-2 active:bg-surface-line/50"
                accessibilityRole="button"
              >
                <Package size={18} color="#5D1C34" />
                <Text className="text-primary font-semibold text-label-lg">Xem đơn hàng</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleBackToCart}
              className="w-full min-h-[46px] flex-row items-center justify-center active:opacity-70"
              accessibilityRole="button"
            >
              <Text className="text-on-surface-variant text-body-sm">Quay về giỏ hàng</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Màn hình trạng thái THẤT BẠI
  if (isFailed) {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest px-5 py-8 justify-center">
        <View className="bg-surface border border-surface-line rounded-2xl p-6 shadow-sm items-center">
          <View className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 items-center justify-center mb-4">
            <XCircle size={36} color="#EF4444" />
          </View>

          <Text className="text-xl font-bold text-on-surface text-center mb-2">
            Thanh toán không thành công
          </Text>

          <Text className="text-body-sm text-on-surface-variant text-center mb-6 leading-relaxed">
            {payment?.failureReason ||
              'Giao dịch chưa được xác nhận bởi cổng thanh toán hoặc đã hết hạn.'}
          </Text>

          <View className="w-full gap-3">
            <Pressable
              onPress={handleRetry}
              className="w-full min-h-[50px] rounded-xl bg-primary flex-row items-center justify-center gap-2 active:opacity-90"
              accessibilityRole="button"
            >
              <RotateCcw size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-label-lg">Thử thanh toán lại</Text>
            </Pressable>

            {orderId && (
              <Pressable
                onPress={handleGoToOrder}
                className="w-full min-h-[50px] rounded-xl bg-surface border border-surface-line flex-row items-center justify-center gap-2 active:bg-surface-line/50"
                accessibilityRole="button"
              >
                <Package size={18} color="#5D1C34" />
                <Text className="text-primary font-semibold text-label-lg">Kiểm tra đơn hàng</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkoutUrl) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center px-4">
        <Text className="text-on-surface text-body-md text-center">
          Không tìm thấy liên kết thanh toán. Vui lòng thử lại từ đơn hàng của bạn.
        </Text>
        {orderId && (
          <Pressable
            onPress={handleGoToOrder}
            className="mt-4 px-6 h-11 bg-primary rounded-xl items-center justify-center"
          >
            <Text className="text-white font-semibold">Xem đơn hàng</Text>
          </Pressable>
        )}
      </SafeAreaView>
    );
  }

  // Nếu là ZALOPAY, hiển thị UI lấy mã QR
  if (provider === 'ZALOPAY') {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-1 items-center px-4 py-6">
          <View className="w-full bg-surface p-6 rounded-2xl items-center border border-surface-line shadow-sm mb-5">
            <Text className="text-headline-sm font-bold text-on-surface mb-1">Quét mã để thanh toán</Text>
            <Text className="text-body-sm text-on-surface-variant text-center mb-5">
              Sử dụng ứng dụng ZaloPay hoặc ứng dụng ngân hàng để quét mã QR bên dưới
            </Text>

            <View className="bg-white p-4 rounded-xl border border-surface-line shadow-sm mb-5">
              {qrCode ? (
                <QRCode value={qrCode} size={200} />
              ) : (
                <View className="w-[200px] h-[200px] bg-surface-line items-center justify-center rounded-lg">
                  <Text className="text-on-surface-variant">Không có mã QR</Text>
                </View>
              )}
            </View>

            <Text className="text-body-md text-on-surface-variant mb-1">
              Thanh toán đơn hàng {orderCode ? `#${orderCode}` : ''}
            </Text>
            <Text className="text-3xl font-bold text-[#0068FF] mb-4">
              {formatCurrency ? formatCurrency(totalAmount || 0) : `${(totalAmount || 0).toLocaleString('vi-VN')}đ`}
            </Text>

            {/* Trạng thái thanh toán */}
            <View className="w-full p-4 rounded-xl border border-surface-line bg-surface-lowest">
              {isPaid && (
                <View className="flex-row items-center justify-center gap-2">
                  <CheckCircle2 color="#10B981" size={20} />
                  <Text className="text-body-sm font-semibold text-[#10B981]">
                    Thanh toán thành công, đang chuyển trang...
                  </Text>
                </View>
              )}
              {isRefundRequired && (
                <View className="flex-row items-center justify-center gap-2">
                  <AlertCircle color="#F59E0B" size={20} />
                  <Text className="text-body-sm font-semibold text-[#F59E0B] text-center flex-1">
                    Đã nhận tiền nhưng đơn hàng gặp lỗi. Khoản tiền sẽ được hoàn lại.
                  </Text>
                </View>
              )}
              {!isPaid && !isRefundRequired && (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator size="small" color="#0068FF" />
                  <Text className="text-body-sm text-on-surface-variant text-center flex-1">
                    {isCheckingStatus
                      ? 'Đang kiểm tra trạng thái thanh toán...'
                      : 'Đang chờ xác nhận từ ZaloPay...'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="w-full gap-3">
            <Pressable
              onPress={() => Linking.openURL(checkoutUrl)}
              disabled={isPaid}
              className={`w-full min-h-[50px] rounded-xl flex-row items-center justify-center ${
                isPaid ? 'bg-surface-line' : 'bg-[#0068FF] active:bg-[#0052cc]'
              }`}
            >
              <Text className={`font-bold text-label-lg ${isPaid ? 'text-on-surface-variant' : 'text-white'}`}>
                Mở ứng dụng ZaloPay
              </Text>
            </Pressable>

            <Pressable
              onPress={() => refetchStatus()}
              className="w-full min-h-[48px] rounded-xl bg-surface border border-surface-line flex-row items-center justify-center gap-2 active:bg-surface-line/50"
            >
              <RotateCcw size={16} color="#1A1A1A" />
              <Text className="font-semibold text-on-surface text-label-md">Tôi đã chuyển tiền / Kiểm tra lại</Text>
            </Pressable>

            {orderId && (
              <Pressable
                onPress={() => setPaymentStatusOverride('CANCELLED')}
                className="w-full min-h-[44px] items-center justify-center active:opacity-70"
              >
                <Text className="text-on-surface-variant text-body-sm">Hủy và quay về đơn hàng</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Xử lý tạo POST request cho SePay nếu cần thiết
  let source: any = { uri: checkoutUrl };

  try {
    if (provider === 'SEPAY') {
      const urlObj = new URL(checkoutUrl);
      if (
        (urlObj.hostname.includes('sepay.vn') || urlObj.pathname.includes('/checkout/init')) &&
        urlObj.searchParams.size > 0
      ) {
        const bodyParts: string[] = [];
        urlObj.searchParams.forEach((value, key) => {
          bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });

        source = {
          uri: `${urlObj.origin}${urlObj.pathname}`,
          method: 'POST',
          body: bodyParts.join('&'),
        };
      }
    }
  } catch (error) {
    console.warn('Lỗi phân tích checkoutUrl:', error);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <WebView
        key={webViewKey}
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="absolute inset-0 justify-center items-center bg-surface-lowest">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-4 text-on-surface-variant">Đang kết nối cổng thanh toán...</Text>
          </View>
        )}
        onNavigationStateChange={(navState) => {
          const lowerUrl = navState.url.toLowerCase();

          // THÀNH CÔNG
          if (
            lowerUrl.includes('success') ||
            lowerUrl.includes('resultcode=0') ||
            lowerUrl.includes('fashionai://payment/success') ||
            lowerUrl.includes('/orders/') && lowerUrl.includes('/success')
          ) {
            handlePaymentSuccess();
            return;
          }

          // HỦY BỎ
          if (
            lowerUrl.includes('cancel') ||
            lowerUrl.includes('canceled') ||
            lowerUrl.includes('resultcode=cancel') ||
            lowerUrl.includes('status=cancelled') ||
            lowerUrl.includes('fashionai://payment/cancel')
          ) {
            setPaymentStatusOverride('CANCELLED');
            return;
          }

          // THẤT BẠI
          if (
            lowerUrl.includes('error') ||
            lowerUrl.includes('failed') ||
            lowerUrl.includes('resultcode=fail') ||
            lowerUrl.includes('fashionai://payment/error')
          ) {
            setPaymentStatusOverride('FAILED');
            return;
          }
        }}
      />
    </SafeAreaView>
  );
}
