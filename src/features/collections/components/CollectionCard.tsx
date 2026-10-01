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

interface CollectionCardProps {
  collection: Collection;
  onPress: (slug: string) => void;
}

export function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const imageUrl = collection.coverImages[0] ?? null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bộ sưu tập ${collection.name}`}
      onPress={() => onPress(collection.slug)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          contentFit="cover"
          transition={150}
          style={styles.image}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderMark}>◇</Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.name}>
        {collection.name}
      </Text>
      <Text style={styles.count}>
        {collection.productCount.toLocaleString('vi-VN')} thiết kế
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 214,
    gap: SPACING.xs,
  },
  pressed: {
    opacity: 0.72,
  },
  image: {
    width: '100%',
    aspectRatio: 0.8,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceLine,
    backgroundColor: COLORS.surfaceLow,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMark: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.outline,
  },
  name: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  count: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
});

