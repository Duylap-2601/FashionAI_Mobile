import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';

interface IAppHeaderProps {
  onBack?: () => void;
}

export const AppHeader: React.FC<IAppHeaderProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: COLORS.surface }}>
      <View className="z-20 flex-row items-center justify-between border-b border-surface-line bg-surface px-4 pb-3 pt-1.5">
        <View className="flex-row items-center">
          {onBack ? (
            <TouchableOpacity
              accessibilityLabel="Quay lại"
              onPress={onBack}
              className="-ml-2 mr-1 h-11 w-11 items-center justify-center rounded-full active:bg-surface-container"
            >
              <ArrowLeft size={22} color={COLORS.primaryContainer} />
            </TouchableOpacity>
          ) : null}

          <Text className="font-heading text-wordmark font-extrabold text-primary">
            St<Text className="font-black italic">AI</Text>e<Text className="font-black">.</Text>
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            accessibilityLabel="Tìm kiếm"
            onPress={() => navigation.navigate('Search')}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-container"
          >
            <Search size={22} color={COLORS.onSurface} />
          </TouchableOpacity>

          <NotificationBell />

          <TouchableOpacity
            accessibilityLabel="Giỏ hàng"
            onPress={() => navigation.navigate('Cart')}
            className="relative h-11 w-11 items-center justify-center rounded-full active:bg-surface-container"
          >
            <ShoppingBag size={22} color={COLORS.onSurface} />
            {totalCartItems > 0 ? (
              <View className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-on-primary bg-danger px-1">
                <Text className="text-label-md text-on-primary">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AppHeader;
