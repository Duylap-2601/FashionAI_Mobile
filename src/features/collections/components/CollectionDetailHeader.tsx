import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
import type { Collection } from '../types/collection';

interface CollectionDetailHeaderProps {
  collection: Collection;
  productTotal: number;
}

export function CollectionDetailHeader({
  collection,
  productTotal,
}: CollectionDetailHeaderProps) {
  const imageUrl = collection.coverImages[0] ?? null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <View style={styles.container}>
      {imageUrl && !imageFailed ? (
        <Image
          accessibilityLabel={`Ảnh bộ sưu tập ${collection.name}`}
          source={{ uri: imageUrl }}
          contentFit="cover"
          transition={180}
          style={styles.hero}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          accessibilityLabel={`${collection.name}, chưa có ảnh bộ sưu tập`}
          style={[styles.hero, styles.placeholder]}
        >
          <Text style={styles.placeholderMark}>◇</Text>
          <Text style={styles.placeholderText}>Chưa có ảnh bộ sưu tập</Text>
        </View>
      )}

      <View style={styles.copy}>
        <Text style={styles.kicker}>BỘ SƯU TẬP MAY ĐO</Text>
        <Text selectable style={styles.name}>
          {collection.name}
        </Text>
        {collection.description ? (
          <Text selectable style={styles.description}>
            {collection.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.productsHeading}>
        <Text style={styles.productsTitle}>Thiết kế trong bộ sưu tập</Text>
        <Text style={styles.productsCount}>
          {productTotal.toLocaleString('vi-VN')} sản phẩm
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  hero: {
    width: '100%',
    aspectRatio: 0.9,
    maxHeight: 500,
    backgroundColor: COLORS.surfaceLow,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  placeholderMark: {
    fontSize: FONT_SIZE.display,
    color: COLORS.outline,
  },
  placeholderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
  },
  copy: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  kicker: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.1,
    color: COLORS.primaryContainer,
  },
  name: {
    fontSize: FONT_SIZE.xxxl,
    lineHeight: 36,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
  productsHeading: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLine,
  },
  productsTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  productsCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
});

