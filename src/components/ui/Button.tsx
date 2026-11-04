import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /** Nhãn hiện cạnh vòng xoay khi `loading` (vd. "Đang đăng nhập"); bỏ trống thì chỉ có vòng xoay. */
  loadingTitle?: string;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  /** Only for computed/animated values — see AGENTS.md Styling Rules. */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

type ButtonVariant = NonNullable<ButtonProps['variant']>;

// Atelier Paper (design/DESIGN.md › Button, FE accountButtonClassName): góc 2px, không đổ bóng,
// chính là nền oxblood chữ paper, phụ là viền hairline. Chiều cao tối thiểu 44px cho mọi size.
const buttonStyle = tva({
  base: 'min-h-11 flex-row items-center justify-center rounded-subtle',
  variants: {
    variant: {
      primary: 'bg-oxblood',
      secondary: 'border border-landing-line bg-landing-ivory/80',
      outline: 'border border-landing-line bg-transparent',
      ghost: 'bg-transparent',
      danger: 'border border-danger/40 bg-transparent',
    },
    size: {
      sm: 'px-md py-xs',
      md: 'px-xl py-sm',
      lg: 'min-h-12 px-xxl py-sm',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
});

// Cỡ chữ dùng giá trị tuyệt đối thay vì token `text-label-md`: tailwind-merge trong tva coi mọi
// `text-<tên lạ>` là màu chữ, nên token cỡ chữ sẽ đè mất màu (hoặc ngược lại).
const buttonTextStyle = tva({
  base: 'shrink-0 text-center font-sans font-semibold uppercase',
  variants: {
    variant: {
      primary: 'text-landing-paper',
      secondary: 'text-landing-obsidian',
      outline: 'text-landing-obsidian',
      ghost: 'text-landing-obsidian',
      danger: 'text-danger',
    },
    size: {
      sm: 'text-[10.5px] tracking-[0.14em]',
      md: 'text-[11px] tracking-[0.16em]',
      lg: 'text-[11px] tracking-[0.18em]',
    },
  },
});

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: COLORS.paper,
  secondary: COLORS.oxblood,
  outline: COLORS.oxblood,
  ghost: COLORS.oxblood,
  danger: COLORS.danger,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingTitle,
  disabled = false,
  className,
  textClassName,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  numberOfLines = 1,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isInteractive = !loading && !disabled;
  const textClass = buttonTextStyle({ variant, size, class: textClassName });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (loading && loadingTitle ? loadingTitle : title)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      className={buttonStyle({ variant, size, disabled, class: className })}
      style={style}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color={SPINNER_COLOR[variant]} />
          {loadingTitle ? (
            <Text numberOfLines={numberOfLines} className={`ml-sm ${textClass}`} style={textStyle}>
              {loadingTitle}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {leftIcon && <View className="mr-sm">{leftIcon}</View>}
          <Text numberOfLines={numberOfLines} className={textClass} style={textStyle}>
            {title}
          </Text>
          {rightIcon && <View className="ml-sm">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
