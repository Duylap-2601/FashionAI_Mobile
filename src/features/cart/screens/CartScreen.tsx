import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Minus, Plus, Bookmark, ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { formatCurrency } from '@/utils/format';

export function CartScreen() {
  const navigation = useNavigation();
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <View className="flex-row items-center px-4 py-3 bg-surface-lowest border-b border-surface-line">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <View className="flex-1 items-center flex-row justify-center gap-1">
          <Text className="text-headline-sm text-on-surface font-semibold">
            Shopping Cart
          </Text>
          <Text className="text-label-md text-on-surface-variant font-medium mt-1">
            ({totalItems} MÓN)
          </Text>
        </View>
        <View className="w-10 h-10 bg-primary rounded-full" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-4 flex-col gap-6">
          {items.map((item, index) => (
            <View key={`${item.productId}-${item.variantId}-${index}`} className="flex-row gap-4 pb-6 border-b border-surface-line">
              <View className="w-[100px] h-[120px] rounded-xl overflow-hidden bg-surface relative">
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="w-full h-full" contentFit="cover" />
                ) : (
                  <View className="w-full h-full bg-surface-container" />
                )}
                {index === 0 && (
                  <View className="absolute top-0 left-0 bg-primary px-2 py-1 rounded-br-lg">
                    <Text className="text-on-primary text-[10px] font-bold">Vừa dáng</Text>
                  </View>
                )}
              </View>

              <View className="flex-1 justify-between py-1">
                <View>
                  <View className="flex-row justify-between items-start">
                    <Text className="text-body-md text-on-surface font-semibold flex-1 pr-2" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Pressable onPress={() => removeItem(item.productId, item.variantId)} className="p-1 -mr-2 -mt-1 active:opacity-50">
                      <X size={20} color="#666" />
                    </Pressable>
                  </View>
                  <Text className="text-label-sm text-on-surface-variant mt-1">
                    {item.size ? `Size ${item.size}` : (item.variantId || 'Standard')}
                  </Text>
                  
                  <View className="flex-row items-center gap-2 mt-2">
                    <Text className="text-price-sm text-primary font-bold">
                      {formatCurrency ? formatCurrency(item.price) : `${item.price.toLocaleString('vi-VN')}đ`}
                    </Text>
                    {index === 1 && (
                      <Text className="text-label-sm text-on-surface-variant line-through">
                        950.000đ
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row justify-between items-center mt-3">
                  <View className="flex-row items-center bg-surface rounded-lg">
                    <Pressable 
                      onPress={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="p-2 active:bg-surface-line rounded-l-lg"
                    >
                      <Minus size={16} color="#1A1A1A" />
                    </Pressable>
                    <Text className="text-body-md text-on-surface font-semibold px-3 w-8 text-center">
                      {item.quantity}
                    </Text>
                    <Pressable 
                      onPress={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="p-2 active:bg-surface-line rounded-r-lg"
                    >
                      <Plus size={16} color="#1A1A1A" />
                    </Pressable>
                  </View>

                  <Pressable className="flex-row items-center gap-1 active:opacity-50 p-2">
                    <Bookmark size={16} color="#666" />
                    <Text className="text-label-sm text-on-surface-variant">Lưu lại</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-8 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-headline-sm text-on-surface font-bold">Hoàn thiện set</Text>
            <Text className="text-label-sm text-on-surface-variant">Gợi ý từ Stylist</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4 -mx-4 px-4 pb-4">
            <View className="bg-white p-3 rounded-xl shadow-sm w-[200px] border border-surface-line flex-row items-center gap-3">
               <View className="w-14 h-14 bg-surface rounded-md" />
               <View className="flex-1">
                 <Text className="text-label-md font-semibold text-on-surface" numberOfLines={1}>Cà vạt Lụa...</Text>
                 <Text className="text-[10px] text-on-surface-variant">Xanh Midnight</Text>
                 <Text className="text-price-sm text-primary font-bold mt-1">320.000đ</Text>
               </View>
            </View>
            <View className="bg-white p-3 rounded-xl shadow-sm w-[200px] border border-surface-line flex-row items-center gap-3">
               <View className="w-14 h-14 bg-surface rounded-md" />
               <View className="flex-1">
                 <Text className="text-label-md font-semibold text-on-surface" numberOfLines={1}>Thắt Lưng Da...</Text>
                 <Text className="text-[10px] text-on-surface-variant">Da bò Ý • Đen</Text>
                 <Text className="text-price-sm text-primary font-bold mt-1">450.000đ</Text>
               </View>
            </View>
          </ScrollView>
        </View>

        <View className="mx-4 mt-6 bg-surface-lowest border border-surface-line rounded-xl p-4 mb-8">
          <View className="flex-row justify-between mb-3">
            <Text className="text-body-md text-on-surface-variant">Tạm tính ({totalItems} món)</Text>
            <Text className="text-body-md text-on-surface font-semibold">
              {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
          <View className="h-[1px] bg-surface-line w-full mb-3" />
          <View className="flex-row justify-between items-center">
            <Text className="text-body-lg text-on-surface font-bold">Tổng</Text>
            <Text className="text-price-lg text-primary font-bold">
              {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-surface-lowest px-4 py-4 border-t border-surface-line flex-row items-center justify-between pb-8 shadow-hard-4">
        <View>
          <Text className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Tổng tạm tính</Text>
          <Text className="text-headline-lg text-on-surface font-bold">
             {formatCurrency ? formatCurrency(totalPrice) : `${totalPrice.toLocaleString('vi-VN')}đ`}
          </Text>
        </View>
        <Pressable 
          className={`px-6 py-4 rounded-xl flex-row items-center justify-center gap-2 ${totalItems > 0 ? 'bg-primary active:bg-primary-strong' : 'bg-surface-line'}`}
          disabled={totalItems === 0}
          onPress={() => (navigation as any).navigate('Checkout')}
        >
          <Text className={`text-label-lg font-bold ${totalItems > 0 ? 'text-on-primary' : 'text-on-surface-variant'}`}>
            Thanh toán ({totalItems})
          </Text>
          <ArrowRight size={18} color={totalItems > 0 ? "#FFF" : "#999"} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
