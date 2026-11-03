import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import {
  ArrowUpRight,
  Check,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { useLocalCartReady } from '../hooks/use-local-cart-ready';
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

export const ProductCard = React.memo(function ProductCard({
  product,
  cardWidth,
  onPress,
}: ProductCardProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const addItem = useCartStore((state) => state.addItem);
  const cartReady = useLocalCartReady();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageUrl = getProductMainImage(product);
  const imageFailed = failedImageUrl === imageUrl;

  const hasDiscount =
    product.originalPrice !== null && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100,
      )
    : 0;
  const hasRating = product.avgRating > 0 || product.reviewCount > 0;
  const ratingValue = product.avgRating > 0 ? product.avgRating : 5;

  useEffect(
    () => () => {
      if (addedTimeout.current) {
        clearTimeout(addedTimeout.current);
      }
    },
    [],
  );

  const handleQuickAdd = useCallback(() => {
    if (!cartReady) return;

    const color =
      product.colors?.find((item) => item.name.trim())?.name.trim() ??
      product.color?.trim() ??
      undefined;

    addItem({
      productId: product.id,
      productName: product.name,
      color,
      quantity: 1,
      price: product.price,
      imageUrl: imageUrl ?? undefined,
    });

    setJustAdded(true);
    if (addedTimeout.current) {
      clearTimeout(addedTimeout.current);
    }
    addedTimeout.current = setTimeout(() => setJustAdded(false), 1400);
  }, [addItem, cartReady, imageUrl, product]);

  const handleTryOn = useCallback(() => {
    navigation.navigate('Main', {
      screen: 'TryOnTab',
      params: {
        screen: 'TryOnHome',
        params: {
          productId: product.id,
          productName: product.name,
          productImageUrl: imageUrl ?? undefined,
          category: product.category,
        },
      },
    });
  }, [imageUrl, navigation, product]);

  return (
    <View style={{ width: cardWidth }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatProductPrice(product.price)}`}
        onPress={() => onPress(product.id)}
        className="w-full active:opacity-85"
      >
        <View className="relative aspect-[3/4] w-full overflow-hidden bg-landing-paper">
          {imageUrl && !imageFailed ? (
            <Image
              source={{ uri: imageUrl }}
              contentFit="cover"
              contentPosition="top"
              transition={150}
              style={StyleSheet.absoluteFill}
              onError={() => setFailedImageUrl(imageUrl)}
            />
          ) : (
            <View className="h-full w-full items-center justify-center gap-xs bg-landing-paper">
              <Text className="font-sans text-headline-md text-landing-muted">
                ⌕
              </Text>
              <Text className="font-sans text-body-sm text-landing-muted">
                Chưa có ảnh
              </Text>
            </View>
          )}

          <View
            pointerEvents="none"
            className="absolute left-2 top-2 z-10 flex-row flex-wrap gap-1"
          >
            {hasDiscount && discountPercent > 0 ? (
              <View className="bg-landing-oxblood px-2 py-1">
                <Text className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-landing-paper">
                  -{discountPercent}%
                </Text>
              </View>
            ) : (product as { isNew?: boolean }).isNew ? (
              <View className="bg-landing-sage px-2 py-1">
                <Text className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-landing-obsidian">
                  Mới
                </Text>
              </View>
            ) : null}
          </View>

          <View className="absolute inset-x-2 bottom-2 z-20 flex-row items-center gap-1.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                justAdded
                  ? `Đã thêm ${product.name} vào giỏ hàng`
                  : `Thêm ${product.name} vào giỏ hàng`
              }
              onPress={(event) => {
                event.stopPropagation();
                handleQuickAdd();
              }}
              className="h-10 flex-1 items-center justify-center bg-landing-obsidian active:opacity-80"
            >
              {justAdded ? (
                <Check size={14} color={COLORS.paper} />
              ) : (
                <ShoppingBag size={14} color={COLORS.paper} />
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thử đồ AI cho ${product.name}`}
              onPress={(event) => {
                event.stopPropagation();
                handleTryOn();
              }}
              className="h-10 w-10 items-center justify-center border border-landing-line bg-landing-paper active:opacity-80"
            >
              <Sparkles size={16} color={COLORS.oxblood} />
            </Pressable>
          </View>
        </View>

        <View className="pt-4">
          <View className="flex-row items-center justify-between gap-sm">
            <Text
              numberOfLines={1}
              className="flex-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted"
            >
              {product.brand || 'StAie. Signature'}
            </Text>
            {hasRating ? (
              <View className="shrink-0 flex-row items-center gap-1">
                <Star size={11} color={COLORS.brass} fill={COLORS.brass} />
                <Text className="font-sans text-[10px] font-medium text-landing-brass-ink">
                  {ratingValue.toFixed(1)}
                </Text>
                {product.reviewCount ? (
                  <Text className="font-sans text-[10px] text-landing-muted">
                    ({product.reviewCount})
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text
            numberOfLines={2}
            className="mb-3 mt-2 min-h-[42px] font-display text-[16px] font-medium leading-[21px] text-landing-obsidian"
          >
            {product.name}
          </Text>

          <View className="flex-row items-baseline justify-between gap-sm border-t border-landing-line pt-3">
            <View className="flex-1 flex-row flex-wrap items-baseline gap-1.5">
              <Text className="font-mono text-base font-medium tracking-[0.02em] text-landing-oxblood">
                {formatProductPrice(product.price)}
              </Text>
              {hasDiscount ? (
                <Text className="font-mono text-[10px] text-landing-muted line-through">
                  {formatProductPrice(product.originalPrice!)}
                </Text>
              ) : null}
            </View>
            <ArrowUpRight size={14} color={COLORS.muted} />
          </View>
        </View>
      </Pressable>
    </View>
  );
});
