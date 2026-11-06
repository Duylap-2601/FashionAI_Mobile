import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface StylistStatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** `primary`: nút đỏ đô (hành động chính); `outline`: nút viền mảnh (thử lại). */
  actionVariant?: 'primary' | 'outline';
  /** Chiếm cả màn hình (nền giấy) thay vì nằm trong danh sách. */
  fullscreen?: boolean;
}

const ACTION_LABEL = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

/**
 * Khung trạng thái trống / lỗi của AI Stylist (Atelier Paper, như AccountStatePanel của web):
 * khung ivory viền mảnh, ô icon vuông, tiêu đề serif, mô tả muted và một nút 44px.
 * Thay cho ErrorView / EmptyState dùng chung vốn còn icon emoji và bảng màu cũ.
 */
export function StylistStatePanel({
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'outline',
  fullscreen = false,
}: StylistStatePanelProps) {
  const panel = (
    <View className="items-center gap-5 rounded-subtle border border-landing-line bg-ivory px-6 py-12">
      <View className="h-16 w-16 items-center justify-center border border-landing-line">
        <Sparkles size={24} strokeWidth={1.5} color={COLORS.oxblood} />
      </View>
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="text-center font-display text-[20px] leading-tight text-landing-obsidian"
        >
          {title}
        </Text>
        {description ? (
          <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className={`h-11 items-center justify-center rounded-subtle px-5 ${
            actionVariant === 'primary'
              ? 'bg-oxblood active:opacity-90'
              : 'border border-landing-line active:opacity-70'
          }`}
        >
          <Text
            className={`${ACTION_LABEL} ${
              actionVariant === 'primary' ? 'text-landing-paper' : 'text-landing-obsidian'
            }`}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!fullscreen) return panel;

  return <View className="flex-1 justify-center bg-landing-paper p-lg">{panel}</View>;
}

export default StylistStatePanel;
