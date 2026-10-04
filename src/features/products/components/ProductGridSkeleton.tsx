import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/theme';

const PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

interface ProductGridSkeletonProps {
  cardWidth: number;
}

export function ProductGridSkeleton({ cardWidth }: ProductGridSkeletonProps) {
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
