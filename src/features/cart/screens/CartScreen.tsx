import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck, RotateCcw, ShieldCheck } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { formatCurrency } from '@/utils/format';

export function CartScreen() {
  const navigation = useNavigation();
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleClearCart = () => {
    Alert.alert('Xóa tất cả', 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: clearCart }
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-row items-center px-4 py-3 bg-surface-lowest border-b border-surface-line">
          <Pressable 
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2 rounded-full active:bg-surface-line"
          >
            <ArrowLeft size={24} color="#1A1A1A" />
          </Pressable>
          <Text className="flex-1 text-center text-headline-sm text-on-surface font-semibold pr-8">
            Giỏ hàng
          </Text>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={40} color="#999" />
          </View>
          <Text className="text-headline-md font-bold text-on-surface mb-2 text-center">
            Giỏ hàng của bạn đang trống
          </Text>
          <Text className="text-body-md text-on-surface-variant mb-8 text-center max-w-[300px]">
            Hãy khám phá các trang phục công sở cao cấp và thử đồ ảo cùng AI trước khi đặt hàng nhé.
          </Text>
          <Pressable 
            className="w-full bg-primary py-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-primary-strong mb-4"
            onPress={() => (navigation as any).navigate('Main', { screen: 'ShopTab' })}
          >
            <Text className="text-label-lg font-bold text-on-primary">Khám phá bộ sưu tập</Text>
            <ArrowRight size={18} color="#FFF" />
          </Pressable>
          <Pressable 
            className="w-full bg-surface py-4 rounded-xl flex-row items-center justify-center active:bg-surface-line"
            onPress={() => (navigation as any).navigate('Main', { screen: 'ProfileTab', params: { screen: 'Orders' } })}
          >
            <Text className="text-label-lg font-bold text-on-surface">Đơn hàng của tôi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <View className="flex-row items-center px-4 py-3 bg-surface-lowest border-b border-surface-line">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <View className="flex-1 flex-col items-center justify-center">
          <Text className="text-headline-sm text-on-surface font-semibold">
            Giỏ hàng
          </Text>
          <Text className="text-label-sm text-on-surface-variant">
            {totalItems} sản phẩm
          </Text>
        </View>
        <Pressable onPress={handleClearCart} className="p-2 -mr-2">
          <Text className="text-label-md font-medium text-error">Xóa hết</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 bg-surface" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Item List */}
        <View className="bg-surface-lowest border-b border-surface-line">
          {items.map((item, index) => (
            <View key={`${item.productId}-${item.variantId}-${index}`} className="flex-row gap-4 p-4 border-b border-surface-line relative">
              <View className="w-[100px] h-[120px] rounded-xl overflow-hidden bg-surface-container border border-surface-line">
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <ShoppingBag size={24} color="#CCC" />
                  </View>
                )}
              </View>

              <View className="flex-1 justify-between py-1">
                <View className="pr-6">
                  <Text className="text-label-lg text-on-surface font-semibold mb-1" numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text className="text-body-sm text-on-surface-variant">
                    {item.color ? `${item.color} • ` : ''}Size {item.size || 'Standard'}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  {/* Quantity */}
                  <View className="flex-row items-center bg-surface border border-surface-line rounded-lg">
                    <Pressable 
                      onPress={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="p-2 active:bg-surface-line"
                    >
                      <Minus size={16} color="#666" />
                    </Pressable>
                    <View className="px-2 min-w-[32px] items-center border-x border-surface-line">
                      <Text className="text-label-md text-on-surface font-semibold">{item.quantity}</Text>
                    </View>
                    <Pressable 
                      onPress={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="p-2 active:bg-surface-line"
                    >
                      <Plus size={16} color="#666" />
                    </Pressable>
                  </View>

                  {/* Price */}
                  <View className="items-end">
                    <Text className="text-label-lg font-bold text-on-surface">
                      {formatCurrency ? formatCurrency(item.price * item.quantity) : `${(item.price * item.quantity).toLocaleString('vi-VN')}đ`}
                    </Text>
                    {item.quantity > 1 && (
                      <Text className="text-label-sm text-on-surface-variant mt-0.5">
                        {formatCurrency ? formatCurrency(item.price) : `${item.price.toLocaleString('vi-VN')}đ`} / cái
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Delete Button */}
              <Pressable 
                onPress={() => removeItem(item.productId, item.variantId)} 
                className="absolute top-4 right-4 p-2 active:opacity-50 bg-error-container/20 rounded-full"
              >
                <Trash2 size={18} color="#BE123C" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Value Props */}
        <View className="bg-surface-lowest p-4 border-b border-surface-line mt-2 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Truck size={16} color="#15803d" />
            </View>
            <Text className="text-body-sm text-on-surface-variant">Giao hàng toàn quốc 2-4 ngày</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <RotateCcw size={16} color="#1d4ed8" />
            </View>
            <Text className="text-body-sm text-on-surface-variant">Đổi size & trả hàng trong 7 ngày</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldCheck size={16} color="#7e22ce" />
            </View>
            <Text className="text-body-sm text-on-surface-variant">Bảo mật thông tin & thanh toán 100%</Text>
          </View>
        </View>

        {/* Summary */}
        <View className="bg-surface-lowest p-4 border-b border-surface-line mt-2 mb-8">
          <Text className="text-headline-sm font-bold text-on-surface mb-4">Tóm tắt đơn hàng</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-body-md text-on-surface-variant">Tạm tính ({totalItems} sản phẩm)</Text>
            <Text className="text-body-md text-on-surface font-semibold">
              {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
          <View className="flex-row justify-between mb-4 pb-4 border-b border-surface-line">
            <Text className="text-body-md text-on-surface-variant">Phí vận chuyển</Text>
            <Text className="text-body-md text-[#15803d] font-medium">Tính khi đặt hàng</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-label-lg text-on-surface font-bold">Tổng thanh toán</Text>
            <Text className="text-headline-md text-primary font-bold">
              {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-lowest px-4 py-4 border-t border-surface-line flex-row items-center justify-between shadow-hard-4">
        <View className="flex-1 pr-4">
          <Text className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Tổng cộng</Text>
          <Text className="text-headline-md text-primary font-bold">
             {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
          </Text>
        </View>
        <Pressable 
          className="bg-primary px-6 py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:bg-primary-strong"
          onPress={() => (navigation as any).navigate('Checkout')}
        >
          <Text className="text-label-lg font-bold text-on-primary">
            Tiến hành đặt hàng
          </Text>
          <ArrowRight size={18} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
