import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react-native';
import { CollectionCover } from '@/features/collections/components/CollectionCover';
import { SPACING } from '@/constants/theme';
import type { Collection } from '@/features/collections/types/collection';

interface HomeHeroBannerProps {
  collections: Collection[];
  onPressCollection: (slug: string) => void;
  onPressTryOn: () => void;
}

export function HomeHeroBanner({
  collections,
  onPressCollection,
  onPressTryOn,
}: HomeHeroBannerProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCollection = collections[activeIndex] || collections[0];

  const handleNext = useCallback(() => {
    if (collections.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % collections.length);
  }, [collections.length]);

  const handlePrev = useCallback(() => {
    if (collections.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + collections.length) % collections.length);
  }, [collections.length]);

  useEffect(() => {
    if (collections.length <= 1) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [collections.length, handleNext]);

  if (!activeCollection) return null;

  const heroImage =
    activeCollection.coverImages[1] || activeCollection.coverImages[0] || null;

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="w-full bg-landing-obsidian px-lg pb-10 pt-6">
      <View className="relative h-[480px] w-full justify-between overflow-hidden rounded-subtle border border-landing-paper/15 p-6">
        <CollectionCover
          imageUrl={heroImage}
          name={activeCollection.name}
          width={width - SPACING.lg * 2}
          height={480}
          alignTop
        />

        {/* Top Tag & Season */}
        <View className="z-10 flex-row items-center gap-2.5">
          <View className="h-px w-8 bg-landing-brass" />
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-landing-brass">
            {activeCollection.season || 'BỘ SƯU TẬP / 2026'}
          </Text>
        </View>

        {/* Center / Bottom Editorial Content */}
        <View className="z-10 gap-4">
          <View>
            <Text
              style={{
                fontFamily: fontFamilyDisplay,
                fontSize: 30,
                lineHeight: 36,
                color: '#EFE9E1',
              }}
            >
              Mặc đúng <Text style={{ fontStyle: 'italic', color: '#A67D44' }}>dáng</Text>.
            </Text>
            <Text
              style={{
                fontFamily: fontFamilyDisplay,
                fontSize: 30,
                lineHeight: 36,
                color: '#EFE9E1',
              }}
            >
              Sống đúng <Text style={{ fontStyle: 'italic', color: '#A67D44' }}>chất</Text>.
            </Text>
          </View>

          <View className="gap-1 border-l-2 border-landing-brass/60 pl-3">
            <Text
              numberOfLines={1}
              className="font-sans text-label-md font-bold uppercase tracking-wider text-landing-paper"
            >
              {activeCollection.name}
            </Text>
            {activeCollection.description ? (
              <Text
                numberOfLines={2}
                className="font-sans text-body-sm leading-relaxed text-landing-paper/75"
              >
                {activeCollection.description}
              </Text>
            ) : null}
          </View>

          {/* Action CTAs: Square / 2px corners */}
          <View className="mt-2 flex-row flex-wrap items-center gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => onPressCollection(activeCollection.slug)}
              className="min-h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-landing-paper px-5 py-2.5 active:bg-landing-brass"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Khám phá BST
              </Text>
              <ArrowUpRight size={14} color="#11100F" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onPressTryOn}
              className="min-h-11 items-center justify-center rounded-subtle border border-landing-paper/35 bg-transparent px-5 py-2.5 active:bg-landing-paper/10"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                Thử đồ AI
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Counter and Navigation Row */}
        <View className="z-10 flex-row items-center justify-between border-t border-landing-paper/15 pt-3">
          <Text className="font-mono text-[11px] tracking-[0.18em] text-landing-paper/60">
            {String(activeIndex + 1).padStart(2, '0')} / {String(collections.length).padStart(2, '0')}
          </Text>

          {collections.length > 1 && (
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bộ sưu tập trước"
                onPress={handlePrev}
                className="h-8 w-8 items-center justify-center rounded-subtle border border-landing-paper/20 bg-landing-obsidian/60 active:bg-landing-paper/20"
              >
                <ChevronLeft size={16} color="#EFE9E1" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bộ sưu tập tiếp theo"
                onPress={handleNext}
                className="h-8 w-8 items-center justify-center rounded-subtle border border-landing-paper/20 bg-landing-obsidian/60 active:bg-landing-paper/20"
              >
                <ChevronRight size={16} color="#EFE9E1" />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
