import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Only for computed/animated values — see AGENTS.md Styling Rules. */
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

const cardStyle = tva({
  base: 'rounded-lg bg-surface-lowest p-lg',
  variants: {
    variant: {
      elevated: 'border border-surface-line shadow-sm',
      outlined: 'border border-surface-line',
      flat: 'bg-surface-low',
    },
  },
});

export const Card: React.FC<CardProps> = ({
  children,
  className,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const resolvedClassName = cardStyle({ variant, class: className });

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={resolvedClassName}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={resolvedClassName} style={style}>
      {children}
    </View>
  );
};

export default Card;
