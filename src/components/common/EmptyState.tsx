import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  fullscreen?: boolean;
}

const containerStyle = tva({
  base: 'items-center justify-center p-xxl',
  variants: {
    fullscreen: {
      true: 'flex-1 bg-surface',
    },
  },
});

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  description,
  actionTitle,
  onAction,
  fullscreen = false,
}) => {
  return (
    <View className={containerStyle({ fullscreen })}>
      <Text className="mb-md text-icon-giant">{icon}</Text>
      <Text className="mb-xs text-center text-headline-sm text-on-surface">{title}</Text>
      {description ? (
        <Text className="mb-lg max-w-empty-state text-center text-body-sm text-on-surface-variant">
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <TouchableOpacity
          className="min-h-11 rounded-md bg-primary-container px-xl py-md"
          onPress={onAction}
        >
          <Text className="text-body-sm font-bold text-on-primary">{actionTitle}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default EmptyState;
