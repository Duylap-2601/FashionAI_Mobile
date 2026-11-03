import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Package } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { useOrder } from '../hooks/use-orders';
import { useCart } from '@/features/cart/hooks/use-cart';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

export function OrderSuccessScreen({ route, navigation }: Props) {
  const { orderId, orderCode } = route.params;
  const { order } = useOrder(orderId);
  const { clearCart, refreshCart, isAuthenticated } = useCart();
  const cartSettled = useRef(false);

  useEffect(() => {
    if (cartSettled.current) return;
    cartSettled.current = true;
    if (isAuthenticated) {
      void refreshCart();
      return;
    }
    clearCart();
  }, [clearCart, isAuthenticated, refreshCart]);

  const displayOrderCode =
    order?.orderNumber ||
    orderCode ||
    (typeof orderId === 'string'
      ? orderId.substring(0, 8).toUpperCase()
      : String(orderId));

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
    <SafeAreaView className="flex-1 bg-landing-paper">
      <AppHeader />
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-lg py-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full items-center rounded-2xl border border-landing-line bg-white px-6 py-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
            <Check size={30} strokeWidth={3} color="#FFFFFF" />
          </View>

          <Text className="mt-5 text-center font-sans text-[22px] font-bold leading-tight text-oxblood">
            Thanh toán thành công
          </Text>

          <Text className="mt-2 text-center font-sans text-body-md leading-relaxed text-landing-muted">
            Đơn hàng{' '}
            <Text className="font-semibold text-oxblood">#{displayOrderCode}</Text> đã
            được xác nhận bởi hệ thống.
          </Text>

          <Pressable
            onPress={handleViewOrder}
            accessibilityRole="button"
            accessibilityLabel="Xem đơn hàng"
            className="mt-6 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-oxblood active:opacity-90"
          >
            <Package size={16} strokeWidth={1.75} color="#FFFFFF" />
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Xem đơn hàng
            </Text>
          </Pressable>

          <Pressable
            onPress={handleContinueShopping}
            accessibilityRole="button"
            accessibilityLabel="Tiếp tục mua sắm"
            className="mt-3 h-12 w-full items-center justify-center rounded-xl border border-landing-line bg-white active:bg-ivory"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Tiếp tục mua sắm
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
