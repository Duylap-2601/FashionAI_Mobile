import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { RotateCcw } from 'lucide-react-native';
import { IChatMessage } from '@/features/chat/types/chat';
import { COLORS } from '@/constants/theme';

function formatTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

interface ChatMessageProps {
  message: IChatMessage;
  onRetry?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  if (message.role === 'user') {
    return (
      <View className="mb-md items-end">
        <View className="max-w-[85%] rounded-xl rounded-br-sm bg-primary-container px-md py-sm">
          <Text className="text-body-md text-primary-foreground">{message.content}</Text>
        </View>
        {message.product ? (
          <Text className="mt-xs text-body-sm text-on-surface-variant" numberOfLines={1}>
            Đang tư vấn: {message.product.name}
          </Text>
        ) : null}
        <Text className="mt-xs text-body-sm text-on-surface-variant">
          {formatTime(message.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-md items-start">
      <View className="max-w-[90%] rounded-xl rounded-bl-sm border border-surface-line bg-surface-lowest px-md py-sm shadow-sm">
        {message.content ? (
          <Text className="text-body-md leading-relaxed text-on-surface">
            {message.content}
            {message.streaming ? <Text className="text-tertiary-fixed"> ▍</Text> : null}
          </Text>
        ) : (
          <Text className="text-body-md text-on-surface-variant">Đang suy nghĩ...</Text>
        )}
      </View>
      {message.product?.image ? (
        <View className="mt-sm flex-row items-center gap-sm rounded-lg border border-surface-line bg-surface-lowest p-sm">
          <Image
            source={{ uri: message.product.image }}
            className="h-12 w-10 rounded-md"
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-body-sm font-semibold text-on-surface" numberOfLines={1}>
              {message.product.name}
            </Text>
            {message.product.price !== undefined ? (
              <Text className="text-price-sm text-primary-container">
                {typeof message.product.price === 'number'
                  ? `${message.product.price.toLocaleString('vi-VN')} ₫`
                  : message.product.price}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      <View className="mt-xs flex-row items-center gap-sm">
        <Text className="text-body-sm text-on-surface-variant">
          {formatTime(message.createdAt)}
        </Text>
        {message.isError && onRetry ? (
          <Pressable
            className="min-h-11 flex-row items-center gap-xs px-sm"
            accessibilityLabel="Thử lại"
            onPress={() => onRetry(message.content)}
          >
            <RotateCcw size={14} color={COLORS.primaryContainer} />
            <Text className="text-label-lg text-primary-container">Thử lại</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default ChatMessage;
