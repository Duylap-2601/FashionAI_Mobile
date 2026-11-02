import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/theme';

const PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

interface ProductGridSkeletonProps {
  cardWidth: number;
  presentation?: 'default' | 'catalog';
}

export function ProductGridSkeleton({
  cardWidth,
  presentation = 'default',
}: ProductGridSkeletonProps) {
  if (presentation === 'catalog') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Đang tải sản phẩm"
        className="flex-row flex-wrap gap-catalog-gap px-lg"
      >
        {PLACEHOLDERS.map((placeholder) => (
          <View key={placeholder} style={{ width: cardWidth }}>
            <View className="aspect-[3/4] w-full bg-landing-taupe/45" />
            <View className="pt-4">
              <View className="h-3 w-1/3 bg-landing-line" />
              <View className="mb-3 mt-2 h-10 w-full bg-landing-line" />
              <View className="flex-row items-center justify-between border-t border-landing-line pt-3">
                <View className="h-4 w-2/3 bg-landing-line" />
                <View className="h-3 w-3 bg-landing-line" />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải sản phẩm"
      style={styles.grid}
    >
      {PLACEHOLDERS.map((placeholder) => (
        <View key={placeholder} style={[styles.card, { width: cardWidth }]}>
          <View style={styles.image} />
          <View style={styles.title} />
          <View style={styles.price} />
          <View style={styles.rating} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    gap: SPACING.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainer,
  },
  title: {
    width: '88%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  price: {
    width: '62%',
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceHigh,
  },
  rating: {
    width: '42%',
    height: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
});
