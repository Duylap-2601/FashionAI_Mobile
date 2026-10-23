import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { ArrowUpRight, Sparkles } from "lucide-react-native";
import { CollectionCover } from "@/features/collections/components/CollectionCover";
import { COLORS, SPACING } from "@/constants/theme";
import type { Collection } from "@/features/collections/types/collection";

interface EditorialLookbookProps {
  collection?: Collection | null;
  onPressTryOn: () => void;
}

export function EditorialLookbook({
  collection,
  onPressTryOn,
}: EditorialLookbookProps) {
  const { width } = useWindowDimensions();
  const images = collection?.coverImages.slice(0, 3) ?? [];
  if (!collection || images.length === 0) return null;
  const cardWidth = width - SPACING.lg * 2;
  return (
    <View className="gap-xxxl bg-editorial-background px-lg py-14">
      <View className="items-center gap-md">
        <View className="flex-row items-center gap-xs rounded-full border border-on-primary/10 bg-surface-lowest/10 px-md py-xs">
          <Sparkles size={12} color={COLORS.tertiaryFixed} />
          <Text className="font-sans text-label-md uppercase tracking-widest text-tertiary-fixed">
            EDITORIAL CAMPAIGN
          </Text>
        </View>
        <Text className="text-center font-sans text-headline-lg font-bold uppercase text-on-primary">
          {collection.name}
        </Text>
        {collection.description ? (
          <Text
            numberOfLines={3}
            className="text-center font-sans text-body-md leading-relaxed text-on-primary/65"
          >
            {collection.description}
          </Text>
        ) : null}
      </View>
      <View className="gap-xl">
        {images.map((url, index) => (
          <View
            key={`${url}-${index}`}
            className="relative aspect-[9/14] w-full justify-end overflow-hidden rounded-catalog-gallery border border-on-primary/10 p-xxl"
          >
            <CollectionCover
              imageUrl={url}
              name={collection.name}
              width={cardWidth}
              height={(cardWidth * 14) / 9}
            />
            <View className="gap-lg">
              <Text className="font-sans text-label-md font-bold uppercase tracking-widest text-tertiary-fixed">
                LOOK {String(index + 1).padStart(2, "0")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onPressTryOn}
                className="min-h-11 flex-row items-center justify-center gap-sm self-start rounded-xl border border-on-primary/30 bg-surface-lowest/20 px-lg py-sm active:opacity-70"
              >
                <Text className="font-sans text-label-md font-bold uppercase text-on-primary">
                  Khám phá thử đồ AI
                </Text>
                <ArrowUpRight size={16} color={COLORS.onPrimary} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
