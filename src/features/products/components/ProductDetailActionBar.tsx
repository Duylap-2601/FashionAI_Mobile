import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShoppingBag, Sparkles } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { COLORS, SPACING } from "@/constants/theme";

interface ProductDetailActionBarProps {
  canPurchase: boolean;
  cartReady: boolean;
  onAddToCart: () => void;
  onTryOn: () => void;
}

// FE ProductPurchasePanel button labels: uppercase 11px, 0.16em tracking, square 2px corners.
const ACTION_LABEL_CLASS =
  "font-sans !text-[11px] !font-semibold uppercase !tracking-[0.16em]";

export function ProductDetailActionBar({
  canPurchase,
  cartReady,
  onAddToCart,
  onTryOn,
}: ProductDetailActionBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="border-t border-landing-line bg-ivory px-lg pt-sm">
      {/* Computed gesture inset stays outside the scrollable content. */}
      <View style={{ paddingBottom: Math.max(insets.bottom, SPACING.sm) }}>
        <View className="flex-row items-stretch gap-sm">
          <Button
            title="Thử đồ AI"
            variant="outline"
            size="sm"
            className="min-h-12 !rounded-subtle !border-landing-line !bg-transparent !px-md"
            textClassName={`${ACTION_LABEL_CLASS} !text-landing-obsidian`}
            leftIcon={<Sparkles size={16} strokeWidth={1.75} color={COLORS.oxblood} />}
            onPress={onTryOn}
          />
          <Button
            title={canPurchase ? "Thêm vào giỏ" : "Tạm ngừng bán"}
            className="min-h-12 flex-1 !rounded-subtle !bg-oxblood !px-md"
            textClassName={`${ACTION_LABEL_CLASS} !text-landing-paper`}
            leftIcon={<ShoppingBag size={16} strokeWidth={1.75} color={COLORS.paper} />}
            loading={!cartReady}
            disabled={!canPurchase}
            onPress={onAddToCart}
          />
        </View>
      </View>
    </View>
  );
}
