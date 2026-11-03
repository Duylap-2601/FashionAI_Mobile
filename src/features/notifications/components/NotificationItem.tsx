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
  const unread = !item.isRead;

  return (
    <Pressable
      accessibilityLabel={item.title}
      onPress={() => onPress(item)}
      className={`flex-row gap-3 border-b border-landing-line px-lg py-3.5 active:opacity-80 ${
        unread ? 'bg-white' : 'bg-transparent'
      }`}
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center border border-landing-line bg-landing-paper">
        <Icon size={16} strokeWidth={1.5} color={color} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-start gap-1.5">
            {unread ? <View className="mt-1.5 h-1.5 w-1.5 bg-oxblood" /> : null}
            <Text
              numberOfLines={2}
              className={`flex-1 font-sans text-body-sm ${
                unread
                  ? 'font-semibold text-landing-obsidian'
                  : 'text-landing-obsidian/80'
              }`}
            >
              {item.title}
            </Text>
          </View>
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
          <Text className="mt-1.5 self-start font-mono text-[11px] text-landing-obsidian/70">
            Mã đơn #{String(item.data.orderCode)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export default NotificationItem;
