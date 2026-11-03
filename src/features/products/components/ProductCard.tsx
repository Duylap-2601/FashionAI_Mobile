import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { IProduct } from '../types/product';
import {
  formatProductPrice,
  getProductMainImage,
} from '../utils/product-display';

interface ProductCardProps {
  product: IProduct;
  presentation?: 'default' | 'catalog';
  cardWidth: number;
  onPress: (productId: string) => void;
}

export function ProductCard({
  product,
  cardWidth,
  onPress,
  presentation = 'default',
}: ProductCardProps) {
  const imageUrl = getProductMainImage(product);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = failedImageUrl === imageUrl;
  const showOriginalPrice =
    product.originalPrice !== null && product.originalPrice > product.price;

  const discountPercent = showOriginalPrice
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  // Shop and Home opt into Atelier Paper catalog styling
  if (presentation === 'catalog') {
    // The two 1px card borders are excluded from the image's measured width.
    const mediaWidth = Math.max(1, cardWidth - 2);
    return (
      <View style={{ width: cardWidth }}>
        <Card
          variant="outlined"
          className="overflow-hidden !rounded-subtle !border-landing-line !p-0 bg-landing-paper"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${product.name}, ${formatProductPrice(product.price)}`}
            onPress={() => onPress(product.id)}
            className="w-full active:opacity-85"
          >
            <View className="relative aspect-[3/4] w-full bg-landing-ivory">
              {imageUrl && !imageFailed ? (
                <Image
                  source={{ uri: imageUrl }}
                  contentFit="cover"
                  contentPosition="top"
                  transition={150}
                  style={{ width: mediaWidth, height: mediaWidth / 0.75 }}
                  onError={() => setFailedImageUrl(imageUrl)}
                />
              ) : (
                <View className="aspect-[3/4] w-full items-center justify-center gap-xs bg-landing-ivory">
                  <Text className="font-sans text-headline-md text-landing-muted">
                    ◇
                  </Text>
                  <Text className="font-sans text-body-sm text-landing-muted">
                    Chưa có ảnh
                  </Text>
                </View>
              )}

              {/* Badges top-left */}
              <View className="absolute left-2 top-2 z-10 flex-row flex-wrap gap-1">
                {showOriginalPrice && discountPercent > 0 ? (
                  <View className="rounded-subtle bg-landing-oxblood px-1.5 py-0.5">
                    <Text className="font-mono text-[10px] font-bold text-landing-paper">
                      -{discountPercent}%
                    </Text>
                  </View>
                ) : (product as any).isNew ? (
                  <View className="rounded-subtle bg-landing-sage px-1.5 py-0.5">
                    <Text className="font-sans text-[10px] font-bold text-landing-obsidian">
                      Mới
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="gap-1 p-2.5">
              {product.brand ? (
                <Text
                  numberOfLines={1}
                  className="font-sans text-2xs uppercase tracking-widest text-landing-muted"
                >
                  {product.brand}
                </Text>
              ) : null}
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: fontFamilyDisplay,
                  fontSize: 14,
                  lineHeight: 18,
                  color: '#11100F',
                  fontWeight: '600',
                  minHeight: 36,
                }}
              >
                {product.name}
              </Text>
              <View className="mt-0.5 flex-row flex-wrap items-baseline gap-1.5">
                <Text className="font-mono text-body-sm font-bold tabular-nums text-landing-oxblood">
                  {formatProductPrice(product.price)}
                </Text>
                {showOriginalPrice ? (
                  <Text className="font-mono text-2xs tabular-nums text-landing-muted line-through">
                    {formatProductPrice(product.originalPrice!)}
                  </Text>
                ) : null}
              </View>
              {product.reviewCount > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Text
                    accessibilityElementsHidden
                    className="text-[11px] text-landing-brass"
                  >
                    ★
                  </Text>
                  <Text className="font-sans text-[11px] tabular-nums text-landing-muted">
                    {product.avgRating.toFixed(1)} ({product.reviewCount})
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </Card>
      </View>
    );
  }

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
            onError={() => setFailedImageUrl(imageUrl)}
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
            <Text style={styles.price}>
              {formatProductPrice(product.price)}
            </Text>
            {showOriginalPrice ? (
              <Text style={styles.originalPrice}>
                {formatProductPrice(product.originalPrice!)}
              </Text>
            ) : null}
          </View>

          {product.reviewCount > 0 ? (
            <View style={styles.ratingRow}>
              <Text accessibilityElementsHidden style={styles.star}>
                ★
              </Text>
              <Text style={styles.rating}>
                {product.avgRating.toFixed(1)} ({product.reviewCount})
              </Text>
            </View>
          ) : null}
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
    borderRadius: BORDER_RADIUS.subtle,
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
