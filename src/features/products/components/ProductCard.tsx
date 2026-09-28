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
import { IProduct } from '../types/product';
import {
  formatProductPrice,
  getProductMainImage,
} from '../utils/product-display';

interface ProductCardProps {
  product: IProduct;
  cardWidth: number;
  onPress: (productId: string) => void;
}

export function ProductCard({ product, cardWidth, onPress }: ProductCardProps) {
  const imageUrl = getProductMainImage(product);
  const [imageFailed, setImageFailed] = useState(false);
  const showOriginalPrice =
    product.originalPrice !== null && product.originalPrice > product.price;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <View style={[styles.container, { width: cardWidth }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatProductPrice(product.price)}`}
        onPress={() => onPress(product.id)}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            transition={150}
            style={styles.media}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.media, styles.imagePlaceholder]}>
            <Text style={styles.placeholderMark}>◇</Text>
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}

        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatProductPrice(product.price)}</Text>
            {showOriginalPrice ? (
              <Text style={styles.originalPrice}>
                {formatProductPrice(product.originalPrice!)}
              </Text>
            ) : null}
          </View>

          <View style={styles.ratingRow}>
            <Text accessibilityElementsHidden style={styles.star}>
              ★
            </Text>
            <Text style={styles.rating}>
              {product.avgRating.toFixed(1)} ({product.reviewCount})
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
  media: {
    width: '100%',
    aspectRatio: 0.78,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceLine,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  placeholderMark: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.outline,
  },
  placeholderText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
  },
  details: {
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  name: {
    minHeight: 40,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  price: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
    fontVariant: ['tabular-nums'],
  },
  originalPrice: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.outline,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  star: {
    color: COLORS.tertiary,
    fontSize: FONT_SIZE.xs,
  },
  rating: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
});
