import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  /** Only for computed/animated values — see AGENTS.md Styling Rules. */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numberOfLines?: number;
}

const buttonStyle = tva({
  base: 'min-h-11 flex-row items-center justify-center rounded-md',
  variants: {
    variant: {
      primary: 'bg-primary-container',
      secondary: 'bg-secondary',
      outline: 'border border-outline-variant bg-transparent',
      ghost: 'bg-transparent',
      danger: 'bg-danger',
    },
    size: {
      sm: 'px-md py-sm',
      md: 'px-xl py-md',
      lg: 'px-xxl py-lg',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
});

const buttonTextStyle = tva({
  base: 'font-bold shrink-0',
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-primary-foreground',
      outline: 'text-on-surface',
      ghost: 'text-on-surface',
      danger: 'text-primary-foreground',
    },
    size: {
      sm: 'text-body-sm',
      md: 'text-body-lg',
      lg: 'text-headline-sm',
    },
  },
});

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  textClassName,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  numberOfLines = 1,
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!isInteractive}
      className={buttonStyle({ variant, size, disabled, class: className })}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#5D1C34' : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon && <View className="mr-sm">{leftIcon}</View>}
          <Text
            numberOfLines={numberOfLines}
            className={buttonTextStyle({ variant, size, class: textClassName })}
            style={textStyle}
          >
            {title}
          </Text>
          {rightIcon && <View className="ml-sm">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
