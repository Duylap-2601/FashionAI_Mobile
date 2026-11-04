import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ToneLabel } from '@/features/orders/components/ToneLabel';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/date';
import {
  SUBSCRIPTION_TIER_LABELS,
  getSubscriptionStatusLabel,
} from '../constants/plans';
import type { SubscriptionHistoryItem } from '../types/subscription';

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

function formatHistoryDate(value?: string | null): string {
  return formatDate(value) || 'Chưa có';
}

function HistoryRow({ item, isLast }: { item: SubscriptionHistoryItem; isLast: boolean }) {
  const status = getSubscriptionStatusLabel(item.status);
  const code = item.order?.orderCode ? `#${item.order.orderCode}` : `#${String(item.id).slice(0, 8)}`;
  const amount = item.order?.amount;

  return (
    <View className={`gap-2 px-4 py-4 ${isLast ? '' : 'border-b border-landing-line/60'}`}>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-mono text-[13px] text-landing-obsidian">{code}</Text>
        {amount ? (
          <Text className="font-mono text-[13px] text-oxblood">{formatCurrency(amount)}</Text>
        ) : (
          <Text className="font-sans text-[12px] text-landing-muted">Chưa có</Text>
        )}
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Text className="font-sans text-body-md text-landing-obsidian">
          Gói {SUBSCRIPTION_TIER_LABELS[item.tier] ?? item.tier}
        </Text>
        <ToneLabel tone={status.tone} label={status.label} />
      </View>
      <Text className="font-sans text-[12px] text-landing-muted">
        Thời hạn{' '}
        <Text className="font-mono">
          {formatHistoryDate(item.startsAt)} – {formatHistoryDate(item.expiresAt)}
        </Text>
      </Text>
    </View>
  );
}

/**
 * Lịch sử mua và gia hạn gói (bảng Lịch sử thanh toán của web, xếp thành dòng cho điện thoại):
 * mã đơn và số tiền mono, gói, trạng thái chấm màu, thời hạn.
 */
export function SubscriptionHistoryList({
  history,
  isLoading,
  total,
  onBrowsePlans,
}: {
  history: SubscriptionHistoryItem[];
  isLoading: boolean;
  total?: number;
  onBrowsePlans?: () => void;
}) {
  if (isLoading) {
    return (
      <View
        accessibilityLabel="Đang tải lịch sử thanh toán"
        className="gap-2"
      >
        {[0, 1, 2].map((key) => (
          <View key={key} className="h-12 bg-taupe/30" />
        ))}
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View className="items-center rounded-subtle border border-landing-line bg-ivory/60 px-6 py-14">
        <Text className="text-center font-display text-[24px] leading-tight text-landing-obsidian">
          Chưa có giao dịch nào
        </Text>
        <Text className="mt-2 max-w-empty-state text-center font-sans text-body-sm leading-relaxed text-landing-muted">
          Các lần mua và gia hạn gói trả phí sẽ hiện ở đây.
        </Text>
        {onBrowsePlans ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem các gói"
            onPress={onBrowsePlans}
            className="mt-6 h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>Xem các gói</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text className="font-sans text-[12px] text-landing-muted">
        <Text className="font-mono text-landing-obsidian">{total ?? history.length}</Text> giao dịch
      </Text>
      <View className="rounded-subtle border border-landing-line bg-ivory">
        {history.map((item, index) => (
          <HistoryRow key={item.id} item={item} isLast={index === history.length - 1} />
        ))}
      </View>
    </View>
  );
}
