import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  /** Additive presentation override; leaves existing callers unchanged. */
  fieldContainerClassName?: string;
  /** Only for computed/animated values — see AGENTS.md Styling Rules. */
  containerStyle?: StyleProp<ViewStyle>;
}

const inputWrapperStyle = tva({
  base: 'mb-md',
});

// design/DESIGN.md › Input, FE authInputClassName: cao 48px, góc 2px, nền ivory, viền hairline,
// viền oxblood khi đang nhập, viền danger khi có lỗi.
const inputContainerStyle = tva({
  base: 'min-h-12 flex-row items-center rounded-subtle border border-landing-line bg-landing-ivory/80 px-3.5',
  variants: {
    focused: {
      true: 'border-oxblood',
    },
    error: {
      true: 'border-danger',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
});

// Cỡ chữ tuyệt đối thay vì token: tailwind-merge trong tva coi `text-body-md` là màu chữ.
const inputFieldStyle = tva({
  base: 'flex-1 py-sm font-sans text-[15px] text-landing-obsidian',
});

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName,
  fieldContainerClassName,
  containerStyle,
  className,
  editable,
  secureTextEntry,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPasswordField = !!secureTextEntry;

  const passwordToggle = isPasswordField ? (
    <Pressable
      onPress={() => setIsRevealed((prev) => !prev)}
      hitSlop={8}
      className="-mr-3.5 min-h-11 min-w-11 items-center justify-center active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={isRevealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      <Ionicons
        name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
        size={18}
        color={COLORS.muted}
      />
    </Pressable>
  ) : null;

  return (
    <View
      className={inputWrapperStyle({ class: containerClassName })}
      style={containerStyle}
    >
      {label && (
        <Text className="mb-sm font-sans text-label-md uppercase tracking-[0.18em] text-landing-obsidian/80">
          {label}
        </Text>
      )}
      <View
        className={inputContainerStyle({
          focused: isFocused,
          error: !!error,
          disabled: editable === false,
          class: fieldContainerClassName,
        })}
      >
        {leftIcon && (
          <View className="items-center justify-center px-xs">{leftIcon}</View>
        )}
        <TextInput
          placeholderTextColor={COLORS.muted}
          editable={editable}
          secureTextEntry={isPasswordField && !isRevealed}
          accessibilityLabel={accessibilityLabel ?? label}
          className={inputFieldStyle({ class: className })}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {rightIcon ? (
          <View className="items-center justify-center px-xs">{rightIcon}</View>
        ) : (
          passwordToggle
        )}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-xs font-sans text-body-sm text-danger"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text className="mt-xs font-sans text-body-sm text-landing-muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;
