import React, { useMemo } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, ArrowRight, X } from 'lucide-react-native';

export interface QuotaExhaustedModalProps {
  visible: boolean;
  onClose: () => void;
  actionName?: string;
  resetAt?: string | Date;
  requested?: number;
  remaining?: number;
  onUpgrade?: () => void;
}

export function QuotaExhaustedModal({
  visible,
  onClose,
  actionName = 'AI',
  resetAt,
  requested,
  remaining,
  onUpgrade,
}: QuotaExhaustedModalProps) {
  const navigation = useNavigation<any>();

  const formattedResetTime = useMemo(() => {
    if (!resetAt) return '00:00 ngày mai';
    try {
      const date = new Date(resetAt);
      return (
        date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ' (' +
        date.toLocaleDateString('vi-VN') +
        ')'
      );
    } catch {
      return '00:00 ngày mai';
    }
  }, [resetAt]);

  const hasDeficit = requested !== undefined && remaining !== undefined && requested > remaining;

  const handleUpgradePress = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('SubscriptionPlans');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <View className="bg-surface rounded-3xl p-6 w-full max-w-[360px] items-center border border-surface-line shadow-2xl relative">
          {/* Close button */}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center active:bg-surface-line"
            accessibilityRole="button"
            accessibilityLabel="Đóng modal"
          >
            <X size={18} color="#737373" />
          </Pressable>

          {/* Clock Icon */}
          <View className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mb-4 mt-2">
            <Clock size={32} color="#D97706" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-on-surface text-center mb-2 px-2">
            {hasDeficit ? 'Không đủ lượt trong ngày' : `Hết lượt ${actionName} hôm nay`}
          </Text>

          {/* Description */}
          <Text className="text-body-sm text-on-surface-variant text-center leading-relaxed mb-6 px-1">
            {hasDeficit
              ? `Yêu cầu này cần ${requested} lượt nhưng bạn chỉ còn ${remaining} lượt trong ngày. Quota sẽ được đặt lại lúc ${formattedResetTime}.`
              : `Bạn đã sử dụng hết lượt ${actionName} trong ngày. Quota sẽ được tự động làm mới lúc ${formattedResetTime}.`}
          </Text>

          {/* Action CTAs */}
          <View className="w-full gap-2.5 mb-3">
            <Pressable
              onPress={handleUpgradePress}
              className="w-full min-h-[48px] rounded-xl bg-primary flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm"
              accessibilityRole="button"
            >
              <Text className="text-white font-bold text-label-lg">Nâng cấp gói tài khoản</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={onClose}
              className="w-full min-h-[44px] rounded-xl border border-surface-line items-center justify-center active:bg-surface-line/50"
              accessibilityRole="button"
            >
              <Text className="text-on-surface font-semibold text-label-md">Để sau</Text>
            </Pressable>
          </View>

          {/* Footnote */}
          <Text className="text-[11px] text-on-surface-variant/70 text-center">
            Lượt dùng được tự động làm mới vào 00:00 (UTC+7) mỗi ngày.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
