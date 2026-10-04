import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/theme';

export function CollectionSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải bộ sưu tập"
      style={styles.container}
    >
      <View style={styles.hero} />
      <View style={styles.title} />
      <View style={styles.body} />
      <View style={styles.bodyShort} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  hero: {
    width: '100%',
    aspectRatio: 0.88,
    maxHeight: 460,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surfaceContainer,
  },
  title: {
    width: '58%',
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  body: {
    width: '100%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  bodyShort: {
    width: '72%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
});
