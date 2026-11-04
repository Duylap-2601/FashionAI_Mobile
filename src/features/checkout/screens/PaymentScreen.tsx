import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { PaymentStatusCard } from '@/features/payments/components/PaymentStatusCard';

const ZALOPAY_DESCRIPTION =
  'Quét QR hoặc mở ZaloPay. Giữ trang này, đơn tự cập nhật khi thanh toán xong.';
const SEPAY_DESCRIPTION =
  'Quét QR hoặc mở cổng SePay để chuyển khoản. Giữ trang này, đơn tự cập nhật khi thanh toán xong.';

interface ISheetHeaderProps {
  title: string;
  description: string;
  onClose: () => void;
}

function SheetHeader({ title, description, onClose }: ISheetHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1 gap-1.5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          THANH TOÁN
        </Text>
        <Text
          accessibilityRole="header"
          className="font-display text-[26px] leading-tight text-landing-obsidian"
        >
          {title}
        </Text>
        <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
          {description}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        onPress={onClose}
        className="-mr-1.5 -mt-1 h-11 w-11 items-center justify-center rounded-subtle active:bg-ivory"
      >
        <X size={20} strokeWidth={1.75} color={COLORS.muted} />
      </Pressable>
    </View>
  );
}

interface ISheetActionProps {
  label: string;
  onPress: () => void;
}

function TextAction({ label, onPress }: ISheetActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-11 items-center justify-center px-2 active:opacity-60"
    >
      <Text className="font-sans text-xs text-landing-muted">{label}</Text>
    </Pressable>
  );
}

type IResultSheetProps = React.ComponentProps<typeof PaymentStatusCard> & {
  onClose: () => void;
};

