import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

export function CartScreen() {
  const navigation = useNavigation();
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } =
    useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleClearCart = () => {
    Alert.alert('Xóa tất cả', 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-landing-paper">
        <View className="flex-row items-center border-b border-landing-line px-lg py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            className="-ml-2 h-11 w-11 items-center justify-center active:opacity-60"
          >
            <ArrowLeft size={22} strokeWidth={1.75} color={COLORS.obsidian} />
          </Pressable>
          <Text className="flex-1 text-center font-display text-[19px] text-landing-obsidian">
            Giỏ hàng
          </Text>
          <View className="w-9" />
        </View>

        <View className="flex-1 items-center justify-center px-lg">
          <View className="mb-6 h-16 w-16 items-center justify-center border border-landing-line">
            <ShoppingBag size={26} strokeWidth={1.25} color={COLORS.oxblood} />
          </View>
          <Text className="mb-2 text-center font-display text-[24px] leading-tight text-landing-obsidian">
            Giỏ hàng của bạn đang trống
          </Text>
          <Text className="mb-8 max-w-[300px] text-center font-sans text-body-md leading-relaxed text-landing-muted">
            Hãy khám phá các trang phục công sở cao cấp và thử đồ ảo cùng AI trước khi đặt hàng nhé.
          </Text>
          <Pressable
            className="mb-3 h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:bg-landing-obsidian"
            onPress={() => (navigation as any).navigate('Main', { screen: 'ShopTab' })}
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Khám phá bộ sưu tập
            </Text>
            <ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />
          </Pressable>
          <Pressable
            className="h-11 w-full items-center justify-center rounded-subtle border border-landing-line active:bg-ivory"
            onPress={() =>
              (navigation as any).navigate('Main', {
                screen: 'ProfileTab',
                params: { screen: 'Orders' },
              })
            }
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Đơn hàng của tôi
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      <View className="flex-row items-center border-b border-landing-line px-lg py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="-ml-2 h-11 w-11 items-center justify-center active:opacity-60"
        >
          <ArrowLeft size={22} strokeWidth={1.75} color={COLORS.obsidian} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-display text-[19px] text-landing-obsidian">
            Giỏ hàng
          </Text>
          <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
            {totalItems} sản phẩm
          </Text>
        </View>
        <Pressable onPress={handleClearCart} className="h-11 justify-center active:opacity-60">
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-oxblood">
            Xóa hết
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View>
          {items.map((item, index) => (
            <View
              key={`${item.productId}-${item.variantId}-${index}`}
              className="flex-row gap-3 border-b border-landing-line px-lg py-4"
            >
              <View className="h-[116px] w-[92px] overflow-hidden rounded-subtle border border-landing-line bg-ivory">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <ShoppingBag size={22} strokeWidth={1.25} color={COLORS.muted} />
                  </View>
                )}
              </View>

              <View className="flex-1 justify-between">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      className="font-display text-[16px] leading-snug text-landing-obsidian"
                    >
                      {item.productName}
                    </Text>
                    <Text className="mt-1 font-sans text-[11px] uppercase tracking-[0.1em] text-landing-muted">
                      {item.color ? `${item.color} · ` : ''}
                      Size {item.size || 'Standard'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeItem(item.productId, item.variantId)}
                    accessibilityRole="button"
                    accessibilityLabel="Xóa sản phẩm"
                    className="h-9 w-9 items-center justify-center active:opacity-60"
                  >
                    <Trash2 size={16} strokeWidth={1.75} color={COLORS.oxblood} />
                  </Pressable>
                </View>

                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center rounded-subtle border border-landing-line">
                    <Pressable
                      onPress={() =>
                        updateQuantity(item.productId, item.quantity - 1, item.variantId)
                      }
                      className="h-10 w-10 items-center justify-center active:bg-ivory"
                    >
                      <Minus size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                    </Pressable>
                    <View className="h-10 w-10 items-center justify-center border-x border-landing-line">
                      <Text className="font-mono text-[12px] text-landing-obsidian">
                        {item.quantity}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        updateQuantity(item.productId, item.quantity + 1, item.variantId)
                      }
                      className="h-10 w-10 items-center justify-center active:bg-ivory"
                    >
                      <Plus size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                    </Pressable>
                  </View>

                  <View className="items-end">
                    <Text className="font-mono text-[13px] text-oxblood">
                      {formatCurrency
                        ? formatCurrency(item.price * item.quantity)
                        : `${(item.price * item.quantity).toLocaleString('vi-VN')}đ`}
                    </Text>
                    {item.quantity > 1 && (
                      <Text className="mt-0.5 font-mono text-[10px] text-landing-muted">
                        {formatCurrency
                          ? formatCurrency(item.price)
                          : `${item.price.toLocaleString('vi-VN')}đ`}{' '}
                        / cái
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-2 gap-3 border-b border-landing-line px-lg py-4">
          {[
            { Icon: Truck, label: 'Giao hàng toàn quốc 2-4 ngày' },
            { Icon: RotateCcw, label: 'Đổi size & trả hàng trong 7 ngày' },
            { Icon: ShieldCheck, label: 'Bảo mật thông tin & thanh toán 100%' },
          ].map(({ Icon, label }) => (
            <View key={label} className="flex-row items-center gap-2.5">
              <Icon size={14} strokeWidth={1.5} color={COLORS.brassInk} />
              <Text className="font-sans text-body-sm text-landing-muted">{label}</Text>
            </View>
          ))}
        </View>

        <View className="mt-2 gap-3 border-b border-landing-line px-lg py-5">
          <Text className="font-display text-[20px] text-landing-obsidian">
            Tóm tắt đơn hàng
          </Text>
          <View className="flex-row justify-between">
            <Text className="font-sans text-body-sm text-landing-muted">
              Tạm tính ({totalItems} sản phẩm)
            </Text>
            <Text className="font-mono text-[12px] text-landing-obsidian">
              {formatCurrency
                ? formatCurrency(totalPrice)
                : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
          <View className="flex-row justify-between border-b border-landing-line pb-3">
            <Text className="font-sans text-body-sm text-landing-muted">Phí vận chuyển</Text>
            <Text className="font-sans text-body-sm text-sage-ink">Tính khi đặt hàng</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Tổng thanh toán
            </Text>
            <Text className="font-mono text-[16px] text-oxblood">
              {formatCurrency
                ? formatCurrency(totalPrice)
                : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-landing-line bg-landing-paper px-lg py-4">
        <View className="flex-1 pr-4">
          <Text className="font-sans text-[10px] uppercase tracking-[0.16em] text-landing-muted">
            Tổng cộng
          </Text>
          <Text className="mt-1 font-mono text-[17px] text-oxblood">
            {formatCurrency
              ? formatCurrency(totalPrice)
              : `${totalPrice.toLocaleString('vi-VN')}đ`}
          </Text>
        </View>
        <Pressable
          className="h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-5 active:bg-landing-obsidian"
          onPress={() => (navigation as any).navigate('Checkout')}
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
            Tiến hành đặt hàng
          </Text>
          <ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
