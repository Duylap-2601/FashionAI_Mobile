import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
import type { Collection } from '../types/collection';

interface CollectionHeroCardProps {
  collection: Collection;
  onPress: (slug: string) => void;
}

export function CollectionHeroCard({
  collection,
  onPress,
}: CollectionHeroCardProps) {
  const imageUrl = collection.coverImages[0] ?? null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Khám phá bộ sưu tập ${collection.name}`}
      onPress={() => onPress(collection.slug)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          contentFit="cover"
          transition={180}
          style={StyleSheet.absoluteFill}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.placeholderMark}>◇</Text>
          <Text style={styles.placeholderText}>Chưa có ảnh bộ sưu tập</Text>
        </View>
      )}

      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.kicker}>BỘ SƯU TẬP MAY ĐO</Text>
        <Text numberOfLines={2} style={styles.name}>
          {collection.name}
        </Text>
        {collection.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {collection.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {collection.productCount.toLocaleString('vi-VN')} thiết kế
          </Text>
          <Text style={styles.cta}>Khám phá ›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 400,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surfaceContainer,
  },
  pressed: {
    opacity: 0.82,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  placeholderMark: {
    fontSize: FONT_SIZE.display,
    color: COLORS.outline,
  },
  placeholderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(18, 10, 13, 0.38)',
  },
  content: {
    gap: SPACING.sm,
    padding: SPACING.xl,
    paddingTop: 120,
    backgroundColor: 'rgba(18, 10, 13, 0.58)',
  },
  kicker: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.1,
    color: COLORS.primarySoft,
  },
  name: {
    fontSize: FONT_SIZE.xxxl,
    lineHeight: 36,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onPrimary,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: COLORS.onPrimary,
  },
  metaRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onPrimary,
  },
  cta: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onPrimary,
  },
});
