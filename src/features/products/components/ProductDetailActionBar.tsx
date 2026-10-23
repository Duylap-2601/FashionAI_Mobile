import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShoppingBag } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { COLORS, SPACING } from "@/constants/theme";

interface ProductDetailActionBarProps {
  canPurchase: boolean;
  cartReady: boolean;
  onAddToCart: () => void;
  onTryOn: () => void;
}

export function ProductDetailActionBar({
  canPurchase,
  cartReady,
  onAddToCart,
  onTryOn,
}: ProductDetailActionBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="border-t border-catalog-line bg-surface-lowest px-lg pt-sm">
      {/* Computed gesture inset stays outside the scrollable content. */}
      <View style={{ paddingBottom: Math.max(insets.bottom, SPACING.sm) }}>
        <View className="flex-row items-stretch gap-sm">
          <Button
            title="Thử đồ ảo"
            variant="outline"
            size="sm"
            className="min-h-14 !rounded-xl !px-md"
            textClassName="font-sans !text-body-sm !text-primary-container"
            onPress={onTryOn}
          />
          <Button
            title={canPurchase ? "Thêm vào giỏ hàng" : "Tạm ngừng bán"}
            className="min-h-14 flex-1 !rounded-xl !px-md"
            textClassName="font-sans !text-body-sm !text-on-primary"
            leftIcon={<ShoppingBag size={19} color={COLORS.onPrimary} />}
            loading={!cartReady}
            disabled={!canPurchase}
            onPress={onAddToCart}
          />
        </View>
      </View>
    </View>
  );
}
