import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { GarmentTypeTabs } from '@/features/products/components/GarmentTypeTabs';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import { ProductsEmptyState } from '@/features/products/components/ProductsEmptyState';
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
  // 2-column catalog grid: 10px column gap (design/DESIGN.md › Shop).
  const cardWidth = Math.max(
    1,
    (width - SPACING.lg * 2 - SPACING.catalogGap) / 2,
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
                className="min-h-11 flex-row items-center gap-1.5 active:opacity-75"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-oxblood">
                  Xem tất cả
                </Text>
                <ArrowUpRight size={14} color={COLORS.oxblood} />
              </Pressable>
            ) : null
          }
        />
      </View>

      {/* Category Tabs: Underline Text Tabs */}
      {showCategories && (
        <View className="mb-6 mt-9">
          <GarmentTypeTabs
            activeGarmentType={activeGarmentType}
            onSelect={setActiveGarmentType}
          />
        </View>
      )}

      {/* Grid Content */}
      {isLoading && products.length === 0 ? (
        // ProductGridSkeleton carries its own px-lg, so no extra padding here.
        <View className="mt-6">
          <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
        </View>
      ) : isError && products.length === 0 ? (
        <View className="mt-6">
          <ProductsEmptyState
            title="Chưa thể tải sản phẩm"
            description="Vui lòng kiểm tra kết nối và thử lại."
            actionTitle={onRetry ? 'Thử lại' : undefined}
            onAction={onRetry}
          />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="mx-lg mt-6 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper px-6 py-16">
          <Text className="text-center font-sans text-[15px] leading-relaxed text-landing-muted">
            Không tìm thấy sản phẩm phù hợp trong danh mục này.
          </Text>
        </View>
      ) : (
        <View className="mt-4 flex-row flex-wrap justify-between gap-y-lg px-lg">
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
