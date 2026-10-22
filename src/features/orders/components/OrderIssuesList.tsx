import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { AlertTriangle, Clock, RefreshCw, CheckCircle2, XCircle, Image as ImageIcon, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useOrderIssues } from '../hooks/use-orders';
import { IOrderIssue, OrderIssueStatus, OrderIssueReason, OrderIssueDesiredResolution } from '../types/order';

interface Props {
  orderId: string | number;
}

const REASON_LABELS: Record<OrderIssueReason, string> = {
  WRONG_SIZE: 'Sai kích thước / số đo',
  WRONG_COLOR: 'Sai màu sắc',
  QUALITY_MISMATCH: 'Lỗi đường may / Chất lượng vải',
  OTHER: 'Lý do khác',
};

const RESOLUTION_LABELS: Record<OrderIssueDesiredResolution, string> = {
  REFUND: 'Hoàn tiền',
  EXCHANGE: 'Đổi hàng 1-1',
};

function StatusBadge({ status }: { status: OrderIssueStatus }) {
  switch (status) {
    case 'PENDING':
      return (
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
          <Clock size={13} color="#D97706" />
          <Text className="text-[12px] font-bold text-amber-700">Chờ xem xét</Text>
        </View>
      );
    case 'APPROVED':
      return (
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30">
          <RefreshCw size={13} color="#2563EB" />
          <Text className="text-[12px] font-bold text-blue-700">Đã duyệt (Đang xử lý)</Text>
        </View>
      );
    case 'RESOLVED':
      return (
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <CheckCircle2 size={13} color="#059669" />
          <Text className="text-[12px] font-bold text-emerald-700">Đã hoàn tất xử lý</Text>
        </View>
      );
    case 'REJECTED':
      return (
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
          <XCircle size={13} color="#DC2626" />
          <Text className="text-[12px] font-bold text-red-700">Từ chối yêu cầu</Text>
        </View>
      );
    default:
      return (
        <View className="px-2.5 py-1 rounded-full bg-surface-line">
          <Text className="text-[12px] font-bold text-on-surface-variant">{status}</Text>
        </View>
      );
  }
}

export function OrderIssuesList({ orderId }: Props) {
  const { issues, isLoading } = useOrderIssues(orderId);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View className="bg-surface border border-surface-line rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#5D1C34" />
          <Text className="text-body-sm text-on-surface-variant">Đang kiểm tra yêu cầu hỗ trợ...</Text>
        </View>
      </View>
    );
  }

  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <View className="bg-surface border border-amber-500/30 rounded-2xl p-4 mb-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center gap-2.5 pb-3 border-b border-surface-line mb-3">
        <View className="w-8 h-8 rounded-xl bg-amber-500/15 items-center justify-center">
          <AlertTriangle size={16} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-body-md font-bold text-on-surface">
            Yêu cầu sự cố &amp; Đổi trả ({issues.length})
          </Text>
          <Text className="text-[12px] text-on-surface-variant">
            Tiến trình giải quyết sự cố sản phẩm
          </Text>
        </View>
      </View>

      {/* Issues list */}
      <View className="gap-3.5">
        {issues.map((issue: IOrderIssue) => {
          const item = issue.orderItem;
          const itemName = item?.productNameSnapshot || `Sản phẩm #${String(issue.orderItemId).slice(0, 8)}`;
          const itemColor = item?.color || 'Mặc định';

          return (
            <View
              key={issue.id}
              className="p-3.5 rounded-xl border border-surface-line bg-surface-lowest gap-3"
            >
              {/* Status & Date */}
              <View className="flex-row items-center justify-between">
                <StatusBadge status={issue.status} />
                <Text className="text-[11px] text-on-surface-variant">
                  {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('vi-VN') : ''}
                </Text>
              </View>

              {/* Product Info */}
              <View className="flex-row items-center gap-2.5 p-2 bg-surface rounded-lg border border-surface-line">
                {item?.productImageSnapshot && (
                  <View className="w-10 h-12 rounded bg-surface-line overflow-hidden shrink-0">
                    <Image
                      source={{ uri: item.productImageSnapshot }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-body-sm font-bold text-on-surface" numberOfLines={1}>
                    {itemName}
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant">
                    Màu: {itemColor} • Số lượng: {item?.quantity || 1}
                  </Text>
                </View>
              </View>

              {/* Reason & Resolution */}
              <View className="gap-1.5 text-body-sm">
                <View className="flex-row items-center justify-between bg-surface p-2 rounded-lg border border-surface-line">
                  <Text className="text-[12px] text-on-surface-variant">Vấn đề:</Text>
                  <Text className="text-[12px] font-bold text-on-surface">
                    {REASON_LABELS[issue.reason] || issue.reason}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between bg-surface p-2 rounded-lg border border-surface-line">
                  <Text className="text-[12px] text-on-surface-variant">Mong muốn:</Text>
                  <Text className="text-[12px] font-bold text-primary">
                    {RESOLUTION_LABELS[issue.desiredResolution] || issue.desiredResolution}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View className="p-2.5 bg-surface rounded-lg border border-surface-line">
                <Text className="text-[11px] font-semibold text-on-surface-variant mb-1">
                  Nội dung phản ánh:
                </Text>
                <Text className="text-body-sm text-on-surface leading-relaxed">
                  {issue.description}
                </Text>
              </View>

              {/* Evidence Images */}
              {issue.evidenceImages && issue.evidenceImages.length > 0 && (
                <View>
                  <Text className="text-[11px] font-semibold text-on-surface-variant mb-1.5 flex-row items-center gap-1">
                    Ảnh đính kèm ({issue.evidenceImages.length}):
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {issue.evidenceImages.map((imgUrl, i) => (
                      <Pressable
                        key={i}
                        onPress={() => setSelectedImg(imgUrl)}
                        className="w-14 h-16 rounded-lg overflow-hidden border border-surface-line active:opacity-75"
                      >
                        <Image source={{ uri: imgUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Admin Note */}
              {issue.adminNote && (
                <View className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                  <Text className="text-[11px] font-bold text-primary mb-0.5">
                    Phản hồi từ FashionAI Support:
                  </Text>
                  <Text className="text-body-sm text-on-surface leading-relaxed">
                    {issue.adminNote}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImg} transparent={true} animationType="fade" onRequestClose={() => setSelectedImg(null)}>
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <Pressable
            onPress={() => setSelectedImg(null)}
            className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/20 items-center justify-center z-10"
          >
            <X size={20} color="#FFFFFF" />
          </Pressable>
          {selectedImg && (
            <Image
              source={{ uri: selectedImg }}
              style={{ width: '100%', height: '70%' }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
