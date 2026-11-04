import React from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import { ProductsEmptyState } from '@/features/products/components/ProductsEmptyState';
import type { IProduct } from '@/features/products/types/product';
import type { Collection } from '@/features/collections/types/collection';

interface HomeFeaturedProductsProps {
  collection: Collection;
  products: IProduct[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPressCollection: (slug: string) => void;
  onPressProduct: (productId: string) => void;
}

// Collection product grid in the FE ProductGrid language: brass label, serif
// collection name, `Xem tất cả` text link, 2-column catalog cards.
export function HomeFeaturedProducts({
  collection,
  products,
  isLoading,
  isError,
  onRetry,
  onPressCollection,
  onPressProduct,
}: HomeFeaturedProductsProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(
    1,
    (width - SPACING.lg * 2 - SPACING.catalogGap) / 2,
  );
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="gap-xxl border-b border-landing-line bg-landing-ivory py-14">
      <View className="gap-sm px-lg">
        <View className="flex-row items-center justify-between gap-md">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
            Bộ sưu tập
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem tất cả sản phẩm của ${collection.name}`}
            onPress={() => onPressCollection(collection.slug)}
            className="min-h-11 flex-row items-center gap-1.5 active:opacity-75"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-oxblood">
              Xem tất cả
            </Text>
            <ArrowUpRight size={14} color={COLORS.oxblood} />
          </Pressable>
        </View>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fontFamilyDisplay,
            fontSize: 24,
            lineHeight: 30,
            color: COLORS.obsidian,
          }}
        >
          {collection.name}
        </Text>
        {collection.description ? (
          <Text
            numberOfLines={2}
            className="font-sans text-[15px] leading-relaxed text-landing-muted"
          >
            {collection.description}
          </Text>
        ) : null}
      </View>
      {isLoading && products.length === 0 ? (
        <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
      ) : isError && products.length === 0 ? (
        <ProductsEmptyState
          title="Chưa thể tải sản phẩm"
          description="Vui lòng kiểm tra kết nối và thử lại."
          actionTitle="Thử lại"
          onAction={onRetry}
        />
      ) : products.length === 0 ? (
        <ProductsEmptyState
          title="Bộ sưu tập chưa có sản phẩm"
          description="Các thiết kế mới sẽ được cập nhật tại đây."
        />
      ) : (
        <>
          {isError ? (
            <View
              accessibilityRole="alert"
              className="mx-lg min-h-12 flex-row items-center gap-md rounded-subtle border border-landing-line bg-landing-paper p-md"
            >
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                Chưa thể cập nhật sản phẩm mới nhất. Dữ liệu đã tải vẫn được giữ
                lại.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thử tải lại sản phẩm"
                onPress={onRetry}
                className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-oxblood">
                  Thử lại
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View className="flex-row flex-wrap justify-between gap-y-lg px-lg">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                presentation="catalog"
                product={product}
                cardWidth={cardWidth}
                onPress={onPressProduct}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
