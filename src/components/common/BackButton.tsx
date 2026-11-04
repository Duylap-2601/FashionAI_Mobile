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
    // Liên kết quay lại kiểu FE (chữ hoa giãn chữ, màu muted). hitSlop nới vùng chạm lên 44px
    // mà không đẩy bố cục màn hình xuống.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resolvedAccessibilityLabel}
      hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
      onPress={onPress}
      className="flex-row items-center gap-sm self-start active:opacity-60"
    >
      <ArrowLeft size={16} strokeWidth={1.75} color={COLORS.muted} />
      <Text className="font-sans text-label-md uppercase tracking-[0.18em] text-landing-muted">
        {label}
      </Text>
    </Pressable>
  );
};

export default BackButton;
