import React from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

interface CollectionDetailHeaderProps {
  collection: Collection;
  productTotal: number;
}

// Collection plate in the FE panel language (obsidian plate, brass rule, serif
// name), then the description and a mono results header like FE /products.
export function CollectionDetailHeader({
  collection,
  productTotal,
}: CollectionDetailHeaderProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(1, width - SPACING.lg * 2);
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';
  const countLabel =
    productTotal > 0
      ? `${productTotal.toLocaleString('vi-VN')} thiết kế`
      : 'Tuyển chọn';

  return (
    <View className="gap-xxxl px-lg pb-xxl pt-lg">
      <View className="aspect-[3/4] w-full overflow-hidden rounded-subtle bg-landing-obsidian">
        <CollectionCover
          imageUrl={collection.coverImages[0] ?? null}
          name={collection.name}
          width={imageWidth}
          height={imageWidth / 0.75}
          alignTop
        />
        <View className="flex-1 justify-between p-xl">
          <View className="z-10 flex-row items-start justify-between gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-px w-10 bg-landing-brass" />
              <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-landing-brass">
                Bộ sưu tập may đo
              </Text>
            </View>
            {collection.season ? (
              <Text
                numberOfLines={2}
                className="max-w-[45%] text-right font-sans text-[9px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-landing-paper/60"
              >
                {collection.season}
              </Text>
            ) : null}
          </View>

          <View className="z-10">
            <Text
              accessibilityRole="header"
              selectable
              style={{
                fontFamily: fontFamilyDisplay,
                fontSize: 32,
                lineHeight: 36,
                color: COLORS.paper,
              }}
            >
              {collection.name}
            </Text>
            <View className="mt-5 border-t border-landing-paper/15 pt-3">
              <Text className="font-sans text-[10px] uppercase tracking-[0.16em] text-landing-paper/60">
                {countLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {collection.description ? (
        <View className="gap-md">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
            Về bộ sưu tập
          </Text>
          <Text
            selectable
            className="font-sans text-[15px] leading-relaxed text-landing-muted"
          >
            {collection.description}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-baseline justify-between border-b border-landing-line pb-4">
        <Text className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted">
          <Text className="text-landing-obsidian">
            {productTotal.toLocaleString('vi-VN')}
          </Text>{' '}
          sản phẩm
        </Text>
      </View>
    </View>
  );
}
