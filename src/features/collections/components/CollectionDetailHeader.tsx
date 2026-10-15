import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import type { Collection } from '../types/collection';
import { CollectionCover } from './CollectionCover';

interface CollectionDetailHeaderProps {
  collection: Collection;
  productTotal: number;
}

export function CollectionDetailHeader({
  collection,
  productTotal,
}: CollectionDetailHeaderProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(1, width - SPACING.lg * 2);

  return (
    <View className="gap-xxxl px-lg pb-xxxl pt-lg">
      <View className="aspect-[3/4] w-full overflow-hidden rounded-catalog-gallery bg-editorial-background">
        <CollectionCover
          imageUrl={collection.coverImages[0] ?? null}
          name={collection.name}
          width={imageWidth}
          height={imageWidth / 0.75}
        />
        <View className="flex-1 justify-end gap-md p-xl">
          <View className="self-start rounded-full border border-surface-lowest/20 bg-surface-lowest/20 px-md py-xs">
            <Text className="font-sans text-label-md uppercase tracking-widest text-on-primary">
              BỘ SƯU TẬP MAY ĐO
            </Text>
          </View>
          <Text
            selectable
            className="font-sans text-product-title text-on-primary"
          >
            {collection.name}
          </Text>
          <Text className="font-sans text-label-md tabular-nums text-on-primary/80">
            {productTotal.toLocaleString('vi-VN')} thiết kế
          </Text>
        </View>
      </View>
      {collection.description ? (
        <View className="gap-md">
          <Text className="font-sans text-label-md uppercase tracking-widest text-primary-container">
            BỘ SƯU TẬP ĐỘC QUYỀN
          </Text>
          <Text
            selectable
            className="font-sans text-body-md leading-relaxed text-on-surface-variant"
          >
            {collection.description}
          </Text>
        </View>
      ) : null}
      <View className="gap-sm border-t border-catalog-line pt-xxxl">
        <Text className="font-sans text-headline-lg font-bold uppercase text-primary-container">
          Thiết kế: {collection.name}
        </Text>
        <Text className="font-sans text-body-sm tabular-nums text-catalog-muted-text">
          {productTotal.toLocaleString('vi-VN')} sản phẩm
        </Text>
      </View>
    </View>
  );
}
