import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { useCart } from '@/features/cart/hooks/use-cart';
import { PaymentStatusCard } from '@/features/payments/components/PaymentStatusCard';
import { getPaymentConfirmState } from '@/features/payments/utils/payment-display';
import { useOrder } from '../hooks/use-orders';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

/** IPN của cổng có thể đến sau khi app vừa quay về; tải lại đơn trong ít giây trước khi báo chưa xác nhận được. */
const CONFIRM_TIMEOUT_MS = 20_000;
const CONFIRM_POLL_INTERVAL_MS = 2_000;

export function OrderSuccessScreen({ route, navigation }: Props) {
  const { orderId, orderCode } = route.params;
  const { order, refetch } = useOrder(orderId);
  const { clearCart, refreshCart, isAuthenticated } = useCart();
  const cartSettled = useRef(false);
  const confirmStartedAt = useRef<number | null>(null);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);

  useEffect(() => {
    if (cartSettled.current) return;
    cartSettled.current = true;
    if (isAuthenticated) {
      void refreshCart();
      return;
    }
    clearCart();
  }, [clearCart, isAuthenticated, refreshCart]);

  const state = getPaymentConfirmState(order, confirmTimedOut);

  useEffect(() => {
    if (state !== 'confirming') return;
    if (confirmStartedAt.current === null) confirmStartedAt.current = Date.now();
    const startedAt = confirmStartedAt.current;
    const interval = setInterval(() => {
      if (Date.now() - startedAt >= CONFIRM_TIMEOUT_MS) {
        clearInterval(interval);
        setConfirmTimedOut(true);
        return;
      }
      void refetch();
    }, CONFIRM_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state, refetch]);

  const code = order?.orderCode ?? order?.orderNumber ?? orderCode;
  const viewOrder = { label: 'Xem đơn hàng', onPress: () => navigation.replace('OrderDetail', { orderId }) };
  // Thanh toán lại ở trang đơn; mở checkout sẽ tạo thêm một đơn mới.
  const payAgain = { label: 'Thanh toán lại', onPress: () => navigation.replace('OrderDetail', { orderId }) };
  const continueShopping = {
    label: 'Tiếp tục mua sắm',
    onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'ShopTab' } }] }),
  };

  const card = (() => {
    switch (state) {
      case 'loading':
        return (
          <PaymentStatusCard
            title="Đang kiểm tra thanh toán"
            orderCode={code}
            isLoading
            description="Đang lấy trạng thái thanh toán của đơn hàng."
            secondary={continueShopping}
          />
        );
      case 'paid':
        return (
          <PaymentStatusCard
            title="Thanh toán thành công"
            orderCode={code}
            status={{ tone: 'done', label: 'Đã thanh toán' }}
            description="Shop đã nhận được thanh toán. Đơn chuyển sang bước duyệt số đo trước khi may."
            primary={viewOrder}
            secondary={continueShopping}
          />
        );
      case 'confirming':
        return (
          <PaymentStatusCard
            title="Đang xác nhận thanh toán"
            orderCode={code}
            isLoading
            status={{ tone: 'attention', label: 'Đang xác nhận' }}
            description="Cổng thanh toán đang gửi xác nhận về hệ thống. Vui lòng đợi trong ít giây, trang sẽ tự cập nhật."
            primary={viewOrder}
            secondary={continueShopping}
          />
        );
      default:
        return (
          <PaymentStatusCard
            title="Thanh toán chưa thành công"
            orderCode={code}
            status={{ tone: 'error', label: 'Thất bại' }}
            description="Cổng thanh toán chưa xác nhận giao dịch. Đơn vẫn chờ thanh toán, bạn có thể thử lại từ trang đơn hàng."
            primary={payAgain}
            secondary={continueShopping}
          />
        );
    }
  })();

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      <AppHeader />
      <ScrollView contentContainerClassName="flex-grow justify-center px-4 py-10" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[520px] self-center">{card}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
