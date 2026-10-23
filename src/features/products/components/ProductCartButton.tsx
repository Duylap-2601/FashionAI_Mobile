import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCartStore } from "@/features/cart/store/use-cart-store";
import { useLocalCartReady } from "../hooks/use-local-cart-ready";

export function ProductCartButton({ onPress }: { onPress: () => void }) {
  const { isAuthenticated } = useAuth();
  const ready = useLocalCartReady();
  const total = useCartStore((state) => state.getTotalItems());
  const showCount = isAuthenticated && ready && total > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        showCount ? `Giỏ hàng, ${total} sản phẩm` : "Xem giỏ hàng"
      }
      onPress={onPress}
      className="relative min-h-11 min-w-11 items-center justify-center rounded-full active:bg-catalog-muted"
    >
      <ShoppingBag size={23} color={COLORS.primaryContainer} />
      {!ready && isAuthenticated ? (
        <ActivityIndicator
          accessibilityLabel="Đang tải giỏ hàng"
          size="small"
          color={COLORS.primaryContainer}
          className="absolute right-0 top-0"
        />
      ) : showCount ? (
        <View
          pointerEvents="none"
          className="absolute right-0 top-0 min-h-5 min-w-5 items-center justify-center rounded-full border border-surface-lowest bg-primary-container px-xs"
        >
          <Text className="font-sans text-2xs font-bold text-on-primary">
            {total > 99 ? "99+" : total}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
