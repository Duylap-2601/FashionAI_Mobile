import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react-native";
import { CollectionCover } from "@/features/collections/components/CollectionCover";
import { COLORS, SPACING } from "@/constants/theme";
import type { Collection } from "@/features/collections/types/collection";

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
    setActiveIndex(
      (prev) => (prev - 1 + collections.length) % collections.length,
    );
  }, [collections.length]);
  useEffect(() => {
    if (collections.length <= 1) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [collections.length, handleNext]);
  if (!activeCollection) return null;
  const heroImage =
    activeCollection.coverImages[1] || activeCollection.coverImages[0] || null;

  return (
    <View className="w-full bg-editorial-background px-lg pb-12 pt-xxxl">
      <View className="relative h-collection-hero w-full justify-end overflow-hidden rounded-catalog-gallery p-xl">
        <CollectionCover
          imageUrl={heroImage}
          name={activeCollection.name}
          width={width - SPACING.lg * 2}
          height={440}
          alignTop
        />
        <View className="items-center gap-lg">
          <View className="rounded-full border border-on-primary/60 bg-surface-lowest/90 px-md py-xs">
            <Text className="font-sans text-label-md font-bold uppercase tracking-widest text-primary-container">
              {activeCollection.season || "Bộ sưu tập may đo"}
            </Text>
          </View>
          <Text
            numberOfLines={2}
            className="text-center font-sans text-headline-lg font-bold text-on-primary"
          >
            {activeCollection.name}
          </Text>
          {activeCollection.description ? (
            <Text
              numberOfLines={2}
              className="text-center font-sans text-body-md italic leading-relaxed text-on-primary/85"
            >
              “{activeCollection.description}”
            </Text>
          ) : null}
          <View className="w-full flex-row flex-wrap items-center justify-center gap-md">
            <Pressable
              accessibilityRole="button"
              onPress={() => onPressCollection(activeCollection.slug)}
              className="min-h-11 flex-row items-center justify-center gap-sm rounded-full bg-surface-lowest px-xl py-sm active:opacity-80"
            >
              <Text className="font-sans text-label-lg font-semibold text-on-surface-strong">
                Khám phá BST
              </Text>
              <ArrowRight size={16} color={COLORS.onSurfaceStrong} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onPressTryOn}
              className="min-h-11 items-center justify-center rounded-full border border-on-primary/10 bg-primary-container px-xl py-sm active:opacity-80"
            >
              <Text className="font-sans text-label-lg font-semibold text-on-primary">
                Thử đồ AI
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      {collections.length > 1 ? (
        <View className="mt-xxxl flex-row items-center justify-between gap-sm">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bộ sưu tập trước"
            onPress={handlePrev}
            className="min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-lowest/10 active:bg-surface-lowest/20"
          >
            <ChevronLeft size={20} color={COLORS.onPrimary} />
          </Pressable>
          <View className="flex-1 flex-row flex-wrap justify-center">
            {collections.map((collection, index) => (
              <Pressable
                key={collection.id}
                accessibilityRole="button"
                accessibilityLabel={`Hiển thị ${collection.name}`}
                accessibilityState={{ selected: activeIndex === index }}
                onPress={() => setActiveIndex(index)}
                className="min-h-11 min-w-11 items-center justify-center"
              >
                <View
                  className={
                    activeIndex === index
                      ? "h-2.5 w-8 rounded-full bg-tertiary-fixed"
                      : "h-2.5 w-2.5 rounded-full bg-surface-lowest/30"
                  }
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bộ sưu tập tiếp theo"
            onPress={handleNext}
            className="min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-lowest/10 active:bg-surface-lowest/20"
          >
            <ChevronRight size={20} color={COLORS.onPrimary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
