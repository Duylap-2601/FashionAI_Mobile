import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/theme';
import { formatDateTime } from '@/utils/date';
import { useOrderIssues } from '../hooks/use-orders';
import type { IOrderIssue, OrderIssueDesiredResolution, OrderIssueReason, OrderIssueStatus } from '../types/order';
import { getOrderItemImage } from '../utils/order-items';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ToneLabel, type StatusTone } from './ToneLabel';

interface Props {
  orderId: string | number;
}

export const ISSUE_REASON_LABELS: Record<OrderIssueReason, string> = {
  WRONG_SIZE: 'Sai kích thước / số đo',
  WRONG_COLOR: 'Sai màu / sai mẫu',
  QUALITY_MISMATCH: 'Lỗi đường may / chất lượng vải',
  OTHER: 'Lý do khác',
  REFUND_NOT_RECEIVED: 'Chưa nhận được tiền hoàn',
};

const RESOLUTION_LABELS: Record<OrderIssueDesiredResolution, string> = {
  REFUND: 'Hoàn tiền',
};

export const ISSUE_STATUS: Record<OrderIssueStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Chờ xem xét', tone: 'attention' },
  APPROVED: { label: 'Chờ hoàn tiền', tone: 'attention' },
  RESOLVED: { label: 'Đã hoàn tiền', tone: 'done' },
  REJECTED: { label: 'Đã từ chối', tone: 'error' },
};

// expo-image không nhận className (chưa cssInterop), nên kích thước ảnh dùng style.
const THUMB_STYLE = { width: 44, height: 56 } as const;
const EVIDENCE_STYLE = { width: 56, height: 56 } as const;

const FIELD_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted';

function IssueCard({ issue, onZoom }: { issue: IOrderIssue; onZoom: (url: string) => void }) {
  const status = ISSUE_STATUS[issue.status] ?? { label: issue.status, tone: 'closed' as const };
  const item = issue.orderItem;
  const itemName = item?.productNameSnapshot || `Sản phẩm #${String(issue.orderItemId).slice(0, 8)}`;
  const isRefund = issue.approvedResolution === 'REFUND' || issue.desiredResolution === 'REFUND';
  const evidenceImages = issue.evidenceImages ?? [];

  return (
    <View className="gap-4 py-5">
      <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <ToneLabel tone={status.tone} label={status.label} />
          <Text className="font-mono text-[11px] text-landing-muted">#{String(issue.id).slice(0, 8)}</Text>
        </View>
        <Text className="font-mono text-[11px] text-landing-muted">{formatDateTime(issue.createdAt)}</Text>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="overflow-hidden rounded-subtle border border-landing-line bg-landing-paper">
          <Image source={{ uri: getOrderItemImage(item) }} style={THUMB_STYLE} contentFit="cover" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-sans text-[13px] text-landing-obsidian">
            {itemName}
          </Text>
          <Text className="font-sans text-[11.5px] text-landing-muted">
            Màu: {item?.color || 'Mặc định'} · SL <Text className="font-mono">{item?.quantity || 1}</Text>
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View>
          <Text className={FIELD_LABEL_CLASS}>Lý do</Text>
          <Text className="mt-1 font-sans text-[13px] leading-relaxed text-landing-obsidian">
            {ISSUE_REASON_LABELS[issue.reason] || issue.reason}
          </Text>
        </View>
        <View>
          <Text className={FIELD_LABEL_CLASS}>Hướng xử lý</Text>
          <Text className="mt-1 font-sans text-[13px] leading-relaxed text-landing-obsidian">
            {RESOLUTION_LABELS[issue.desiredResolution] || issue.desiredResolution}
          </Text>
        </View>
        <View>
          <Text className={FIELD_LABEL_CLASS}>Mô tả của bạn</Text>
          <Text className="mt-1 font-sans text-[13px] leading-relaxed text-landing-obsidian">{issue.description}</Text>
        </View>
      </View>

      {evidenceImages.length > 0 ? (
        <View>
          <Text className={FIELD_LABEL_CLASS}>
            Ảnh minh chứng <Text className="font-mono">({evidenceImages.length})</Text>
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {evidenceImages.map((url, index) => (
              <Pressable
                key={url}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Xem ảnh minh chứng ${index + 1}`}
                onPress={() => onZoom(url)}
                className="overflow-hidden rounded-subtle border border-landing-line bg-landing-paper active:opacity-75"
              >
                <Image source={{ uri: url }} style={EVIDENCE_STYLE} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {issue.adminNote ? (
        <View
          className={`border-l-2 bg-landing-paper px-3 py-2.5 ${
            issue.status === 'REJECTED' ? 'border-danger' : 'border-landing-brass'
          }`}
        >
          <Text className={FIELD_LABEL_CLASS}>Phản hồi của shop</Text>
          <Text className="mt-1 font-sans text-[13px] leading-relaxed text-landing-obsidian">{issue.adminNote}</Text>
        </View>
      ) : null}

      {issue.status === 'APPROVED' && isRefund ? (
        <Text className="font-sans text-[13px] leading-relaxed text-landing-obsidian">
          Shop đã duyệt hoàn tiền. Shop chuyển khoản sau khi nhận lại và kiểm tra hàng; theo dõi ở mục Hoàn tiền.
        </Text>
      ) : null}
      {issue.status === 'RESOLVED' && isRefund ? (
        <Text className="font-sans text-[13px] leading-relaxed text-sage-ink">
          Shop đã chuyển khoản hoàn tiền. Chứng từ nằm ở mục Hoàn tiền.
        </Text>
      ) : null}
    </View>
  );
}

/** Các yêu cầu báo lỗi / hoàn tiền của một đơn; nơi gọi tự bọc khung và tiêu đề. */
export function OrderIssuesList({ orderId }: Props) {
  const { issues, isLoading } = useOrderIssues(orderId);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View className="flex-row items-center gap-2 py-4">
        <ActivityIndicator size="small" color={COLORS.oxblood} />
        <Text className="font-sans text-[12px] text-landing-muted">Đang tải yêu cầu báo lỗi</Text>
      </View>
    );
  }

  if (issues.length === 0) return null;

  return (
    <View>
      {issues.map((issue: IOrderIssue, index: number) => (
        <View key={issue.id} className={index > 0 ? 'border-t border-landing-line/60' : ''}>
          <IssueCard issue={issue} onZoom={setZoomedUrl} />
        </View>
      ))}

      <ImagePreviewModal url={zoomedUrl} caption="Ảnh minh chứng" onClose={() => setZoomedUrl(null)} />
    </View>
  );
}
