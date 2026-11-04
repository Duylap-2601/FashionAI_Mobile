import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CreditCard,
  Info,
  MessageSquare,
  Package,
  ShieldAlert,
  Tag,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { INotification, NotificationType } from '@/features/notifications/types/notification';
import { formatRelativeTime } from '@/utils/date';
import { COLORS } from '@/constants/theme';

// Cùng bảng loại thông báo của trang Thông báo trên web: biểu tượng, nhãn và tông chữ.
const TYPE_META: Record<NotificationType, { Icon: LucideIcon; label: string; color: string; text: string }> = {
  ORDER_STATUS: { Icon: Package, label: 'Đơn hàng', color: COLORS.oxblood, text: 'text-oxblood' },
  PAYMENT: { Icon: CreditCard, label: 'Thanh toán', color: COLORS.sageInk, text: 'text-sage-ink' },
  PROMOTION: { Icon: Tag, label: 'Khuyến mãi', color: COLORS.brassInk, text: 'text-brass-ink' },
  REVIEW: { Icon: MessageSquare, label: 'Đánh giá', color: COLORS.brassInk, text: 'text-brass-ink' },
  SYSTEM: { Icon: Info, label: 'Hệ thống', color: COLORS.muted, text: 'text-landing-muted' },
  ORDER_ISSUE: { Icon: ShieldAlert, label: 'Đổi trả', color: COLORS.oxblood, text: 'text-oxblood' },
};

interface NotificationItemProps {
  item: INotification;
  onPress: (item: INotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onPress,
}) => {
  const meta = TYPE_META[item.type] ?? TYPE_META.SYSTEM;
  const { Icon } = meta;
  const unread = !item.isRead;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Chưa đọc: ' : ''}${item.title}`}
      onPress={() => onPress(item)}
      className={`flex-row gap-4 px-4 py-4 active:opacity-80 ${
        unread ? 'bg-ivory' : 'bg-transparent'
      }`}
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center border border-landing-line bg-landing-paper">
        <Icon size={16} strokeWidth={1.75} color={meta.color} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-start gap-2">
          {unread ? <View className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-oxblood" /> : null}
          <Text
            numberOfLines={2}
            className={`flex-1 font-sans text-body-md ${
              unread ? 'font-semibold text-landing-obsidian' : 'text-landing-obsidian/80'
            }`}
          >
            {item.title}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted"
        >
          {item.message}
        </Text>
        {item.data?.orderCode ? (
          <Text className="mt-2 font-mono text-[11px] text-landing-obsidian/70">
            Mã đơn #{String(item.data.orderCode)}
          </Text>
        ) : null}
        <View className="mt-2 flex-row items-center gap-2">
          <Text className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.text}`}>
            {meta.label}
          </Text>
          <Text className="font-sans text-[11px] text-landing-muted">·</Text>
          <Text className="font-sans text-[11px] text-landing-muted">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default NotificationItem;
