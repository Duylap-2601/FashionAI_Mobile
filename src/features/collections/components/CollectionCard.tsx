import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

// Keep an explicit width independent of horizontal FlatList measurement (P5/P9).
// Mirrors w-collection-card; the deployed mobile card is 280px wide.
const CARD_WIDTH = 280;

interface CollectionCardProps {
  collection: Collection;
  isSelected?: boolean;
  onPress: (slug: string) => void;
}

export function CollectionCard({ collection, isSelected, onPress }: CollectionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bộ sưu tập ${collection.name}`}
      onPress={() => onPress(collection.slug)}
      className={`aspect-[3/4] w-collection-card overflow-hidden rounded-catalog-gallery border ${
        isSelected ? 'border-2 border-[#5D1C34]' : 'border-catalog-line'
      } bg-editorial-background active:opacity-80`}
    >
      <CollectionCover
        imageUrl={collection.coverImages[0] ?? null}
        name={collection.name}
        width={CARD_WIDTH - 2}
        height={(CARD_WIDTH - 2) / 0.75}
      />
      <View className="flex-1 justify-between p-lg">
        <View className="flex-row items-center justify-between">
          <View className="self-start rounded-full border border-surface-lowest/20 bg-surface-lowest/20 px-md py-xs">
            <Text className="font-sans text-2xs font-bold uppercase tracking-wide text-on-primary">
              MAY ĐO
            </Text>
          </View>
          {isSelected && (
            <View className="rounded-full bg-[#C5A880] px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-[#1A1A24]">
                Đang chọn
              </Text>
            </View>
          )}
        </View>
        <View className="gap-sm">
          <Text
            numberOfLines={2}
            className="font-sans text-headline-md font-bold text-on-primary"
          >
            {collection.name}
          </Text>
          {collection.description ? (
            <Text
              numberOfLines={2}
              className="font-sans text-body-sm text-on-primary/80"
            >
              {collection.description}
            </Text>
          ) : null}
          <View className="mt-sm flex-row items-center justify-between gap-sm border-t border-surface-lowest/20 pt-sm">
            <Text className="font-sans text-label-md tabular-nums text-on-primary/70">
              {collection.productCount.toLocaleString('vi-VN')} thiết kế
            </Text>
            <View className="min-h-11 flex-row items-center gap-xs rounded-full bg-surface-lowest px-md">
              <Text className="font-sans text-label-md uppercase tracking-wide text-on-surface-strong">
                Xem ngay
              </Text>
              <ArrowUpRight size={14} color={COLORS.onSurfaceStrong} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
