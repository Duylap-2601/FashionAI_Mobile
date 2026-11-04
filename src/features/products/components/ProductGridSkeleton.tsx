import React from 'react';
import { View } from 'react-native';

const PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

interface ProductGridSkeletonProps {
  cardWidth: number;
  /** Kept for existing callers; both presentations share the catalog skeleton. */
  presentation?: 'default' | 'catalog';
}

// Same taupe skeleton as FE ProductList › ProductSkeletonGrid, in the 2-column catalog grid.
export function ProductGridSkeleton({ cardWidth }: ProductGridSkeletonProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải sản phẩm"
      className="flex-row flex-wrap gap-x-catalog-gap gap-y-lg px-lg"
    >
      {PLACEHOLDERS.map((placeholder) => (
        <View key={placeholder} style={{ width: cardWidth }}>
          <View className="aspect-[3/4] w-full bg-landing-taupe/45" />
          <View className="gap-2.5 pt-4">
            <View className="h-2.5 w-16 bg-landing-taupe/45" />
            <View className="h-4 w-3/4 bg-landing-taupe/45" />
            <View className="mt-3 h-3 w-1/2 bg-landing-taupe/45" />
          </View>
        </View>
      ))}
    </View>
  );
}
