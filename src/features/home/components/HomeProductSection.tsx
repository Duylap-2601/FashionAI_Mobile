import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { SPACING } from '@/constants/theme';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import { LandingSectionHeading } from './LandingSectionHeading';
import type { IProduct } from '@/features/products/types/product';

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

const CATEGORY_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'BLAZER', label: 'Áo Blazer & Vest', keywords: ['blazer', 'vest', 'suit'] },
  { key: 'DRESS', label: 'Váy & Đầm', keywords: ['đầm', 'váy', 'dress', 'skirt'] },
  { key: 'PANTS', label: 'Quần tây', keywords: ['quần', 'pant', 'trouser'] },
  { key: 'SHIRT', label: 'Áo sơ mi', keywords: ['sơ mi', 'shirt'] },
];

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-6 px-lg pb-1"
          className="mt-8 mb-6 border-b border-landing-line/50"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.key === activeCategoryKey;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveCategoryKey(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                className={`min-h-11 justify-center pb-2.5 ${
                  isActive ? 'border-b-2 border-landing-oxblood' : ''
                }`}
              >
                <Text
                  className={`font-sans text-[11px] uppercase tracking-[0.16em] ${
                    isActive
                      ? 'font-bold text-landing-oxblood'
                      : 'font-normal text-landing-muted'
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
        <View className="mx-lg mt-6 items-center justify-center rounded-subtle border border-landing-line/60 bg-landing-paper p-8">
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
