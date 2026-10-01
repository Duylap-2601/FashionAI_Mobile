import React from 'react';
import { View, Text } from 'react-native';

export const TryOnScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center bg-background p-xl">
      <View className="items-center rounded-xl border border-surface-line bg-surface-lowest p-xxxl shadow-md">
        <Text className="mb-lg text-icon-giant">👗</Text>
        <Text className="mb-sm text-xxl font-extrabold text-on-surface">Virtual Try-On</Text>
        <Text className="text-center text-body-sm leading-relaxed text-on-surface-variant">
          Tính năng thử đồ ảo AI đang được chuẩn bị. Bạn có thể tải lên ảnh toàn thân và mẫu đồ để
          xem kết quả mặc thử chân thực.
        </Text>
      </View>
    </View>
  );
};
