import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { SPACING } from '@/constants/theme';
import { GarmentTypeTabs } from '@/features/products/components/GarmentTypeTabs';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import { matchesGarmentType } from '@/features/products/utils/product-filters';
import { LandingSectionHeading } from './LandingSectionHeading';
import type { GarmentType, IProduct } from '@/features/products/types/product';

interface HomeProductSectionProps {
  chapter?: string;
  badge: string;
  title: string;
  subtitle?: string;
  products: IProduct[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  showCategories?: boolean;
  onPressProduct: (productId: string) => void;
  onPressViewAll: () => void;
}

export function HomeProductSection({
  chapter = '03',
  badge,
  title,
  subtitle,
  products,
  isLoading = false,
  isError = false,
  onRetry,
  showCategories = false,
  onPressProduct,
  onPressViewAll,
}: HomeProductSectionProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(
    1,
    width < 420
      ? (width - SPACING.lg * 2 - 12) / 2
      : (width - SPACING.lg * 2 - SPACING.catalogGap) / 2,
  );

  const [activeGarmentType, setActiveGarmentType] =
    useState<GarmentType | null>(null);

  const filteredProducts = useMemo(() => {
    if (!showCategories || !activeGarmentType) {
      return products;
    }

    return products.filter((product) =>
      matchesGarmentType(product, activeGarmentType),
    );
  }, [products, activeGarmentType, showCategories]);

  return (
    <View className="bg-landing-ivory py-16">
      {/* Chapter 03 Section Heading */}
      <View className="px-lg">
        <LandingSectionHeading
          chapter={chapter}
          eyebrow={badge}
          title={title}
          description={subtitle}
          action={
            products.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPressViewAll}
                className="flex-row items-center gap-1.5 active:opacity-75"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-oxblood">
                  Xem tất cả
                </Text>
                <ArrowUpRight size={14} color="#5D1C34" />
              </Pressable>
            ) : null
          }
        />
      </View>

      {/* Category Tabs: Underline Text Tabs */}
      {showCategories && (
        <View className="mb-6 mt-8">
          <GarmentTypeTabs
            activeGarmentType={activeGarmentType}
            onSelect={setActiveGarmentType}
          />
        </View>
      )}

      {/* Grid Content */}
      {isLoading && products.length === 0 ? (
        <View className="mt-6 px-lg">
          <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
        </View>
      ) : isError && products.length === 0 ? (
        <View className="mt-6 items-center justify-center px-lg py-8">
          <Text className="mb-md font-sans text-body-md text-landing-muted">
            Chưa thể tải sản phẩm. Vui lòng thử lại.
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              className="min-h-11 items-center justify-center rounded-subtle bg-landing-oxblood px-lg active:opacity-80"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-wider text-landing-paper">
                Thử lại
              </Text>
            </Pressable>
          )}
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="mx-lg mt-6 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper p-8">
          <Text className="text-center font-sans text-body-sm text-landing-muted">
            Không tìm thấy sản phẩm phù hợp trong danh mục này.
          </Text>
        </View>
      ) : (
        <View className="mt-4 flex-row flex-wrap justify-between px-lg gap-y-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              presentation="catalog"
              product={product}
              cardWidth={cardWidth}
              onPress={onPressProduct}
            />
          ))}
        </View>
      )}
    </View>
  );
}
