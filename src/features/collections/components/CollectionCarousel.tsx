import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  View,
} from 'react-native';
import { COLORS } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCard } from './CollectionCard';

interface CollectionCarouselProps {
  collections: Collection[];
  isFetchingNextPage?: boolean;
  onEndReached?: () => void;
  onPressCollection: (slug: string) => void;
}

export function CollectionCarousel({
  collections,
  isFetchingNextPage = false,
  onEndReached,
  onPressCollection,
}: CollectionCarouselProps) {
  const renderCollection = useCallback<ListRenderItem<Collection>>(
    ({ item }) => (
      <CollectionCard collection={item} onPress={onPressCollection} />
    ),
    [onPressCollection],
  );

  return (
    <FlatList
      data={collections}
      horizontal
      keyExtractor={(collection) => collection.id}
      renderItem={renderCollection}
      contentContainerClassName="gap-lg px-lg"
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="w-14 items-center justify-center">
            <ActivityIndicator color={COLORS.primaryContainer} />
          </View>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
    />
  );
}
