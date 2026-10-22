import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ShoppingBag, Eye, Copy, Sparkles, Clock, ShieldCheck } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '@/navigation/types';
import { useOrder } from '../hooks/use-orders';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { formatCurrency } from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

export function OrderSuccessScreen({ route, navigation }: Props) {
  const { orderId, orderCode, totalAmount } = route.params;
  const { order, isLoading } = useOrder(orderId);
  const { user } = useAuth();
  const clearCart = useCartStore((s) => s.clearCart);
  const [copied, setCopied] = React.useState(false);

  // Xoá giỏ hàng khi đặt hàng thành công
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const displayOrderCode = order?.orderNumber || orderCode || (typeof orderId === 'string' ? orderId.substring(0, 8).toUpperCase() : `#${orderId}`);
  const displayTotal = order?.total ?? totalAmount ?? 0;
  const userEmail = user?.email || 'email của bạn';

  const handleCopyCode = async () => {
    if (displayOrderCode) {
      await Clipboard.setStringAsync(String(displayOrderCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewOrder = () => {
    navigation.replace('OrderDetail', { orderId });
  };

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'ShopTab' } }],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Success Icon */}
          <View className="w-24 h-24 rounded-full bg-emerald-500/15 border-4 border-emerald-500/30 items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 size={54} color="#10B981" />
          </View>

          {/* Heading */}
          <Text className="text-2xl font-bold text-on-surface text-center mb-2 tracking-tight">
            Đặt hàng thành công!
          </Text>

          <Text className="text-body-md text-on-surface-variant text-center mb-8 px-2 leading-relaxed">
            Cảm ơn bạn đã tin tưởng FashionAI. Thông tin đơn hàng và hoá đơn điện tử đã được gửi tới{' '}
            <Text className="font-semibold text-primary">{userEmail}</Text>.
          </Text>

          {/* Order Summary Card */}
          <View className="w-full bg-surface border border-surface-line rounded-2xl p-5 mb-5 shadow-sm">
            {isLoading ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color="#5D1C34" />
                <Text className="text-body-sm text-on-surface-variant mt-2">Đang tải thông tin đơn hàng...</Text>
              </View>
            ) : (
              <View className="gap-3.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-body-sm text-on-surface-variant">Mã đơn hàng</Text>
                  <Pressable
                    onPress={handleCopyCode}
                    className="flex-row items-center gap-1.5 px-2.5 py-1 bg-surface-line/50 rounded-lg active:opacity-70"
                    accessibilityLabel="Sao chép mã đơn hàng"
                  >
                    <Text className="font-bold text-body-sm text-on-surface tracking-wider">
                      {displayOrderCode}
                    </Text>
                    <Copy size={13} color="#737373" />
                  </Pressable>
                </View>

                {copied && (
                  <Text className="text-right text-[11px] text-emerald-600 font-medium">
                    Đã sao chép mã đơn hàng!
                  </Text>
                )}

                <View className="h-px bg-surface-line" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-body-sm text-on-surface-variant">Tổng thanh toán</Text>
                  <Text className="text-headline-xs font-bold text-primary">
                    {formatCurrency(displayTotal)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-body-sm text-on-surface-variant">Trạng thái thanh toán</Text>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text className="text-body-sm font-semibold text-emerald-600">Đã nhận đơn</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-body-sm text-on-surface-variant">Dự kiến giao hàng</Text>
                  <View className="flex-row items-center gap-1">
                    <Clock size={14} color="#737373" />
                    <Text className="text-body-sm font-medium text-on-surface">3 – 5 ngày làm việc</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Tailoring & Guarantee Banner */}
          <View className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8 flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={18} color="#5D1C34" />
            </View>
            <View className="flex-1">
              <Text className="text-body-sm font-bold text-primary mb-1">
                May đo riêng theo thông số của bạn
              </Text>
              <Text className="text-[13px] text-on-surface-variant leading-relaxed">
                Đơn hàng đã được chuyển tiếp đến nghệ nhân may đo FashionAI. Từng chi tiết sẽ được hoàn thiện theo đúng thông số số đo hồ sơ của bạn.
              </Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View className="w-full gap-3">
            <Pressable
              onPress={handleViewOrder}
              className="w-full min-h-[52px] h-13 rounded-xl bg-primary flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel="Xem chi tiết đơn hàng"
            >
              <Eye size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-label-lg">Xem chi tiết đơn hàng</Text>
            </Pressable>

            <Pressable
              onPress={handleContinueShopping}
              className="w-full min-h-[52px] h-13 rounded-xl bg-surface border border-surface-line flex-row items-center justify-center gap-2 active:bg-surface-line/50"
              accessibilityRole="button"
              accessibilityLabel="Tiếp tục mua sắm"
            >
              <ShoppingBag size={18} color="#5D1C34" />
              <Text className="text-primary font-semibold text-label-lg">Tiếp tục mua sắm</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
