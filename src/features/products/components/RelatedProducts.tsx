import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useProducts } from '../hooks/useProducts';
import type { IProduct } from '../types/product';
import { ProductCard } from './ProductCard';

const RELATED_PRODUCT_LIMIT = 4;
const RELATED_CARD_WIDTH = 160;

interface RelatedProductsProps {
  product: IProduct;
  onPressProduct: (productId: string) => void;
}

export function RelatedProducts({
  product,
  onPressProduct,
}: RelatedProductsProps) {
  const productsQuery = useProducts({
    category: product.category,
    limit: RELATED_PRODUCT_LIMIT + 4,
  });
  const products = useMemo(
    () =>
      (productsQuery.data?.pages.flatMap((page) => page.data) ?? [])
        .filter((item) => item.id !== product.id)
        .slice(0, RELATED_PRODUCT_LIMIT),
    [product.id, productsQuery.data],
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <View className="gap-lg border-t border-landing-line pt-xl">
      <View className="gap-xs border-b border-landing-line pb-4">
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          Gợi ý phối đồ
        </Text>
        <Text
          accessibilityRole="header"
          className="font-display text-headline-lg font-normal leading-tight text-landing-obsidian"
        >
          Có thể bạn sẽ thích
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-catalog-gap"
      >
        {products.map((item) => (
          <ProductCard
            key={item.id}
            presentation="catalog"
            product={item}
            cardWidth={RELATED_CARD_WIDTH}
            onPress={onPressProduct}
          />
        ))}
      </ScrollView>
    </View>
  );
}
