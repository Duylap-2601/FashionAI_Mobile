import React from 'react';
import { Text, View } from 'react-native';

export type StatusTone = 'attention' | 'active' | 'done' | 'closed' | 'error';

export const STATUS_TONE_CLASSES: Record<StatusTone, { dot: string; text: string }> = {
  attention: { dot: 'bg-brass', text: 'text-brass-ink' },
  active: { dot: 'bg-oxblood', text: 'text-landing-obsidian' },
  done: { dot: 'bg-sage', text: 'text-sage-ink' },
  closed: { dot: 'bg-taupe', text: 'text-landing-muted' },
  error: { dot: 'bg-danger', text: 'text-danger' },
};

/** Chấm màu + nhãn in hoa, cùng kiểu nhãn trạng thái ở chi tiết đơn. */
export function ToneLabel({ tone, label }: { tone: StatusTone; label: string }) {
  const classes = STATUS_TONE_CLASSES[tone];
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-1.5 w-1.5 shrink-0 ${classes.dot}`} />
      <Text className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${classes.text}`}>
        {label}
      </Text>
    </View>
  );
}
