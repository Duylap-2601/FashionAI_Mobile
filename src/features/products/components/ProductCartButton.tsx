import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/hooks/use-cart";
import { useLocalCartReady } from "../hooks/use-local-cart-ready";

export function ProductCartButton({ onPress }: { onPress: () => void }) {
  const { isAuthenticated } = useAuth();
  const ready = useLocalCartReady();
  const total = useCart().getTotalItems();
  const showCount = isAuthenticated && ready && total > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        showCount ? `Giỏ hàng, ${total} sản phẩm` : "Xem giỏ hàng"
      }
      onPress={onPress}
      className="relative h-11 w-11 items-center justify-center rounded-full active:opacity-70"
    >
      <ShoppingBag size={18} strokeWidth={1.75} color={COLORS.obsidian} />
      {!ready && isAuthenticated ? (
        <ActivityIndicator
          accessibilityLabel="Đang tải giỏ hàng"
          size="small"
          color={COLORS.oxblood}
          className="absolute right-0 top-0"
        />
      ) : showCount ? (
        <View
          pointerEvents="none"
          className="absolute right-0 top-0 h-5 min-w-5 items-center justify-center rounded-full border-2 border-landing-paper bg-landing-oxblood px-1"
        >
          <Text className="font-mono text-[9px] font-semibold text-landing-paper">
            {total > 99 ? "99+" : total}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
