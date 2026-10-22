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
  selectedCollectionId?: string | null;
  isFetchingNextPage?: boolean;
  onEndReached?: () => void;
  onPressCollection: (slug: string) => void;
  onSelectCollection?: (collection: Collection) => void;
}

export function CollectionCarousel({
  collections,
  selectedCollectionId,
  isFetchingNextPage = false,
  onEndReached,
  onPressCollection,
  onSelectCollection,
}: CollectionCarouselProps) {
  const renderCollection = useCallback<ListRenderItem<Collection>>(
    ({ item }) => (
      <CollectionCard
        collection={item}
        isSelected={selectedCollectionId === item.id}
        onPress={() => {
          if (onSelectCollection) {
            onSelectCollection(item);
          } else {
            onPressCollection(item.slug);
          }
        }}
      />
    ),
    [onPressCollection, onSelectCollection, selectedCollectionId],
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
