import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessageSquare, MessageSquarePlus, Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface ReviewEmptyStateProps {
  title: string;
  description: string;
  /** Biểu tượng tin nhắn thay cho ngôi sao (danh sách của chính người dùng). */
  personal?: boolean;
  /** `none` bỏ biểu tượng, như AccountStatePanel của FE. */
  icon?: 'star' | 'message' | 'none';
  tone?: 'default' | 'error';
  actionLabel?: string;
  actionVariant?: 'primary' | 'outline';
  /** Hiện biểu tượng viết đánh giá trước nhãn hành động (nút "Viết đánh giá" của FE). */
  actionIcon?: boolean;
  onAction?: () => void;
}

/**
 * Khối trạng thái rỗng / lỗi theo FE ReviewSection và AccountStatePanel: khung ivory viền mảnh,
 * tiêu đề serif, một câu giải thích và tối đa một hành động.
 */
export function ReviewEmptyState({
  title,
  description,
  personal = false,
  icon,
  tone = 'default',
  actionLabel,
  actionVariant = 'outline',
  actionIcon = false,
  onAction,
}: ReviewEmptyStateProps) {
  const resolvedIcon = tone === 'error' ? 'none' : icon ?? (personal ? 'message' : 'star');
  const Icon = resolvedIcon === 'message' ? MessageSquare : resolvedIcon === 'star' ? Star : null;
  const isPrimary = actionVariant === 'primary';

  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      className="mx-lg items-center border border-landing-line bg-landing-ivory/60 px-6 py-14"
    >
      {Icon ? (
        <View className="mb-3">
          <Icon size={28} strokeWidth={1.5} color={COLORS.oxblood} />
        </View>
      ) : null}
      <Text
        className={`text-center font-display leading-tight ${Icon ? 'text-xl' : 'text-2xl'} ${
          tone === 'error' ? 'text-danger' : 'text-landing-obsidian'
        }`}
      >
        {title}
      </Text>
      <Text className="mt-2 text-center font-sans text-sm leading-relaxed text-landing-muted">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          className={`mt-6 h-11 flex-row items-center justify-center gap-2 rounded-subtle px-5 ${
            isPrimary ? 'bg-oxblood active:opacity-90' : 'border border-landing-line active:opacity-70'
          }`}
        >
          {actionIcon ? (
            <MessageSquarePlus
              size={14}
              strokeWidth={1.75}
              color={isPrimary ? COLORS.paper : COLORS.obsidian}
            />
          ) : null}
          <Text
            className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${
              isPrimary ? 'text-landing-paper' : 'text-landing-obsidian'
            }`}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
