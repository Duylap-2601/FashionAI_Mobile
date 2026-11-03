import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ProductsEmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
}

// Mirrors FE ProductList › EmptyProducts (FashionAI_FE/src/features/products/components/listing/ProductList.tsx).
export function ProductsEmptyState({
  title,
  description,
  actionTitle,
  onAction,
}: ProductsEmptyStateProps) {
  return (
    <View className="mx-lg mb-xl items-center border border-landing-line bg-landing-ivory px-lg py-16">
      <Text className="max-w-[420px] text-center font-display text-[20px] leading-snug text-landing-obsidian">
        {title}
      </Text>
      {description ? (
        <Text className="mt-3 max-w-[360px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={onAction}
          className="mt-8 h-11 items-center justify-center rounded-subtle bg-landing-obsidian px-xl active:bg-landing-oxblood"
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            {actionTitle}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default ProductsEmptyState;
