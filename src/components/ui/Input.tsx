import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  /** Only for computed/animated values — see AGENTS.md Styling Rules. */
  containerStyle?: StyleProp<ViewStyle>;
}

const inputWrapperStyle = tva({
  base: 'mb-md',
});

const inputContainerStyle = tva({
  base: 'min-h-11 flex-row items-center rounded-md border border-surface-line bg-surface-low px-md',
  variants: {
    error: {
      true: 'border-danger bg-danger-soft',
    },
    disabled: {
      true: 'opacity-60',
    },
  },
});

const inputFieldStyle = tva({
  base: 'flex-1 py-md text-body-lg text-on-surface',
});

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName,
  containerStyle,
  className,
  editable,
  secureTextEntry,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const isPasswordField = !!secureTextEntry;

  const passwordToggle = isPasswordField ? (
    <Pressable
      onPress={() => setIsRevealed((prev) => !prev)}
      hitSlop={8}
      className="min-h-11 min-w-11 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={isRevealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      <Ionicons name={isRevealed ? 'eye-off-outline' : 'eye-outline'} size={20} color="#857276" />
    </Pressable>
  ) : null;

  return (
    <View className={inputWrapperStyle({ class: containerClassName })} style={containerStyle}>
      {label && <Text className="mb-xs text-label-lg text-on-surface">{label}</Text>}
      <View
        className={inputContainerStyle({ error: !!error, disabled: editable === false })}
      >
        {leftIcon && <View className="items-center justify-center px-xs">{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#857276"
          editable={editable}
          secureTextEntry={isPasswordField && !isRevealed}
          className={inputFieldStyle({ class: className })}
          {...props}
        />
        {rightIcon ? (
          <View className="items-center justify-center px-xs">{rightIcon}</View>
        ) : (
          passwordToggle
        )}
      </View>
      {error ? (
        <Text className="mt-xs text-body-sm text-danger">{error}</Text>
      ) : helperText ? (
        <Text className="mt-xs text-body-sm text-on-surface-variant">{helperText}</Text>
      ) : null}
    </View>
  );
};

export default Input;
