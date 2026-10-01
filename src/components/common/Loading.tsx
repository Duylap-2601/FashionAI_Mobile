import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullscreen?: boolean;
}

const containerStyle = tva({
  base: 'items-center justify-center p-xl',
  variants: {
    fullscreen: {
      true: 'flex-1 bg-surface',
    },
  },
});

export const Loading: React.FC<LoadingProps> = ({
  message = 'Đang tải...',
  size = 'large',
  fullscreen = false,
}) => {
  return (
    <View className={containerStyle({ fullscreen })}>
      <ActivityIndicator size={size} color="#5D1C34" />
      {message ? (
        <Text className="mt-md text-center text-body-sm text-on-surface-variant">
          {message}
        </Text>
      ) : null}
    </View>
  );
};

export default Loading;
