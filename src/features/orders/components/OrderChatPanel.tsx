import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { ImagePlus, Send, Trash2 } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { formatDateTime } from '@/utils/date';
import { getErrorMessage } from '@/utils/error-message';
import { generateIdempotencyKey } from '@/features/try-on/utils/idempotency-key';
import { ImagePreviewModal } from './ImagePreviewModal';
import { useOrderChat } from '../hooks/use-order-chat';
import type { IEvidenceImage } from '../types/order';
import type { IOrderChatMessage } from '../types/order-chat';
import {
  MAX_CHAT_ATTACHMENTS,
  describeEvidenceRejection,
  pickEvidenceImages,
} from '../utils/evidence-images';

const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';
const ATTACH_STYLE = { width: 56, height: 56 } as const;
const ATTACH_PREVIEW_STYLE = { width: '100%', height: '100%' } as const;
const PANEL_MAX_HEIGHT = 360;
const MAX_MESSAGE_LENGTH = 2000;

interface Props {
  orderId: string | number;
  orderCode?: string;
}

function MessageBubble({
  message,
  onZoom,
}: {
  message: IOrderChatMessage;
  onZoom: (url: string, caption: string) => void;
}) {
  const isOwn = message.senderRole === 'CUSTOMER';

  return (
    <View className={`flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] gap-1.5 rounded-subtle border px-3 py-2 ${
          isOwn ? 'border-oxblood bg-landing-ivory' : 'border-landing-line bg-landing-ivory'
        }`}
      >
        {!isOwn && message.senderName ? (
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-landing-muted">
            {message.senderName}
          </Text>
        ) : null}
        {message.content ? (
          <Text className="font-sans text-[13px] leading-relaxed text-landing-obsidian">
            {message.content}
          </Text>
        ) : null}
        {message.attachments.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {message.attachments.map((url, index) => (
              <Pressable
                key={`${message.id}-${index}`}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Xem ảnh ${index + 1} trong tin nhắn`}
                onPress={() =>
                  onZoom(url, `Ảnh ${index + 1}/${message.attachments.length} trong tin nhắn`)
                }
                className="overflow-hidden rounded-subtle border border-landing-line bg-landing-paper active:opacity-75"
              >
                <Image source={{ uri: url }} style={ATTACH_STYLE} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <Text className="font-mono text-[10px] text-landing-muted">
        {formatDateTime(message.createdAt)}
      </Text>
    </View>
  );
}

/** Hội thoại với shop của một đơn, hiển thị inline trong chi tiết đơn. */
export function OrderChatPanel({ orderId, orderCode }: Props) {
  const {
    messages,
    unread,
    isLocked,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isSending,
    markRead,
  } = useOrderChat(orderId);

  const [text, setText] = useState('');
  const [images, setImages] = useState<IEvidenceImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<{ url: string; caption: string } | null>(null);
  const pendingKeyRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const atBottomRef = useRef(true);

  const canSend = (text.trim().length > 0 || images.length > 0) && !isSending;
  const newestMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;

  useFocusEffect(
    useCallback(() => {
      if (AppState.currentState !== 'active') return;
      if (unread > 0 && newestMessageId) markRead(newestMessageId);
    }, [markRead, newestMessageId, unread]),
  );

  useEffect(() => {
    if (messages.length > 0 && atBottomRef.current) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    atBottomRef.current = distanceFromBottom < 48;
  };

  const handlePickImages = async () => {
    const result = await pickEvidenceImages(MAX_CHAT_ATTACHMENTS - images.length);
    if (result.cancelled) return;

    const rejection = describeEvidenceRejection(result.rejectedSize, result.rejectedType);
    if (rejection) setErrorMsg(rejection);

    if (result.images.length > 0) {
      pendingKeyRef.current = null;
      setImages((prev) => [...prev, ...result.images].slice(0, MAX_CHAT_ATTACHMENTS));
    }
  };

  const handleSend = () => {
    if (!canSend) return;

    const content = text.trim();
    const clientMessageId = pendingKeyRef.current ?? generateIdempotencyKey();
    pendingKeyRef.current = clientMessageId;

    sendMessage(
      {
        orderId,
        content: content || undefined,
        images,
        clientMessageId,
      },
      {
        onSuccess: () => {
          setText('');
          setImages([]);
          setErrorMsg(null);
          pendingKeyRef.current = null;
        },
        onError: (error) => {
          setErrorMsg(getErrorMessage(error, 'Không gửi được tin nhắn.'));
        },
      },
    );
  };

  const handleChangeText = (value: string) => {
    pendingKeyRef.current = null;
    setText(value);
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <View className="rounded-subtle border border-landing-line bg-ivory">
      <View className="flex-row items-center justify-between gap-3 border-b border-landing-line px-4 py-3">
        <View className="min-w-0 flex-1">
          <Text className={LABEL_CLASS}>Trao đổi với shop</Text>
          {orderCode ? (
            <Text className="mt-0.5 font-mono text-[11px] text-landing-muted">{orderCode}</Text>
          ) : null}
        </View>
        {unread > 0 ? (
          <View className="rounded-full bg-oxblood px-2 py-0.5">
            <Text className="font-mono text-[10px] text-landing-paper">{unread}</Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-row items-center gap-2 px-4 py-6">
          <ActivityIndicator size="small" color={COLORS.oxblood} />
          <Text className="font-sans text-[12px] text-landing-muted">Đang tải hội thoại</Text>
        </View>
      ) : isError ? (
        <View className="gap-2 px-4 py-6">
          <Text className="font-sans text-[13px] text-danger">Không tải được hội thoại.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            className="h-11 items-center justify-center self-start rounded-subtle border border-landing-line px-4 active:opacity-70"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: PANEL_MAX_HEIGHT }}
          contentContainerClassName="gap-3 px-3 py-3"
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="h-11 items-center justify-center active:opacity-60"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood">
                {isFetchingNextPage ? 'Đang tải thêm…' : 'Tải tin nhắn cũ hơn'}
              </Text>
            </Pressable>
          ) : null}

          {messages.length === 0 ? (
            <Text className="px-4 py-8 text-center font-sans text-[12px] leading-relaxed text-landing-muted">
              Chưa có trao đổi nào. Bạn có thể hỏi shop về số đo hoặc đơn hàng tại đây.
            </Text>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onZoom={(url, caption) => setZoomed({ url, caption })}
              />
            ))
          )}
        </ScrollView>
      )}

      {isLocked ? (
        <View className="border-t border-landing-line px-4 py-3">
          <Text className="text-center font-sans text-[12px] leading-relaxed text-landing-muted">
            Hội thoại đã đóng sau khi hoàn tiền. Lịch sử tin nhắn vẫn được lưu.
          </Text>
        </View>
      ) : (
        <View className="gap-2 border-t border-landing-line px-3 py-3">
          {errorMsg ? (
            <View accessibilityRole="alert" className="border-l-2 border-danger bg-landing-paper px-3 py-2">
              <Text className="font-sans text-[12px] leading-relaxed text-danger">{errorMsg}</Text>
            </View>
          ) : null}

          {images.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {images.map((img, index) => (
                <View
                  key={img.uri}
                  className="h-14 w-14 overflow-hidden rounded-subtle border border-landing-line"
                >
                  <Image source={{ uri: img.uri }} style={ATTACH_PREVIEW_STYLE} contentFit="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ảnh ${index + 1}`}
                    disabled={isSending}
                    onPress={() => {
                      pendingKeyRef.current = null;
                      setImages((prev) => prev.filter((_, i) => i !== index));
                    }}
                    hitSlop={8}
                    className="absolute right-0.5 top-0.5 h-6 w-6 items-center justify-center rounded-full bg-landing-obsidian/60"
                  >
                    <Trash2 size={11} color={COLORS.ivory} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View className="flex-row items-end gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đính kèm ảnh"
              accessibilityState={{ disabled: images.length >= MAX_CHAT_ATTACHMENTS || isSending }}
              disabled={images.length >= MAX_CHAT_ATTACHMENTS || isSending}
              onPress={() => void handlePickImages()}
              className="h-11 w-11 items-center justify-center active:opacity-60 disabled:opacity-40"
            >
              <ImagePlus size={18} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>

            <View className="flex-1">
              <TextInput
                value={text}
                onChangeText={handleChangeText}
                placeholder="Nhập tin nhắn…"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Nội dung tin nhắn"
                maxLength={MAX_MESSAGE_LENGTH}
                multiline
                className="max-h-28 min-h-11 rounded-subtle border border-landing-line bg-landing-paper px-3 py-2 font-sans text-[13px] text-landing-obsidian"
              />
              <Text className="mt-1 text-right font-mono text-[10px] text-landing-muted">
                {text.length}/{MAX_MESSAGE_LENGTH}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi tin nhắn"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={handleSend}
              className="h-11 w-11 items-center justify-center rounded-subtle bg-oxblood active:opacity-90 disabled:opacity-40"
            >
              {isSending ? (
                <ActivityIndicator size="small" color={COLORS.paper} />
              ) : (
                <Send size={16} strokeWidth={1.75} color={COLORS.paper} />
              )}
            </Pressable>
          </View>
        </View>
      )}

      <ImagePreviewModal
        url={zoomed?.url ?? null}
        caption={zoomed?.caption}
        onClose={() => setZoomed(null)}
      />
    </View>
  );
}
