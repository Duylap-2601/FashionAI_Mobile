import React from 'react';
import { View, Text } from 'react-native';

export const StylistScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center bg-background p-xl">
      <View className="items-center rounded-xl border border-surface-line bg-surface-lowest p-xxxl shadow-md">
        <Text className="mb-lg text-icon-giant">✨</Text>
        <Text className="mb-sm text-xxl font-extrabold text-on-surface">AI Stylist</Text>
        <Text className="text-center text-body-sm leading-relaxed text-on-surface-variant">
          Trợ lý phong cách thông minh giúp bạn chọn trang phục phù hợp với vóc dáng, màu da và
          các dịp sự kiện đặc biệt.
        </Text>
      </View>
    </View>
  );
};
