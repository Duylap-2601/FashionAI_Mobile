import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
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

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Đã có lỗi xảy ra',
  message,
  onRetry,
  fullscreen = false,
}) => {
  return (
    <View className={containerStyle({ fullscreen })}>
      <Text className="mb-md text-icon-xl">⚠️</Text>
      <Text className="mb-xs text-center text-headline-sm text-on-surface">{title}</Text>
      <Text className="mb-lg max-w-error-state text-center text-body-sm text-on-surface-variant">
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          className="min-h-11 rounded-md bg-primary-container px-xl py-md"
          onPress={onRetry}
        >
          <Text className="text-body-sm font-bold text-on-primary">Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorView;