/** Kết quả thanh toán trong màn này, cùng khung PaymentStatusCard với màn thành công. */
function ResultSheet({ onClose, ...card }: IResultSheetProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-landing-paper">
      <View className="flex-row justify-end px-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={onClose}
          className="h-11 w-11 items-center justify-center rounded-subtle active:bg-ivory"
        >
          <X size={20} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[520px] self-center">
          <PaymentStatusCard {...card} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface IOrderMetaProps {
  orderCode?: string;
  totalAmount?: number;
}

function OrderMeta({ orderCode, totalAmount }: IOrderMetaProps) {
  return (
    <View className="mt-6 flex-row items-start justify-between gap-4 border-t border-landing-line pt-5">
      <View className="min-w-0 flex-1 gap-1.5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          MÃ ĐƠN
        </Text>
        <Text className="font-mono text-[16px] text-landing-obsidian">
          {orderCode || 'Chưa có'}
        </Text>
      </View>
      <View className="shrink-0 items-end gap-1.5">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
          SỐ TIỀN
        </Text>
        <Text className="font-mono text-[20px] text-oxblood">
          {formatCurrency(totalAmount)}
        </Text>
      </View>
    </View>
  );
}

interface IQrPanelProps {
  value?: string;
}

function QrPanel({ value }: IQrPanelProps) {
  return (
    <View className="mt-6 items-center">
      <View className="rounded-subtle border border-landing-line bg-white p-5">
        {value ? (
          <QRCode value={value} size={200} />
        ) : (
          <View className="h-[200px] w-[200px] items-center justify-center bg-ivory">
            <Text className="text-center font-sans text-xs text-landing-muted">
              Không có dữ liệu QR
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

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

  const [paymentStatusOverride, setPaymentStatusOverride] = useState<
    'CANCELLED' | 'FAILED' | null
  >(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);

  const isZaloPay = provider === 'ZALOPAY';
  const qrValue = qrCode || checkoutUrl;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
  const isExpired = payment?.status === 'EXPIRED';

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

  const handleClose = () => {
    navigation.goBack();
  };

  const handleOpenCheckout = () => {
    if (!checkoutUrl) return;
    Linking.openURL(checkoutUrl);
  };

  const handleHoldOrder = () => {
    setPaymentStatusOverride('CANCELLED');
  };

  const gatewaySource = useMemo(() => {
    let source: any = { uri: checkoutUrl };

    try {
      if (provider === 'SEPAY' && checkoutUrl) {
        const urlObj = new URL(checkoutUrl);
        if (
          (urlObj.hostname.includes('sepay.vn') ||
            urlObj.pathname.includes('/checkout/init')) &&
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

    return source;
  }, [checkoutUrl, provider]);

  const handleWebViewNavigation = (url: string) => {
    const lowerUrl = url.toLowerCase();

    if (
      lowerUrl.includes('success') ||
      lowerUrl.includes('resultcode=0') ||
      lowerUrl.includes('fashionai://payment/success') ||
      (lowerUrl.includes('/orders/') && lowerUrl.includes('/success'))
    ) {
      handlePaymentSuccess();
      return;
    }

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

    if (
      lowerUrl.includes('error') ||
      lowerUrl.includes('failed') ||
      lowerUrl.includes('resultcode=fail') ||
      lowerUrl.includes('fashionai://payment/error')
    ) {
      setPaymentStatusOverride('FAILED');
    }
  };

  if (isRefundRequired) {
    return (
      <ResultSheet
        title="Khoản thanh toán cần hoàn lại"
        orderCode={orderCode}
        status={{ tone: 'attention', label: 'Cần hoàn tiền' }}
        description="Shop đã nhận tiền nhưng không ghi nhận được cho đơn này, thường do đơn đã được thanh toán trước đó. Khoản này sẽ được hoàn lại cho bạn."
        onClose={handleClose}
        primary={{ label: 'Xem đơn hàng', onPress: handleGoToOrder }}
        secondary={{ label: 'Về giỏ hàng', onPress: handleBackToCart }}
      />
    );
  }

  if (isCancelled) {
    return (
      <ResultSheet
        title="Thanh toán đã bị hủy"
        orderCode={orderCode}
        status={{ tone: 'attention', label: 'Chờ thanh toán' }}
        description="Bạn đã hủy ở cổng thanh toán. Đơn vẫn được giữ ở trạng thái chờ thanh toán, bạn có thể thanh toán lại từ trang đơn hàng."
        onClose={handleClose}
        primary={{ label: 'Xem đơn hàng', onPress: handleGoToOrder }}
        secondary={{ label: 'Thử lại', onPress: handleRetry }}
        footnote={{ label: 'Về giỏ hàng', onPress: handleBackToCart }}
      />
    );
  }

  if (isFailed) {
    return (
      <ResultSheet
        title="Thanh toán chưa thành công"
        orderCode={orderCode}
        status={{ tone: 'error', label: 'Thất bại' }}
        description={
          payment?.failureReason ||
          'Cổng thanh toán chưa xác nhận giao dịch. Đơn vẫn chờ thanh toán, bạn có thể thử lại từ trang đơn hàng.'
        }
        onClose={handleClose}
        primary={{ label: 'Xem đơn hàng', onPress: handleGoToOrder }}
        secondary={{ label: 'Thử lại', onPress: handleRetry }}
        footnote={{ label: 'Về giỏ hàng', onPress: handleBackToCart }}
      />
    );
  }

  if (isExpired) {
    return (
      <ResultSheet
        title="Liên kết đã hết hạn"
        orderCode={orderCode}
        status={{ tone: 'closed', label: 'Hết hạn' }}
        description="Liên kết thanh toán không còn hiệu lực. Đơn hàng vẫn được giữ, bạn có thể tạo lại thanh toán từ chi tiết đơn."
        onClose={handleClose}
        primary={{ label: 'Xem đơn hàng', onPress: handleGoToOrder }}
        secondary={{ label: 'Thử lại', onPress: handleRetry }}
      />
    );
  }

  if (!checkoutUrl) {
    return (
      <ResultSheet
        title="Không tìm thấy liên kết thanh toán"
        orderCode={orderCode}
        status={{ tone: 'error', label: 'Không xác định' }}
        description="Không nhận được liên kết thanh toán cho đơn hàng này. Vui lòng mở lại đơn hàng và tạo lại thanh toán."
        onClose={handleClose}
        primary={{ label: 'Xem đơn hàng', onPress: handleGoToOrder }}
        secondary={{ label: 'Về giỏ hàng', onPress: handleBackToCart }}
      />
    );
  }

  if (isZaloPay) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-landing-paper">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <SheetHeader
            title="ZaloPay"
            description={ZALOPAY_DESCRIPTION}
            onClose={handleClose}
          />

          <View className="mt-5 border-t border-landing-line" />

          <QrPanel value={qrValue} />

          <OrderMeta orderCode={orderCode} totalAmount={totalAmount} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isPaid }}
            disabled={isPaid}
            onPress={handleOpenCheckout}
            className={`mt-6 h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
              isPaid ? 'opacity-50' : 'active:bg-landing-obsidian'
            }`}
          >
            <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Mở ZaloPay
            </Text>
            <ExternalLink size={14} strokeWidth={1.75} color={COLORS.paper} />
          </Pressable>

          <View className="mt-4 flex-row items-center gap-2">
            {isPaid ? (
              <>
                <CheckCircle2 size={16} strokeWidth={1.75} color={COLORS.sageInk} />
                <Text className="flex-1 font-sans text-xs leading-relaxed text-sage-ink">
                  Thanh toán thành công, đang chuyển trang...
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color={COLORS.brassInk} />
                <Text className="flex-1 font-sans text-xs leading-relaxed text-landing-muted">
                  {isCheckingStatus
                    ? 'Đang kiểm tra trạng thái thanh toán...'
                    : 'Đang chờ ZaloPay xác nhận thanh toán...'}
                </Text>
              </>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleGoToOrder}
            className="mt-6 min-h-11 items-center justify-center active:opacity-60"
          >
            <Text className="font-sans text-xs text-landing-muted">
              Xem chi tiết đơn hàng
            </Text>
          </Pressable>

          <View className="mt-1 flex-row items-center justify-center">
            <TextAction label="Kiểm tra lại" onPress={() => refetchStatus()} />
            {orderId ? <Text className="font-sans text-[10px] text-taupe">·</Text> : null}
            {orderId ? <TextAction label="Hủy thanh toán" onPress={handleHoldOrder} /> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-landing-paper">
      <View className="px-5 pt-4">
        <SheetHeader title="SePay" description={SEPAY_DESCRIPTION} onClose={handleClose} />
        <View className="mt-5 border-t border-landing-line" />
      </View>

      {isGatewayOpen ? (
        <View className="mt-3 flex-1">
          <View className="border-b border-landing-line px-5">
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsGatewayOpen(false)}
              className="-ml-1 min-h-11 flex-row items-center gap-1.5 pr-3 active:opacity-60"
            >
              <ChevronLeft size={16} strokeWidth={1.75} color={COLORS.oxblood} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Về trang thanh toán
              </Text>
            </Pressable>
          </View>

          <WebView
            key={webViewKey}
            source={gatewaySource}
            style={{ flex: 1 }}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center gap-3 bg-landing-paper">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-body-sm text-landing-muted">
                  Đang kết nối cổng thanh toán...
                </Text>
              </View>
            )}
            onNavigationStateChange={(navState) => handleWebViewNavigation(navState.url)}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <QrPanel value={qrValue} />

          <OrderMeta orderCode={orderCode} totalAmount={totalAmount} />

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsGatewayOpen(true)}
            className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:bg-landing-obsidian"
          >
            <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Mở cổng SePay
            </Text>
            <ExternalLink size={14} strokeWidth={1.75} color={COLORS.paper} />
          </Pressable>

          <View className="mt-4 flex-row items-center gap-2">
            <Clock size={16} strokeWidth={1.75} color={COLORS.brassInk} />
            <Text className="flex-1 font-sans text-xs leading-relaxed text-landing-muted">
              Đơn tự cập nhật khi cổng SePay xác nhận thanh toán.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleGoToOrder}
            className="mt-6 min-h-11 items-center justify-center active:opacity-60"
          >
            <Text className="font-sans text-xs text-landing-muted">
              Xem chi tiết đơn hàng
            </Text>
          </Pressable>

          {orderId ? (
            <View className="mt-1 flex-row items-center justify-center">
              <TextAction label="Hủy thanh toán" onPress={handleHoldOrder} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
