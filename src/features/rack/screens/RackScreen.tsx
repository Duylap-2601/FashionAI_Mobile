import React from 'react';
import { View, Text } from 'react-native';

export const RackScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center bg-background p-xl">
      <View className="items-center rounded-xl border border-surface-line bg-surface-lowest p-xxxl shadow-md">
        <Text className="mb-lg text-icon-giant">👜</Text>
        <Text className="mb-sm text-xxl font-extrabold text-on-surface">Tủ đồ</Text>
        <Text className="text-center text-body-sm leading-relaxed text-on-surface-variant">
          Nơi lưu lại những trang phục và bộ sưu tập bạn yêu thích để dễ dàng xem lại bất cứ lúc
          nào.
        </Text>
      </View>
    </View>
  );
};
