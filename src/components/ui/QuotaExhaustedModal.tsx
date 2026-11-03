import React, { useMemo } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, ArrowRight, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

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
      <View className="flex-1 items-center justify-center bg-landing-obsidian/60 p-5">
        <View className="relative w-full max-w-[360px] items-center rounded-subtle border border-landing-line bg-landing-paper p-6">
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-4 h-9 w-9 items-center justify-center active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Đóng modal"
          >
            <X size={18} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>

          <View className="mb-4 mt-2 h-16 w-16 items-center justify-center border border-landing-line">
            <Clock size={28} strokeWidth={1.5} color={COLORS.brassInk} />
          </View>

          <Text className="mb-2 px-2 text-center font-display text-[22px] leading-tight text-landing-obsidian">
            {hasDeficit ? 'Không đủ lượt trong ngày' : `Hết lượt ${actionName} hôm nay`}
          </Text>

          <Text className="mb-6 px-1 text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            {hasDeficit
              ? `Yêu cầu này cần ${requested} lượt nhưng bạn chỉ còn ${remaining} lượt trong ngày. Quota sẽ được đặt lại lúc ${formattedResetTime}.`
              : `Bạn đã sử dụng hết lượt ${actionName} trong ngày. Quota sẽ được tự động làm mới lúc ${formattedResetTime}.`}
          </Text>

          <View className="mb-3 w-full gap-2.5">
            <Pressable
              onPress={handleUpgradePress}
              className="h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90"
              accessibilityRole="button"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                Nâng cấp gói tài khoản
              </Text>
              <ArrowRight size={15} strokeWidth={1.75} color={COLORS.paper} />
            </Pressable>

            <Pressable
              onPress={onClose}
              className="h-11 w-full items-center justify-center rounded-subtle border border-landing-line active:bg-ivory"
              accessibilityRole="button"
            >
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                Để sau
              </Text>
            </Pressable>
          </View>

          <Text className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
            Lượt dùng được tự động làm mới vào 00:00 (UTC+7) mỗi ngày.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
