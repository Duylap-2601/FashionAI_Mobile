import React from 'react';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Package, RotateCcw } from 'lucide-react-native';
import { IChatMessage } from '@/features/chat/types/chat';
import { AssistantMark } from '@/features/chat/components/AssistantMark';
import { FormattedAssistantText } from '@/features/chat/components/FormattedAssistantText';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

// expo-image không nhận className nên khung ảnh sản phẩm đính kèm giữ kích thước trên style.
const PRODUCT_THUMB_STYLE = { width: 36, height: 44 } as const;

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

/** Thẻ sản phẩm đính kèm, cùng kiểu thẻ "Sản phẩm đính kèm" phía trên bubble của web. */
function AttachedProduct({ product }: { product: NonNullable<IChatMessage['product']> }) {
  return (
    <View className="mb-xs flex-row items-center gap-2.5 rounded-subtle border border-landing-line bg-ivory p-2">
      <View className="overflow-hidden rounded-subtle bg-landing-paper">
        {product.image ? (
          <Image source={{ uri: product.image }} style={PRODUCT_THUMB_STYLE} contentFit="contain" />
        ) : (
          <View className="h-11 w-9 items-center justify-center">
            <Package size={16} strokeWidth={1.75} color={COLORS.muted} />
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1 pr-1">
        <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-ink">
          Sản phẩm đính kèm
        </Text>
        <Text className="font-sans text-[13px] text-landing-obsidian" numberOfLines={1}>
          {product.name}
        </Text>
        {product.price !== undefined ? (
          <Text className="font-mono text-[12px] text-oxblood">
            {typeof product.price === 'number' ? formatCurrency(product.price) : product.price}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const time = formatTime(message.createdAt);

  if (message.role === 'user') {
    return (
      <View className="mb-xl items-end">
        <View className="max-w-[85%] items-end">
          {message.product ? <AttachedProduct product={message.product} /> : null}
          <View className="rounded-subtle bg-oxblood px-lg py-md">
            <Text className="font-sans text-[14px] leading-relaxed text-landing-paper">
              {message.content}
            </Text>
          </View>
          {time ? (
            <Text className="mt-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
              {time}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="mb-xl flex-row items-start gap-md">
      <View className="mt-0.5">
        <AssistantMark />
      </View>
      <View className="max-w-[85%] shrink items-start">
        {message.product ? <AttachedProduct product={message.product} /> : null}
        <View
          className={`rounded-subtle border border-landing-line bg-ivory px-lg py-md ${
            message.isError ? 'border-l-2 border-l-danger' : ''
          }`}
        >
          {message.content ? (
            <FormattedAssistantText content={message.content} streaming={message.streaming} />
          ) : message.streaming ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Trợ lý đang trả lời"
              className="flex-row items-center gap-sm py-xs"
            >
              <Text className="font-sans text-[14px] text-landing-muted">Đang suy nghĩ</Text>
              <ActivityIndicator size="small" color={COLORS.brass} />
            </View>
          ) : (
            <Text className="font-sans text-[14px] text-landing-muted">Đã dừng trả lời.</Text>
          )}
        </View>
        <View className="mt-1.5 flex-row items-center gap-sm px-1">
          {time ? (
            <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
              {time}
            </Text>
          ) : null}
          {message.isError && onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thử lại"
              className="min-h-11 flex-row items-center gap-xs px-sm active:opacity-60"
              onPress={() => onRetry(message.content)}
            >
              <RotateCcw size={14} strokeWidth={1.75} color={COLORS.danger} />
              <Text className="font-sans text-[11px] font-semibold text-danger">Thử lại</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default ChatMessage;
