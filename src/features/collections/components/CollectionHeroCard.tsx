import React from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

interface CollectionHeroCardProps {
  collection: Collection;
  onPress: (slug: string) => void;
  onTryOnPress: () => void;
}

// Editorial hero plate; CTAs follow FE HeroBanner (paper fill + paper outline on obsidian).
export function CollectionHeroCard({
  collection,
  onPress,
  onTryOnPress,
}: CollectionHeroCardProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(1, width - SPACING.lg * 2);
  const imageUrl =
    collection.coverImages[1] ?? collection.coverImages[0] ?? null;
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="h-collection-hero overflow-hidden rounded-subtle bg-landing-obsidian">
      <CollectionCover
        imageUrl={imageUrl}
        name={collection.name}
        width={imageWidth}
        height={440}
        alignTop
      />
      <View className="flex-1 justify-end gap-xxl p-xl">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Khám phá bộ sưu tập ${collection.name}`}
          onPress={() => onPress(collection.slug)}
          className="min-h-11 gap-md active:opacity-80"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-px w-10 bg-landing-brass" />
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-landing-brass">
              Bộ sưu tập may đo
            </Text>
          </View>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 30,
              lineHeight: 34,
              color: COLORS.paper,
            }}
          >
            {collection.name}
          </Text>
          {collection.description ? (
            <Text
              numberOfLines={2}
              className="font-sans text-sm leading-relaxed text-landing-paper/65"
            >
              {collection.description}
            </Text>
          ) : null}
        </Pressable>
        <View className="gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => onPress(collection.slug)}
            className="h-12 flex-row items-center justify-center gap-3 rounded-subtle border border-landing-paper bg-landing-paper px-6 active:opacity-80"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
              Khám phá bộ sưu tập
            </Text>
            <ArrowUpRight size={14} color={COLORS.obsidian} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onTryOnPress}
            className="h-12 items-center justify-center rounded-subtle border border-landing-paper/35 px-6 active:opacity-70"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
              Thử đồ AI
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
