import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  MainTabParamList,
  RootStackParamList,
} from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { COLORS } from '@/constants/theme';

// Hàng header cố định dùng chung cho các màn Thử đồ
// (tiêu đề + wishlist + giỏ + avatar). Cụm chọn Ảnh/Camera nằm trong nội dung cuộn.
export const TryOnHeader: React.FC = () => {
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const insets = useSafeAreaInsets();

  // Khối cố định: đặt NGOÀI ScrollView để không cuộn theo nội dung,
  // giống header cố định của các tab khác (nền + viền đáy + tràn safe-area).
  return (
    <View style={{ paddingTop: insets.top }}>
      <View className="border-b border-surface-line bg-background">
        <View className="px-xl pb-md pt-sm">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-headline-sm font-bold text-on-surface">
          Thử đồ
        </Text>
        <View className="flex-row items-center gap-lg">
          <Pressable
            className="min-h-11 min-w-11 items-center justify-center rounded-full"
            accessibilityLabel="Danh sách yêu thích"
            onPress={() => {}}
          >
            <Heart size={24} color={COLORS.onSurface} />
          </Pressable>
          <Pressable
            className="min-h-11 min-w-11 items-center justify-center rounded-full"
            accessibilityLabel="Giỏ hàng"
            onPress={() => rootNavigation.navigate('Cart')}
          >
            <View>
              <ShoppingBag size={24} color={COLORS.onSurface} />
              {totalItems > 0 ? (
                <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary-container px-xs">
                  <Text className="text-label-md text-primary-foreground">
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
          <Pressable
            className="min-h-11 min-w-11 items-center justify-center rounded-full"
            accessibilityLabel="Tài khoản"
            onPress={() => tabNavigation.navigate('ProfileTab')}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="h-8 w-8 rounded-full" />
            ) : (
              <View className="h-8 w-8 items-center justify-center rounded-full bg-surface-low">
                <Text className="text-body-sm font-bold text-on-surface-variant">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
        </View>
      </View>
    </View>
  );
};

export default TryOnHeader;
