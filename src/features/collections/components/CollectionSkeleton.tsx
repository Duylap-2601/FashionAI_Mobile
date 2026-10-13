import React from 'react';
import { View } from 'react-native';

export function CollectionSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải bộ sưu tập"
      className="gap-lg bg-surface-lowest p-lg"
    >
      <View className="aspect-[3/4] w-full rounded-catalog-gallery bg-catalog-muted" />
      <View className="h-7 w-2/3 rounded-sm bg-catalog-line" />
      <View className="h-4 w-full rounded-sm bg-catalog-line" />
      <View className="h-4 w-3/4 rounded-sm bg-catalog-line" />
    </View>
  );
}
