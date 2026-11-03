import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { COLORS } from '@/constants/theme';
import { Wordmark } from '@/components/common/Wordmark';
import type { RootStackParamList } from '@/navigation/types';

interface IAppHeaderProps {
  onBack?: () => void;
  safeAreaTop?: boolean;
}

export const AppHeader: React.FC<IAppHeaderProps> = ({ onBack, safeAreaTop = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  return (
    <View style={{ paddingTop: safeAreaTop ? insets.top : 0, backgroundColor: COLORS.paper }}>
      <View
        className="z-20 flex-row items-center justify-between border-b border-landing-line bg-landing-paper px-4"
        style={{ height: 64 }}
      >
        <View className="flex-row items-center">
          {onBack ? (
            <TouchableOpacity
              accessibilityLabel="Quay lại"
              onPress={onBack}
              className="-ml-2 mr-1 h-9 w-9 items-center justify-center rounded-full active:bg-surface-container"
            >
              <ArrowLeft size={18} color={COLORS.primaryContainer} />
            </TouchableOpacity>
          ) : null}

          <Wordmark size="md" variant="dark" />
        </View>

        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            accessibilityLabel="Tìm kiếm"
            onPress={() => navigation.navigate('Search')}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-container"
          >
            <Search size={18} color={COLORS.onSurface} />
          </TouchableOpacity>

          <NotificationBell />

          <TouchableOpacity
            accessibilityLabel="Giỏ hàng"
            onPress={() => navigation.navigate('Cart')}
            className="relative h-9 w-9 items-center justify-center rounded-full active:bg-surface-container"
          >
            <ShoppingBag size={18} color={COLORS.onSurface} />
            {totalCartItems > 0 ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-landing-paper bg-landing-oxblood px-1">
                <Text className="font-mono text-[9px] font-semibold text-landing-paper">
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
