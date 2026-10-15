import React from 'react';
import { ScrollView, View } from 'react-native';

export function ProductDetailSkeleton() {
  return (
    <ScrollView
      accessibilityLabel="Đang tải chi tiết sản phẩm"
      contentContainerClassName="bg-surface-lowest px-lg pb-28 pt-lg"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="aspect-[3/4] w-full rounded-catalog-gallery bg-catalog-muted" />
      <View className="gap-md pt-lg">
        <View className="rounded-sm bg-catalog-line h-3 w-1/3" />
        <View className="rounded-sm bg-catalog-line h-7 w-full" />
        <View className="rounded-sm bg-catalog-line h-7 w-2/3" />
        <View className="rounded-sm bg-catalog-line h-4 w-1/2" />
        <View className="rounded-sm bg-catalog-line h-6 w-1/2" />
        <View className="h-px bg-catalog-line" />
        <View className="rounded-sm bg-catalog-line h-4 w-1/3" />
        <View className="flex-row gap-sm">
          <View className="h-11 w-20 rounded-full bg-catalog-line" />
          <View className="h-11 w-20 rounded-full bg-catalog-line" />
          <View className="h-11 w-20 rounded-full bg-catalog-line" />
        </View>
        <View className="rounded-sm bg-catalog-line h-4 w-full" />
        <View className="rounded-sm bg-catalog-line h-4 w-3/4" />
      </View>
    </ScrollView>
  );
}
