import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { SPACING } from '@/constants/theme';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
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

  return (
    <View className="gap-xxl border-b border-catalog-line py-14">
      <View className="gap-sm px-lg">
        <Text className="font-sans text-label-md uppercase tracking-widest text-primary-container">
          BỘ SƯU TẬP
        </Text>
        <Text className="font-sans text-headline-lg font-bold uppercase text-on-surface-strong">
          Thiết kế: {collection.name}
        </Text>
        {collection.description ? (
          <Text
            numberOfLines={2}
            className="font-sans text-body-md text-catalog-muted-text"
          >
            {collection.description}
          </Text>
        ) : null}
        <Button
          title="Xem tất cả →"
          variant="ghost"
          size="sm"
          className="self-start !px-0"
          textClassName="font-sans !text-primary-container underline"
          onPress={() => onPressCollection(collection.slug)}
        />
      </View>
      {isLoading && products.length === 0 ? (
        <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
      ) : isError && products.length === 0 ? (
        <ErrorView
          title="Chưa thể tải sản phẩm"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={onRetry}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon="◇"
          title="Bộ sưu tập chưa có sản phẩm"
          description="Các thiết kế mới sẽ được cập nhật tại đây."
        />
      ) : (
        <>
          {isError ? (
            <View accessibilityRole="alert" className="gap-sm px-lg">
              <Text className="font-sans text-body-sm text-on-surface-variant">
                Chưa thể cập nhật sản phẩm mới nhất. Dữ liệu đã tải vẫn được giữ
                lại.
              </Text>
              <Button
                title="Thử lại"
                variant="ghost"
                size="sm"
                onPress={onRetry}
              />
            </View>
          ) : null}
          <View className="flex-row flex-wrap gap-x-catalog-gap gap-y-lg px-lg">
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
