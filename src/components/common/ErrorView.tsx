import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';

export interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
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

// Khối lỗi giống AccountStatePanel tone="error" của FE: khung ivory viền hairline, tiêu đề
// Playfair màu danger kèm biểu tượng (không chỉ dựa vào màu), một câu giải thích và nút "Thử lại" viền.
export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Đã có lỗi xảy ra',
  message,
  onRetry,
  fullscreen = false,
}) => {
  return (
    <View className={containerStyle({ fullscreen })}>
      <View
        accessibilityRole="alert"
        className="w-full items-center rounded-subtle border border-landing-line bg-landing-ivory/60 px-xxl py-giant"
      >
        <View className="mb-md">
          <AlertCircle size={24} strokeWidth={1.5} color={COLORS.danger} />
        </View>
        <Text className="text-center font-display text-[24px] leading-tight text-danger">{title}</Text>
        <Text className="mt-sm max-w-error-state text-center font-sans text-body-md leading-relaxed text-landing-muted">
          {message}
        </Text>
        {onRetry ? (
          <Button title="Thử lại" variant="outline" onPress={onRetry} className="mt-xxl" />
        ) : null}
      </View>
    </View>
  );
};

export default ErrorView;
