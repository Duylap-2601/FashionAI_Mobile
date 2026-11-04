import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useCart } from '@/features/cart/hooks/use-cart';
import { COLORS } from '@/constants/theme';
import { Wordmark } from '@/components/common/Wordmark';
import type { RootStackParamList } from '@/navigation/types';

interface IAppHeaderProps {
  onBack?: () => void;
  safeAreaTop?: boolean;
  showSearch?: boolean;
}

export const AppHeader: React.FC<IAppHeaderProps> = ({
  onBack,
  safeAreaTop = true,
  showSearch = true,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { getTotalItems } = useCart();
  const totalCartItems = getTotalItems();

  return (
    // paddingTop là inset an toàn (giá trị tính lúc chạy), nền paper nằm ở className.
    <View className="bg-landing-paper" style={{ paddingTop: safeAreaTop ? insets.top : 0 }}>
      <View className="z-20 h-16 flex-row items-center justify-between border-b border-landing-line bg-landing-paper px-4">
        <View className="flex-row items-center">
          {onBack ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={onBack}
              className="-ml-3 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
            >
              <ArrowLeft size={18} color={COLORS.obsidian} />
            </TouchableOpacity>
          ) : null}

          <Wordmark size="md" variant="dark" />
        </View>

        <View className="-mr-1 flex-row items-center">
          {showSearch ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Tìm kiếm"
              onPress={() => navigation.navigate('Search')}
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
            >
              <Search size={18} color={COLORS.obsidian} />
            </TouchableOpacity>
          ) : null}

          <NotificationBell />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              totalCartItems > 0 ? `Giỏ hàng, ${totalCartItems} sản phẩm` : 'Giỏ hàng'
            }
            onPress={() => navigation.navigate('Cart')}
            className="relative h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <ShoppingBag size={18} color={COLORS.obsidian} />
            {totalCartItems > 0 ? (
              <View
                pointerEvents="none"
                className="absolute right-0 top-0 h-5 min-w-5 items-center justify-center rounded-full border-2 border-landing-paper bg-landing-oxblood px-1"
              >
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
