import React from 'react';
import { View, Text } from 'react-native';

export const ShopScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center bg-background p-xl">
      <View className="items-center rounded-xl border border-surface-line bg-surface-lowest p-xxxl shadow-md">
        <Text className="mb-lg text-icon-giant">🛍️</Text>
        <Text className="mb-sm text-xxl font-extrabold text-on-surface">
          Cửa Hàng Thời Trang
        </Text>
        <Text className="text-center text-body-sm leading-relaxed text-on-surface-variant">
          Khám phá các bộ sưu tập và sản phẩm thời trang thiết kế mới nhất. Tích hợp thử đồ ảo
          ngay trên từng sản phẩm.
        </Text>
      </View>
    </View>
  );
};
