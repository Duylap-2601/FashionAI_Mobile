import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import { ToneLabel, type StatusTone } from '@/features/orders/components/ToneLabel';
import { formatOrderCode } from '../utils/payment-display';

export interface IPaymentAction {
  label: string;
  onPress: () => void;
}

const ACTION_LABEL_CLASS = 'font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em]';

/**
 * Khung kết quả thanh toán (Atelier Paper), cùng kiểu PaymentStatusCard của web: khung
 * ivory, nhãn brass, tiêu đề serif, trạng thái là chấm màu + nhãn viết hoa, mã đơn mono.
 * Dùng chung cho thành công, đang xác nhận, thất bại, hủy và cần hoàn tiền.
 */
export function PaymentStatusCard({
  title,
  description,
  orderCode,
  status,
  primary,
  secondary,
  footnote,
  isLoading = false,
  children,
}: {
  title: string;
  description: string;
  orderCode?: string | number | null;
  status?: { tone: StatusTone; label: string };
  primary?: IPaymentAction;
  secondary?: IPaymentAction;
  footnote?: IPaymentAction;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  const code = formatOrderCode(orderCode);

  return (
    <View className="w-full rounded-subtle border border-landing-line bg-ivory px-6 py-8">
      <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
        Thanh toán
      </Text>
      <Text accessibilityRole="header" className="mt-2 font-display text-[30px] leading-tight text-landing-obsidian">
        {title}
      </Text>

      {status || code || isLoading ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-1">
          {isLoading ? <ActivityIndicator size="small" color={COLORS.oxblood} /> : null}
          {status ? <ToneLabel tone={status.tone} label={status.label} /> : null}
          {code ? <Text className="font-mono text-[13px] text-landing-muted">{code}</Text> : null}
        </View>
      ) : null}

      <Text className="mt-4 font-sans text-[13.5px] leading-relaxed text-landing-muted">{description}</Text>
      {children}

      {primary || secondary || footnote ? (
        <View className="mt-8 gap-3">
          {primary ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={primary.label}
              onPress={primary.onPress}
              className="h-12 items-center justify-center rounded-subtle bg-oxblood active:opacity-90"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>{primary.label}</Text>
            </Pressable>
          ) : null}
          {secondary ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={secondary.label}
              onPress={secondary.onPress}
              className="h-12 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>{secondary.label}</Text>
            </Pressable>
          ) : null}
          {footnote ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={footnote.label}
              onPress={footnote.onPress}
              className="min-h-11 items-center justify-center px-2 active:opacity-60"
            >
              <Text className="font-sans text-xs text-landing-muted">{footnote.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
