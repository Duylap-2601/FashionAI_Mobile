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
      return {
        Icon: Package,
        color: COLORS.primaryContainer,
        bgClassName: 'bg-primary-soft',
      };
    case 'PAYMENT':
      return {
        Icon: CreditCard,
        color: COLORS.success,
        bgClassName: 'bg-success/15',
      };
    case 'PROMOTION':
      return {
        Icon: Tag,
        color: COLORS.tertiary,
        bgClassName: 'bg-tertiary/15',
      };
    case 'REVIEW':
      return {
        Icon: MessageSquare,
        color: COLORS.warning,
        bgClassName: 'bg-warning/15',
      };
    case 'SYSTEM':
    default:
      return {
        Icon: Info,
        color: COLORS.onSurfaceVariant,
        bgClassName: 'bg-surface-low',
      };
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
  const { Icon, color, bgClassName } = iconFor(item.type);

  return (
    <Pressable
      accessibilityLabel={item.title}
      onPress={() => onPress(item)}
      className={`mx-xl flex-row gap-md rounded-xl border border-surface-line bg-surface-lowest p-md shadow-sm ${
        item.isRead ? '' : 'border-outline-variant'
      }`}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${bgClassName}`}
      >
        <Icon size={20} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-sm">
          <Text
            className={`flex-1 text-body-sm text-on-surface ${
              item.isRead ? '' : 'font-bold'
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-body-sm text-on-surface-variant">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text
          className="mt-xs text-body-sm leading-relaxed text-on-surface-variant"
          numberOfLines={2}
        >
          {item.message}
        </Text>
        {item.data?.orderCode ? (
          <View className="mt-xs self-start rounded-md bg-surface-low px-sm py-xs">
            <Text className="text-body-sm text-on-surface-variant">
              Mã đơn: #{String(item.data.orderCode)}
            </Text>
          </View>
        ) : null}
      </View>
      {!item.isRead ? (
        <View className="mt-sm h-2 w-2 rounded-full bg-primary-container" />
      ) : null}
    </Pressable>
  );
};

export default NotificationItem;
