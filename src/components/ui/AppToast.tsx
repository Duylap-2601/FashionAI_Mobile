import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

export type AppToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastPayload {
  title: string;
  message?: string;
  type?: AppToastType;
  onPress?: () => void;
}

const TYPE_META: Record<AppToastType, { Icon: LucideIcon; color: string; rail: string }> = {
  info: { Icon: Info, color: COLORS.brassInk, rail: 'border-brass' },
  success: { Icon: CheckCircle2, color: COLORS.sageInk, rail: 'border-sage' },
  warning: { Icon: TriangleAlert, color: COLORS.brassInk, rail: 'border-brass' },
  error: { Icon: AlertCircle, color: COLORS.danger, rail: 'border-danger' },
};

/** Banner in-app cho cập nhật realtime (thay cho Alert/toast của web). */
export function AppToast({ toast, onDismiss }: { toast: ToastPayload; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const tone = toast.type ?? 'info';
  const { Icon, color, rail } = TYPE_META[tone];

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 1000 }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className={`flex-row items-start gap-3 rounded-subtle border border-landing-line border-l-2 bg-landing-paper px-3 py-2.5 ${rail}`}
      >
        <Pressable
          accessibilityRole={toast.onPress ? 'button' : undefined}
          accessibilityLabel={toast.onPress ? 'Mở nội dung thông báo' : undefined}
          disabled={!toast.onPress}
          onPress={() => {
            toast.onPress?.();
            onDismiss();
          }}
          className="min-w-0 flex-1 flex-row items-start gap-3 active:opacity-70"
        >
          <Icon size={16} strokeWidth={1.75} color={color} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text numberOfLines={2} className="font-sans text-[12.5px] font-medium text-landing-obsidian">
              {toast.title}
            </Text>
            {toast.message ? (
              <Text numberOfLines={2} className="font-sans text-[11.5px] leading-relaxed text-landing-muted">
                {toast.message}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo"
          onPress={onDismiss}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center active:opacity-60"
        >
          <X size={14} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}
