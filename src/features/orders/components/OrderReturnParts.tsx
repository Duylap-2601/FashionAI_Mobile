import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';
import type { IOrderHistoryEvent, IOrderReturnsView } from '../types/order';
import {
  REFUND_KIND_LABELS,
  REFUND_STATUS,
  RETURN_FLOW_STATUSES,
  formatRefundEvidence,
  getRefundEvidenceImages,
} from '../utils/order-returns';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ToneLabel } from './ToneLabel';

// expo-image không nhận className (chưa cssInterop), nên kích thước ảnh dùng style.
const RECEIPT_STYLE = { width: 64, height: 64 } as const;

/** Ghi chú có vạch trái: brass cho việc đang chờ, sage cho việc đã xong. */
export function OrderNotice({
  tone = 'attention',
  title,
  children,
}: {
  tone?: 'attention' | 'done';
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      className={`border-l-2 bg-landing-ivory px-4 py-3 ${tone === 'done' ? 'border-landing-sage' : 'border-landing-brass'}`}
    >
      <Text
        className={`font-sans text-[13px] font-medium ${tone === 'done' ? 'text-sage-ink' : 'text-landing-obsidian'}`}
      >
        {title}
      </Text>
      {children ? <View className="mt-1.5 gap-2.5">{children}</View> : null}
    </View>
  );
}

export function NoticeText({ children }: { children: React.ReactNode }) {
  return <Text className="font-sans text-[13px] leading-relaxed text-landing-muted">{children}</Text>;
}

export function RefundAccount({ order }: { order: IOrderReturnsView }) {
  if (!order.refundAccountNumber) return null;
  return (
    <NoticeText>
      Tài khoản nhận hoàn: <Text className="text-landing-obsidian">{order.refundBankName || 'Ngân hàng'}</Text> ·{' '}
      <Text className="font-mono text-landing-obsidian">{order.refundAccountNumber}</Text>
      {order.refundAccountHolder ? (
        <Text className="text-landing-obsidian"> · {order.refundAccountHolder}</Text>
      ) : null}
    </NoticeText>
  );
}

/**
 * Các khoản shop chuyển hoàn (tiền hàng, phí ship). Chứng từ chỉ hiện khi đã có khoản
 * được hoàn; khoản đang chờ ghi rõ đang chờ hàng về hay shop đang chuyển khoản.
 */
