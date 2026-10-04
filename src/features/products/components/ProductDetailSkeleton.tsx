import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
} from '@/constants/theme';

export function ProductDetailSkeleton() {
  return (
    <ScrollView
      accessibilityLabel="Đang tải chi tiết sản phẩm"
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.media} />
      <View style={styles.details}>
        <View style={[styles.line, styles.eyebrow]} />
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.titleShort]} />
        <View style={[styles.line, styles.rating]} />
        <View style={[styles.line, styles.price]} />
        <View style={styles.divider} />
        <View style={[styles.line, styles.sectionTitle]} />
        <View style={styles.chips}>
          <View style={styles.chip} />
          <View style={styles.chip} />
          <View style={styles.chip} />
        </View>
        <View style={[styles.line, styles.body]} />
        <View style={[styles.line, styles.bodyShort]} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 112,
    backgroundColor: COLORS.commerceSurface,
  },
  media: {
    width: '100%',
    aspectRatio: 0.75,
    maxHeight: 560,
    backgroundColor: COLORS.surfaceContainer,
  },
  details: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  line: {
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  eyebrow: {
    width: '32%',
    height: 12,
  },
  title: {
    width: '92%',
    height: 28,
  },
  titleShort: {
    width: '64%',
    height: 28,
  },
  rating: {
    width: '44%',
  },
  price: {
    width: '52%',
    height: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLine,
  },
  sectionTitle: {
    width: '36%',
  },
  chips: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    width: 76,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
  },
  body: {
    width: '100%',
  },
  bodyShort: {
    width: '76%',
  },
});
