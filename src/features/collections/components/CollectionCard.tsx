import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

// Explicit width for carousel card (280px).
const CARD_WIDTH = 280;

interface CollectionCardProps {
  collection: Collection;
  /** Position in the carousel, shown as the mono chapter number (FE: 01, 02...). */
  index?: number;
  isSelected?: boolean;
  onPress: (slug: string) => void;
}

// Editorial panel, mirrors FE home CollectionCarousel: chapter number, season,
// serif name, tagline, item count and `Mở chương`. No price, rating or cart.
export function CollectionCard({
  collection,
  index,
  isSelected,
  onPress,
}: CollectionCardProps) {
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';
  const chapter =
    index !== undefined ? String(index + 1).padStart(2, '0') : null;
  const countLabel =
    collection.productCount > 0
      ? `${collection.productCount.toLocaleString('vi-VN')} thiết kế`
      : 'Tuyển chọn';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bộ sưu tập ${collection.name}`}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(collection.slug)}
      className="relative aspect-[3/4] w-collection-card overflow-hidden rounded-subtle border border-landing-line bg-landing-obsidian active:opacity-90"
    >
      <CollectionCover
        imageUrl={collection.coverImages[0] ?? null}
        name={collection.name}
        width={CARD_WIDTH - 2}
        height={(CARD_WIDTH - 2) / 0.75}
        alignTop
      />

      <View className="flex-1 justify-between p-5">
        {/* Top: mono chapter number and the real season (no invented fallback). */}
        <View className="z-10 flex-row items-start justify-between gap-4">
          <Text className="font-mono text-[11px] tracking-[0.18em] text-landing-paper/70">
            {chapter ?? ''}
          </Text>
          {collection.season ? (
            <Text
              numberOfLines={2}
              className="max-w-[55%] text-right font-sans text-[9px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-landing-paper/60"
            >
              {collection.season}
            </Text>
          ) : null}
        </View>

        {/* Bottom editorial content */}
        <View className="z-10">
          <View className="mb-4 h-px w-10 bg-landing-brass" />

          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 24,
              lineHeight: 26,
              color: COLORS.paper,
            }}
          >
            {collection.name}
          </Text>

          {collection.description ? (
            <Text
              numberOfLines={2}
              className="mt-3 font-sans text-xs leading-relaxed text-landing-paper/65"
            >
              {collection.description}
            </Text>
          ) : null}

          <View className="mt-5 flex-row items-center justify-between gap-3 border-t border-landing-paper/15 pt-3">
            <Text className="font-sans text-[10px] uppercase tracking-[0.16em] text-landing-paper/50">
              {countLabel}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`font-sans text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  isSelected ? 'text-landing-brass' : 'text-landing-paper'
                }`}
              >
                {isSelected ? 'Đang xem' : 'Mở chương'}
              </Text>
              <ArrowUpRight
                size={12}
                color={isSelected ? COLORS.brass : COLORS.paper}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Selected state: brass inset rule (FE), never a rounded ring. */}
      {isSelected ? (
        <View
          pointerEvents="none"
          className="absolute inset-2 border border-landing-brass"
        />
      ) : null}
    </Pressable>
  );
}
