import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

interface CollectionHeroCardProps {
  collection: Collection;
  onPress: (slug: string) => void;
  onTryOnPress: () => void;
}

export function CollectionHeroCard({
  collection,
  onPress,
  onTryOnPress,
}: CollectionHeroCardProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(1, width - SPACING.lg * 2);
  const imageUrl =
    collection.coverImages[1] ?? collection.coverImages[0] ?? null;

  return (
    <View className="h-collection-hero overflow-hidden rounded-catalog-gallery bg-editorial-background">
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
          className="min-h-11 items-center gap-md active:opacity-80"
        >
          <View className="rounded-full border border-surface-lowest/60 bg-surface-lowest/90 px-md py-xs">
            <Text className="font-sans text-label-md uppercase tracking-widest text-primary-container">
              BỘ SƯU TẬP MAY ĐO
            </Text>
          </View>
          <Text
            numberOfLines={2}
            className="text-center font-sans text-headline-lg font-bold text-on-primary"
          >
            {collection.name}
          </Text>
          {collection.description ? (
            <Text
              numberOfLines={2}
              className="text-center font-sans text-body-md italic text-on-primary/85"
            >
              “{collection.description}”
            </Text>
          ) : null}
        </Pressable>
        <View className="flex-row flex-wrap items-center justify-center gap-md">
          <Button
            title="Khám phá BST"
            variant="outline"
            size="sm"
            onPress={() => onPress(collection.slug)}
            className="!rounded-full !border-surface-lowest !bg-surface-lowest px-xl"
            textClassName="font-sans text-on-surface-strong"
            rightIcon={<ArrowRight size={16} color={COLORS.onSurfaceStrong} />}
          />
          <Button
            title="Thử đồ AI"
            size="sm"
            onPress={onTryOnPress}
            className="!rounded-full border border-surface-lowest/10 px-xl"
            textClassName="font-sans !text-on-primary"
          />
        </View>
      </View>
    </View>
  );
}
