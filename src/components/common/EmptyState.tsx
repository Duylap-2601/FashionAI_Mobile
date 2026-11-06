import React from 'react';
import { View, Text } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  /** Ký hiệu trang trí nhỏ phía trên tiêu đề (vd. "◇"). Bỏ trống thì không hiện. */
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  fullscreen?: boolean;
}

const containerStyle = tva({
  base: 'px-lg py-xl',
  variants: {
    fullscreen: {
      true: 'flex-1 justify-center bg-landing-paper',
    },
  },
});

// Khối trạng thái rỗng giống AccountStatePanel của FE: khung ivory viền hairline, tiêu đề
// Playfair, một câu giải thích muted và tối đa một hành động.
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  fullscreen = false,
}) => {
  return (
    <View className={containerStyle({ fullscreen })}>
      <View className="w-full items-center rounded-subtle border border-landing-line bg-landing-ivory/60 px-xxl py-giant">
        {icon ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            className="mb-md text-center font-display text-[28px] leading-tight text-brass-ink"
          >
            {icon}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          className="text-center font-display text-[24px] leading-tight text-landing-obsidian"
        >
          {title}
        </Text>
        {description ? (
          <Text className="mt-sm max-w-empty-state text-center font-sans text-body-md leading-relaxed text-landing-muted">
            {description}
          </Text>
        ) : null}
        {actionTitle && onAction ? (
          <Button title={actionTitle} onPress={onAction} className="mt-xxl" />
        ) : null}
      </View>
    </View>
  );
};

export default EmptyState;
