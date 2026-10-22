import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react-native';
import type { Collection } from '@/features/collections/types/collection';

interface HomeHeroBannerProps {
  collections: Collection[];
  onPressCollection: (slug: string) => void;
  onPressTryOn: () => void;
}

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=85';

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
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [collections.length, handleNext]);

  if (!activeCollection) return null;

  const coverImages = activeCollection.coverImages || [];
  const heroImage =
    coverImages[1] || coverImages[0] || FALLBACK_BANNER;

  const cardHeight = Math.min(width * 1.25, 480);

  return (
    <View className="w-full bg-[#0e161c] pt-4 pb-6 px-4">
      {/* Editorial Main Hero Panel */}
      <View
        style={{ height: cardHeight }}
        className="w-full rounded-3xl overflow-hidden relative shadow-2xl justify-end p-5"
      >
        <Image
          source={{ uri: heroImage }}
          contentFit="cover"
          transition={300}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Dark Gradient Overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          }}
        />

        {/* Hero Overlay Content */}
        <View className="relative z-10 items-center">
          {/* Season Pill Badge */}
          <View className="px-3.5 py-1 rounded-full bg-white/95 border border-white/60 mb-3 shadow-sm">
            <Text className="text-[#5D1C34] text-[11px] font-bold tracking-widest uppercase">
              {activeCollection.season || 'BỘ SƯU TẬP 2026'}
            </Text>
          </View>

          {/* Collection Name */}
          <Text
            numberOfLines={2}
            className="text-white text-[26px] font-extrabold text-center tracking-tight leading-tight mb-2"
          >
            {activeCollection.name}
          </Text>

          {/* Tagline / Description */}
          {activeCollection.description ? (
            <Text
              numberOfLines={2}
              className="text-white/85 text-[13px] font-light italic text-center mb-5 px-3"
            >
              “{activeCollection.description}”
            </Text>
          ) : null}

          {/* CTAs */}
          <View className="flex-row items-center justify-center gap-3 w-full">
            <Pressable
              onPress={() => onPressCollection(activeCollection.slug)}
              className="h-11 px-5 rounded-full bg-white flex-row items-center justify-center gap-2 shadow-lg active:opacity-90"
            >
              <Text className="text-neutral-900 font-bold text-[13px]">
                Khám phá BST
              </Text>
              <ArrowRight size={15} color="#171717" />
            </Pressable>

            <Pressable
              onPress={onPressTryOn}
              className="h-11 px-5 rounded-full bg-[#5D1C34] border border-white/20 flex-row items-center justify-center gap-1.5 shadow-lg active:opacity-90"
            >
              <Text className="text-white font-bold text-[13px]">
                Thử đồ AI
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Pagination Controls */}
      {collections.length > 1 && (
        <View className="flex-row items-center justify-between mt-4 px-2">
          <Pressable
            onPress={handlePrev}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
            accessibilityLabel="Bộ sưu tập trước"
          >
            <ChevronLeft size={18} color="#FFFFFF" />
          </Pressable>

          {/* Dots Indicator */}
          <View className="flex-row items-center gap-2">
            {collections.map((col, idx) => (
              <Pressable
                key={col.id}
                onPress={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === idx ? 'w-6 bg-[#C5A880]' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
            accessibilityLabel="Bộ sưu tập tiếp theo"
          >
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
