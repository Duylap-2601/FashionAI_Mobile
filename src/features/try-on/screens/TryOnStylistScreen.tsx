import React from 'react';
import { View } from 'react-native';
import { StylistScreen } from '@/features/stylist/screens/StylistScreen';
import { TryOnHeader } from '@/features/try-on/components/TryOnHeader';

// Màn Stylist trong shell Thử đồ dùng chung (Dev 2 sẽ thay placeholder bằng AI Stylist thật).
export const TryOnStylistScreen: React.FC = () => (
  <View className="flex-1 bg-background">
    <TryOnHeader />
    <View className="flex-1">
      <StylistScreen />
    </View>
  </View>
);

export default TryOnStylistScreen;
