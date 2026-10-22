import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { SPACING } from '@/constants/theme';
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
  const cardWidth = Math.max(1, (width - SPACING.lg * 2 - SPACING.catalogGap) / 2);

  const [activeCategoryKey, setActiveCategoryKey] = useState('ALL');

  const filteredProducts = useMemo(() => {
    if (!showCategories || activeCategoryKey === 'ALL') {
      return products;
    }
    const tab = CATEGORY_TABS.find((t) => t.key === activeCategoryKey);
    if (!tab?.keywords) return products;

    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const garment = (p as any).garmentType ? String((p as any).garmentType).toLowerCase() : '';
      return tab.keywords.some((kw) => name.includes(kw) || garment.includes(kw));
    });
  }, [products, activeCategoryKey, showCategories]);

  return (
    <View className="py-10 bg-white border-b border-catalog-line">
      {/* Header */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-[#5D1C34]/10 mb-2">
          <Sparkles size={11} color="#5D1C34" />
          <Text className="text-[#5D1C34] text-[10.5px] font-bold tracking-widest uppercase">
            {badge}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={2}
            className="flex-1 text-neutral-900 text-[20px] font-extrabold uppercase tracking-tight mr-2"
          >
            {title}
          </Text>
        </View>

        {subtitle ? (
          <Text
            numberOfLines={2}
            className="text-neutral-500 text-[12.5px] leading-relaxed mt-1"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Category Tabs (Horizontal Scrollable) */}
      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 14 }}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.key === activeCategoryKey;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveCategoryKey(tab.key)}
                className={`h-9 px-4 rounded-full items-center justify-center border ${
                  isActive
                    ? 'bg-[#5D1C34] border-[#5D1C34] shadow-sm'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <Text
                  className={`text-[12px] font-semibold ${
                    isActive ? 'text-white font-bold' : 'text-neutral-700'
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
          <Text className="text-neutral-500 text-[13px] mb-3">
            Chưa thể tải sản phẩm. Vui lòng thử lại.
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="px-4 py-2 rounded-xl bg-[#5D1C34] items-center"
            >
              <Text className="text-white text-[12px] font-bold">Thử lại</Text>
            </Pressable>
          )}
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="mx-4 py-10 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 items-center justify-center px-4">
          <Text className="text-neutral-500 text-[13px] text-center">
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

      {/* View All Button */}
      {products.length > 0 && (
        <View className="px-4 mt-6 items-center">
          <Pressable
            onPress={onPressViewAll}
            className="flex-row items-center gap-1.5 px-6 py-2.5 rounded-full border border-neutral-300 bg-white active:bg-neutral-50 shadow-xs"
          >
            <Text className="text-neutral-800 text-[12.5px] font-bold uppercase tracking-wider">
              Xem tất cả sản phẩm
            </Text>
            <ArrowRight size={14} color="#262626" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
