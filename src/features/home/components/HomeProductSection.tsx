import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import type { IProduct } from '@/features/products/types/product';

interface HomeProductSectionProps {
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

const CATEGORY_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'BLAZER', label: 'Áo Blazer & Vest', keywords: ['blazer', 'vest', 'suit'] },
  { key: 'DRESS', label: 'Váy & Đầm', keywords: ['đầm', 'váy', 'dress', 'skirt'] },
  { key: 'PANTS', label: 'Quần tây', keywords: ['quần', 'pant', 'trouser'] },
  { key: 'SHIRT', label: 'Áo sơ mi', keywords: ['sơ mi', 'shirt'] },
];

export function HomeProductSection({
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
  const cardWidth = Math.max(1, width < 420 ? width - SPACING.lg * 2 : (width - SPACING.lg * 2 - SPACING.catalogGap) / 2);

  const [activeCategoryKey, setActiveCategoryKey] = useState('ALL');

  const filteredProducts = useMemo(() => {
    if (!showCategories || activeCategoryKey === 'ALL') {
      return products;
    }
    const tab = CATEGORY_TABS.find((t) => t.key === activeCategoryKey);
    if (!tab?.keywords) return products;

    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const garment = p.garmentType?.toLowerCase() ?? '';
      return tab.keywords.some((kw) => name.includes(kw) || garment.includes(kw));
    });
  }, [products, activeCategoryKey, showCategories]);

  return (
    <View className="border-b border-catalog-line bg-surface-lowest py-14">
      {/* Header */}
      <View className="mb-xxxl gap-md px-lg">
        <View className="flex-row items-center gap-xs self-start">
          <Sparkles size={12} color={COLORS.primaryContainer} />
          <Text className="font-sans text-label-md font-bold uppercase tracking-widest text-primary-container">
            {badge}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={2}
            className="flex-1 font-sans text-headline-lg font-bold uppercase tracking-tight text-on-surface-strong"
          >
            {title}
          </Text>
        </View>

        {subtitle ? (
          <Text
            numberOfLines={2}
            className="font-sans text-body-md leading-relaxed text-catalog-muted-text"
          >
            {subtitle}
          </Text>
        ) : null}
        {products.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={onPressViewAll} className="min-h-11 flex-row items-center gap-sm self-start active:opacity-70">
            <Text className="font-sans text-body-md font-semibold text-primary-container">Xem tất cả</Text>
            <ArrowRight size={16} color={COLORS.primaryContainer} />
          </Pressable>
        ) : null}
      </View>

      {/* Category Tabs (Horizontal Scrollable) */}
      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-sm px-lg pb-xxxl"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.key === activeCategoryKey;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveCategoryKey(tab.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={`min-h-11 px-lg rounded-full items-center justify-center border ${
                  isActive
                    ? 'bg-primary-container border-primary-container'
                    : 'bg-catalog-muted border-catalog-line'
                }`}
              >
                <Text
                  className={`font-sans text-body-sm font-semibold ${
                    isActive ? 'text-on-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Grid Content */}
      {isLoading && products.length === 0 ? (
        <View className="px-4">
          <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
        </View>
      ) : isError && products.length === 0 ? (
        <View className="px-4 py-8 items-center justify-center">
          <Text className="mb-md font-sans text-body-md text-catalog-muted-text">
            Chưa thể tải sản phẩm. Vui lòng thử lại.
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              className="min-h-11 items-center justify-center rounded-xl bg-primary-container px-lg"
            >
              <Text className="font-sans text-body-sm font-bold text-on-primary">Thử lại</Text>
            </Pressable>
          )}
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="mx-4 py-10 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 items-center justify-center px-4">
          <Text className="text-center font-sans text-body-md text-catalog-muted-text">
            Không tìm thấy sản phẩm trong danh mục này.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-x-catalog-gap gap-y-4 px-4">
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
