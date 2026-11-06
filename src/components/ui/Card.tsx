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

// Atelier Paper (design/DESIGN.md › Layout System, FE AccountSection `panel`): khung ivory góc 2px,
// tách lớp bằng viền hairline, không đổ bóng. `elevated` giữ lại cho caller cũ, nay trùng `outlined`.
const cardStyle = tva({
  base: 'rounded-subtle bg-landing-ivory p-lg',
  variants: {
    variant: {
      elevated: 'border border-landing-line',
      outlined: 'border border-landing-line',
      flat: 'bg-landing-ivory/60',
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
        activeOpacity={0.8}
        accessibilityRole="button"
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
