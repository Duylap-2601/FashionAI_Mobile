import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';

interface ProductDetailActionBarProps {
  canPurchase: boolean;
  onAddToCart: () => void;
  onTryOn: () => void;
}

export function ProductDetailActionBar({
  canPurchase,
  onAddToCart,
  onTryOn,
}: ProductDetailActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Thử đồ ảo với sản phẩm này"
        activeOpacity={0.72}
        onPress={onTryOn}
        style={[styles.button, styles.tryOnButton]}
      >
        <Text style={styles.tryOnText}>Thử đồ ảo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          canPurchase ? 'Thêm sản phẩm vào giỏ hàng' : 'Sản phẩm chưa thể đặt hàng'
        }
        accessibilityState={{ disabled: !canPurchase }}
        activeOpacity={0.72}
        disabled={!canPurchase}
        onPress={onAddToCart}
        style={[
          styles.button,
          styles.cartButton,
          !canPurchase && styles.disabledButton,
        ]}
      >
        <Text style={styles.cartText}>
          {canPurchase ? 'Thêm vào giỏ' : 'Tạm ngừng bán'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLine,
    backgroundColor: COLORS.surfaceLowest,
  },
  button: {
    minHeight: 52,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  tryOnButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceLowest,
  },
  cartButton: {
    backgroundColor: COLORS.primaryContainer,
  },
  disabledButton: {
    backgroundColor: COLORS.outlineVariant,
  },
  tryOnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
  },
  cartText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onPrimary,
  },
});
