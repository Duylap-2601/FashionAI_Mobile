import React from 'react';
import { ScrollView, View } from 'react-native';

// Mirrors FE ProductDetailStates › ProductDetailSkeleton: a taupe 3:4 plate, then the ivory purchase panel.
export function ProductDetailSkeleton() {
  return (
    <ScrollView
      accessibilityLabel="Đang tải chi tiết sản phẩm"
      className="flex-1 bg-landing-paper"
      contentContainerClassName="gap-lg px-lg pb-28 pt-lg"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="aspect-[3/4] w-full bg-landing-taupe/45" />
      <View className="gap-5 border border-landing-line bg-landing-ivory p-5">
        <View className="h-3 w-32 bg-landing-taupe/45" />
        <View className="h-10 w-3/4 bg-landing-taupe/45" />
        <View className="h-7 w-36 bg-landing-taupe/45" />
        <View className="my-2 h-px w-full bg-landing-line" />
        <View className="flex-row gap-1.5">
          <View className="h-11 w-16 bg-landing-taupe/45" />
          <View className="h-11 w-16 bg-landing-taupe/45" />
          <View className="h-11 w-16 bg-landing-taupe/45" />
        </View>
        <View className="h-12 w-full bg-landing-taupe/45" />
      </View>
    </ScrollView>
  );
}