export function OrderRefundLines({ order }: { order: IOrderReturnsView }) {
  const [zoomed, setZoomed] = useState<{ url: string; caption: string } | null>(null);
  const refunds = order.refunds ?? [];
  const hasCompletedRefund = refunds.some((refund) => refund.status === 'COMPLETED');
  const evidenceText = hasCompletedRefund ? formatRefundEvidence(order.refundEvidence) : null;
  const receiptImages = hasCompletedRefund ? getRefundEvidenceImages(order.refundEvidence) : [];
  const waitingNote = RETURN_FLOW_STATUSES.includes(order.status ?? '')
    ? 'Shop chuyển khoản sau khi nhận lại và kiểm tra hàng.'
    : 'Shop đang chuyển khoản cho bạn.';

  return (
    <View>
      {refunds.map((refund, index) => {
        const status = REFUND_STATUS[refund.status] ?? { label: refund.status, tone: 'closed' as const };
        return (
          <View
            key={refund.id}
            className={`flex-row items-start justify-between gap-4 py-3 ${
              index > 0 ? 'border-t border-landing-line/60' : ''
            }`}
          >
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-sans text-[13px] font-medium text-landing-obsidian">
                {REFUND_KIND_LABELS[refund.kind ?? 'GOODS']}
              </Text>
              <ToneLabel tone={status.tone} label={status.label} />
              {refund.status === 'FAILED' ? (
                <Text className="font-sans text-[12px] text-danger">
                  Lần chuyển trước chưa thành công, shop đang chuyển lại.
                </Text>
              ) : null}
              {refund.status === 'REQUIRED' || refund.status === 'PENDING' ? (
                <Text className="font-sans text-[12px] text-landing-muted">{waitingNote}</Text>
              ) : null}
              <Text className="font-sans text-[12px] text-landing-muted">
                Yêu cầu <Text className="font-mono">{formatDateTime(refund.requestedAt)}</Text>
                {refund.processedAt ? (
                  <>
                    {' '}· Hoàn tất <Text className="font-mono">{formatDateTime(refund.processedAt)}</Text>
                  </>
                ) : null}
              </Text>
            </View>
            <Text className="shrink-0 font-mono text-[15px] text-oxblood">{formatCurrency(refund.amountVnd)}</Text>
          </View>
        );
      })}

      {evidenceText || receiptImages.length > 0 ? (
        <View className="mt-3 gap-3 border-t border-landing-line/60 pt-4">
          {evidenceText ? (
            /^https?:\/\//i.test(evidenceText) ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Xem chứng từ hoàn tiền"
                onPress={() => void Linking.openURL(evidenceText)}
                className="h-11 justify-center self-start active:opacity-60"
              >
                <Text className="font-sans text-[13px] text-oxblood underline">Xem chứng từ hoàn tiền</Text>
              </Pressable>
            ) : (
              <Text className="font-sans text-[13px] text-landing-muted">
                Mã giao dịch: <Text className="font-mono text-landing-obsidian">{evidenceText}</Text>
              </Text>
            )
          ) : null}

          {receiptImages.length > 0 ? (
            <View>
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                Ảnh chứng từ chuyển khoản <Text className="font-mono">({receiptImages.length})</Text>
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {receiptImages.map((url, index) => (
                  <Pressable
                    key={url}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`Xem chứng từ ${index + 1}`}
                    onPress={() =>
                      setZoomed({ url, caption: `Chứng từ chuyển khoản ${index + 1}/${receiptImages.length}` })
                    }
                    className="overflow-hidden rounded-subtle border border-landing-line bg-landing-paper active:opacity-75"
                  >
                    <Image source={{ uri: url }} style={RECEIPT_STYLE} contentFit="cover" />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <ImagePreviewModal url={zoomed?.url ?? null} caption={zoomed?.caption} onClose={() => setZoomed(null)} />
    </View>
  );
}

const ISSUE_EVENT_TONE: Record<string, string> = {
  ORDER_ISSUE_REJECTED: 'text-danger',
  ORDER_ISSUE_REFUND_APPROVED: 'text-sage-ink',
};
const HISTORY_PREVIEW = 5;

/** Dòng thời gian, mới nhất ở trên; lịch sử dài chỉ hiện 5 cập nhật gần nhất trước. */
export function ReturnHistoryTimeline({ events, emptyText }: { events: IOrderHistoryEvent[]; emptyText: string }) {
  const [showAll, setShowAll] = useState(false);
  if (events.length === 0) {
    return <Text className="font-sans text-[13px] text-landing-muted">{emptyText}</Text>;
  }
  const newestFirst = [...events].reverse();
  const visible = showAll ? newestFirst : newestFirst.slice(0, HISTORY_PREVIEW);

  return (
    <View>
      {visible.map((event, index) => {
        const isLatest = index === 0;
        return (
          <View key={event.id ?? `${event.type}-${index}`} className="flex-row gap-3">
            <View className="items-center pt-1.5">
              <View className={`h-1.5 w-1.5 shrink-0 ${isLatest ? 'bg-oxblood' : 'bg-taupe'}`} />
              {index < visible.length - 1 ? <View className="mt-1 w-px flex-1 bg-landing-line" /> : null}
            </View>
            <View className="flex-1 pb-3">
              <Text
                className={`font-sans text-[12.5px] leading-relaxed ${
                  ISSUE_EVENT_TONE[event.type ?? ''] ?? 'text-landing-obsidian'
                } ${isLatest ? 'font-medium' : ''}`}
              >
                {event.publicMessage || event.message || event.toStatus || event.type || 'Cập nhật đổi trả'}
              </Text>
              <Text className="mt-0.5 font-mono text-[11px] text-landing-muted">
                {formatDateTime(event.occurredAt || event.createdAt || '')}
              </Text>
            </View>
          </View>
        );
      })}

      {events.length > HISTORY_PREVIEW ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll((value) => !value)}
          className="h-11 justify-center self-start active:opacity-60"
        >
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
            {showAll ? 'Chỉ xem các cập nhật mới nhất' : `Xem toàn bộ ${events.length} cập nhật`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
