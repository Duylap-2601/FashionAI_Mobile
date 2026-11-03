import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CreditCard,
  Info,
  MessageSquare,
  Package,
  Tag,
} from 'lucide-react-native';
import type { INotification, NotificationType } from '@/features/notifications/types/notification';
import { formatRelativeTime } from '@/utils/date';
import { COLORS } from '@/constants/theme';

function iconFor(type: NotificationType) {
  switch (type) {
    case 'ORDER_STATUS':
      return { Icon: Package, color: COLORS.oxblood };
    case 'PAYMENT':
      return { Icon: CreditCard, color: COLORS.sageInk };
    case 'PROMOTION':
      return { Icon: Tag, color: COLORS.brassInk };
    case 'REVIEW':
      return { Icon: MessageSquare, color: COLORS.warning };
    case 'SYSTEM':
    default:
      return { Icon: Info, color: COLORS.muted };
  }
}

interface NotificationItemProps {
  item: INotification;
  onPress: (item: INotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onPress,
}) => {
  const { Icon, color } = iconFor(item.type);

  return (
    <Pressable
      accessibilityLabel={item.title}
      onPress={() => onPress(item)}
      className={`mx-lg flex-row gap-3 rounded-subtle border bg-ivory py-3 pl-3 pr-4 active:opacity-80 ${
        item.isRead
          ? 'border-landing-line'
          : 'border-l-2 border-landing-line border-l-oxblood'
      }`}
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center border border-landing-line">
        <Icon size={17} strokeWidth={1.5} color={color} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            numberOfLines={1}
            className={`flex-1 font-sans text-body-sm ${
              item.isRead
                ? 'text-landing-obsidian/80'
                : 'font-semibold text-landing-obsidian'
            }`}
          >
            {item.title}
          </Text>
          <Text className="shrink-0 font-mono text-[10px] text-landing-muted">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted"
        >
          {item.message}
        </Text>
        {item.data?.orderCode ? (
          <Text className="mt-1.5 self-start border border-landing-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-landing-muted">
            Mã đơn #{String(item.data.orderCode)}
          </Text>
        ) : null}
      </View>

      {!item.isRead ? <View className="mt-1.5 h-1.5 w-1.5 bg-oxblood" /> : null}
    </Pressable>
  );
};

export default NotificationItem;
