import React from 'react';
import { View } from 'react-native';

// Paper and taupe skeleton (FE States › Loading), square blocks.
export function CollectionSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải bộ sưu tập"
      className="gap-lg bg-landing-paper p-lg"
    >
      <View className="aspect-[3/4] w-full bg-taupe/40" />
      <View className="h-7 w-2/3 bg-taupe/40" />
      <View className="h-4 w-full bg-taupe/30" />
      <View className="h-4 w-3/4 bg-taupe/30" />
    </View>
  );
}
