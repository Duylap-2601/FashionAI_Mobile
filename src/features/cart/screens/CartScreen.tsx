import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '@/features/cart/hooks/use-cart';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

export function CartScreen() {
  const navigation = useNavigation();
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
    isLoading,
    isError,
    refetch,
  } = useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const openCheckout = () => (navigation as any).navigate('Checkout');
  const openOrders = () =>
    (navigation as any).navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'Orders' },
    });

  const renderHeader = () => (
    <View className="flex-row items-start justify-between gap-4 border-b border-landing-line px-lg pb-4 pt-5">
      <View className="flex-1">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          Giỏ hàng
        </Text>
        <Text className="mt-1.5 font-display text-[24px] leading-tight text-landing-obsidian">
          Túi của bạn{' '}
          <Text className="font-mono text-sm text-landing-muted">({items.length})</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Đóng giỏ hàng"
        className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
      >
        <X size={20} strokeWidth={1.75} color={COLORS.muted} />
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-landing-paper">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={COLORS.oxblood} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-landing-paper">
        {renderHeader()}
        <View className="flex-1 items-center justify-center px-lg">
          <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
            Không tải được giỏ hàng
          </Text>
          <Text className="mt-2 text-center font-sans text-sm text-landing-muted">
            Kiểm tra kết nối rồi thử lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            className="mt-6 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:bg-ivory"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Thử lại
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-landing-paper">
        {renderHeader()}
        <View className="flex-1 items-center justify-center px-lg">
          <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
            Giỏ hàng đang trống
          </Text>
          <Text className="mt-2 max-w-[260px] text-center font-sans text-sm leading-relaxed text-landing-muted">
            Chọn một thiết kế, thử trên bạn rồi thêm vào đây.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (navigation as any).navigate('Main', { screen: 'ShopTab' })}
            className="mt-6 h-11 items-center justify-center rounded-subtle bg-oxblood px-6 active:bg-landing-obsidian"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Xem sản phẩm
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={openOrders}
            className="mt-3 min-h-11 justify-center active:opacity-60"
          >
            <Text className="font-sans text-xs text-landing-muted">Đơn hàng của tôi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      {renderHeader()}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-lg">
          {items.map((item, index) => {
            const lineKey = `${item.productId}-${item.variantId ?? item.id ?? index}`;
            const unavailable = item.available === false;
            return (
              <View
                key={lineKey}
                className={`flex-row gap-4 border-b border-landing-line py-4 ${
                  unavailable ? 'opacity-70' : ''
                }`}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem ${item.productName}`}
                  onPress={() =>
                    (navigation as any).navigate('ProductDetail', {
                      productId: String(item.productId),
                    })
                  }
                  className="h-24 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-subtle bg-ivory active:opacity-80"
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <ShoppingBag size={20} strokeWidth={1.25} color={COLORS.muted} />
                  )}
                </Pressable>

                <View className="min-w-0 flex-1">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          (navigation as any).navigate('ProductDetail', {
                            productId: String(item.productId),
                          })
                        }
                        className="active:opacity-70"
                      >
                        <Text
                          numberOfLines={2}
                          className="font-sans text-body-md text-landing-obsidian"
                        >
                          {item.productName}
                        </Text>
                      </Pressable>
                      <Text className="mt-1 font-sans text-xs text-landing-muted">
                        {item.color
                          ? `Màu: ${item.color} · Đặt may theo số đo`
                          : 'Đặt may theo số đo'}
                      </Text>
                      {unavailable ? (
                        <Text className="mt-1 font-sans text-xs text-danger">
                          Đã ngừng bán, không tính vào đơn hàng.
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ ${item.productName} khỏi giỏ`}
                      onPress={() => removeItem(item.productId, item.variantId ?? item.id)}
                      className="-mr-2 -mt-1 h-9 w-9 shrink-0 items-center justify-center active:opacity-60"
                    >
                      <X size={16} strokeWidth={1.75} color={COLORS.muted} />
                    </Pressable>
                  </View>

                  <View className="mt-3 flex-row items-end justify-between gap-3">
                    <View className="h-9 flex-row items-center border border-landing-line">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Giảm số lượng"
                        disabled={unavailable}
                        onPress={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.variantId ?? item.id,
                          )
                        }
                        className="h-full w-9 items-center justify-center active:opacity-60"
                      >
                        <Minus size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                      </Pressable>
                      <View className="h-full min-w-9 items-center justify-center border-x border-landing-line px-2">
                        <Text className="font-mono text-sm text-landing-obsidian">
                          {item.quantity}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tăng số lượng"
                        disabled={unavailable}
                        onPress={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.variantId ?? item.id,
                          )
                        }
                        className="h-full w-9 items-center justify-center active:opacity-60"
                      >
                        <Plus size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                      </Pressable>
                    </View>

                    <View className="items-end">
                      <Text className="font-mono text-sm text-oxblood">
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                      {item.quantity > 1 ? (
                        <Text className="mt-0.5 font-mono text-[11px] text-landing-muted">
                          {formatCurrency(item.price)} / món
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      <View className="border-t border-landing-line px-lg pb-6 pt-4">
        <View className="flex-row items-baseline justify-between gap-4">
          <Text className="font-sans text-sm text-landing-muted">
            Tạm tính · <Text className="font-mono">{totalItems}</Text> sản phẩm
          </Text>
          <Text className="font-mono text-lg text-oxblood">
            {formatCurrency(totalPrice)}
          </Text>
        </View>
        <Text className="mt-1 font-sans text-xs text-landing-muted">
          Phí giao hàng tính ở bước đặt hàng.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={openCheckout}
          className="mt-4 h-12 items-center justify-center rounded-subtle bg-oxblood active:bg-landing-obsidian"
        >
          <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            Đặt hàng
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
