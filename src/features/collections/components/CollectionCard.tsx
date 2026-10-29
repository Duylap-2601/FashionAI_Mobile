import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

// Explicit width for carousel card (280px).
const CARD_WIDTH = 280;

interface CollectionCardProps {
  collection: Collection;
  isSelected?: boolean;
  onPress: (slug: string) => void;
}

export function CollectionCard({ collection, isSelected, onPress }: CollectionCardProps) {
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bộ sưu tập ${collection.name}`}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(collection.slug)}
      className={`relative aspect-[3/4] w-collection-card overflow-hidden rounded-subtle border ${
        isSelected ? 'border-2 border-landing-oxblood' : 'border-landing-line/40'
      } bg-landing-obsidian active:opacity-90`}
    >
      <CollectionCover
        imageUrl={collection.coverImages[0] ?? null}
        name={collection.name}
        width={CARD_WIDTH - 2}
        height={(CARD_WIDTH - 2) / 0.75}
      />

      <View className="flex-1 justify-between p-5">
        {/* Top Header: Mono index and Season */}
        <View className="z-10 flex-row items-start justify-between">
          <View className="rounded-subtle bg-landing-obsidian/70 px-2 py-0.5">
            <Text className="font-mono text-[11px] font-semibold tracking-widest text-landing-paper/90">
              MAY ĐO
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className="max-w-[60%] text-right font-sans text-[10px] font-semibold uppercase tracking-wider text-landing-paper/70"
          >
            {collection.season || 'BỘ SƯU TẬP 2026'}
          </Text>
        </View>

        {/* Bottom Editorial Content */}
        <View className="z-10">
          <View className="mb-3 h-px w-10 bg-landing-brass" />

          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 20,
              lineHeight: 24,
              color: '#EFE9E1',
              fontWeight: '700',
            }}
          >
            {collection.name}
          </Text>

          {collection.description ? (
            <Text
              numberOfLines={2}
              className="mt-2 font-sans text-[11.5px] leading-relaxed text-landing-paper/70"
            >
              {collection.description}
            </Text>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between border-t border-landing-paper/15 pt-3">
            <Text className="font-mono text-[11px] text-landing-paper/60">
              {collection.productCount.toLocaleString('vi-VN')} thiết kế
            </Text>
            <View className="flex-row items-center gap-1">
              <Text
                className={`font-sans text-[10px] font-semibold uppercase tracking-wider ${
                  isSelected ? 'text-landing-brass' : 'text-landing-paper'
                }`}
              >
                {isSelected ? 'Đang xem' : 'Mở chương'}
              </Text>
              <ArrowUpRight size={12} color={isSelected ? '#A67D44' : '#EFE9E1'} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
