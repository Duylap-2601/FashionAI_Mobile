import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '@/navigation/types';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

// Khối intro + lượt dùng + lịch sử DÙNG CHUNG cho cả 2 mode,
// luôn đứng trước toggle trong cả 2 nhánh.
export const TryOnSharedIntro: React.FC<{
  quota: { remaining?: number; limit?: number } | null;
}> = ({ quota }) => {
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<TryOnStackParamList>>();
  return (
    <View>
      <Text className="font-heading text-headline-lg font-bold text-primary-container">
        Virtual Try-On
      </Text>
      <Text className="mt-xs text-body-sm text-on-surface-variant">
        Thử trang phục công sở bằng công nghệ AI
      </Text>
      <View className="mt-md flex-row items-center justify-between">
        {typeof quota?.remaining === 'number' && typeof quota?.limit === 'number' ? (
          <View className="rounded-full border border-outline-variant bg-surface-lowest px-md py-xs">
            <Text className="text-body-sm font-semibold text-primary-container">
              Còn {quota.remaining} / {quota.limit} lượt hôm nay
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          className="min-h-11 justify-center px-sm"
          onPress={() => stackNavigation.navigate('TryOnHistory')}
        >
          <Text className="text-label-lg text-primary-container">Lịch sử thử đồ ›</Text>
        </Pressable>
      </View>
    </View>
  );
};

// Toggle chuyển mode dùng chung: chỉ quyết định content bên dưới nó.
export const TryOnModeToggle: React.FC<{
  value: 'photo' | 'live';
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <View className="mt-lg">
    <SegmentedControl
      options={[
        { value: 'photo', label: 'Thử bằng ảnh' },
        { value: 'live', label: 'Live Try-on' },
      ]}
      value={value}
      onChange={onChange}
    />
  </View>
);
