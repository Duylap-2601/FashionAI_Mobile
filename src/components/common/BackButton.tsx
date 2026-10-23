import React from 'react';
import { Pressable, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface IBackButtonProps {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
}

export const BackButton: React.FC<IBackButtonProps> = ({
  onPress,
  label = 'Hồ sơ',
  accessibilityLabel,
}) => {
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (label === 'Quay lại' ? label : `Quay lại ${label}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resolvedAccessibilityLabel}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      onPress={onPress}
      className="mb-2 flex-row items-center gap-1 self-start active:opacity-60"
    >
      <ArrowLeft size={14} color={COLORS.onSurfaceVariant} />
      <Text className="text-label-lg font-medium text-on-surface-variant">{label}</Text>
    </Pressable>
  );
};

export default BackButton;
