import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { History, RotateCcw, X } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth.api';
import { getProduct, mainProductImage } from '@/features/products/api/products.api';
import { measurementsApi } from '@/features/measurements/api/measurements.api';
import { useChat } from '@/features/chat/hooks/use-chat';
import { chatKeys } from '@/features/chat/hooks/chat-keys';
import {
  CHAT_OCCASIONS,
  CHAT_QUICK_REPLIES,
  IChatContextPayload,
  IChatProductContext,
} from '@/features/chat/types/chat';
import { ChatMessage } from '@/features/chat/components/ChatMessage';
import { ChatComposer } from '@/features/chat/components/ChatComposer';
import { QuickChips } from '@/features/chat/components/QuickChips';
import { SessionSheet } from '@/features/chat/components/SessionSheet';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function buildContext(
  measurements: Record<string, number | string | undefined> | null,
  tier?: string,
): IChatContextPayload {
  const context: IChatContextPayload = {};
  if (measurements && Object.keys(measurements).length > 0) {
    context.measurements = measurements;
  }
  if (tier) context.tier = tier;
  return context;
}

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const initialSessionId = route.params?.sessionId;
  const initialProductId = route.params?.productId;
  const {
    messages,
    currentSessionId,
    isStreaming,
    error,
    sendMessage,
    stop,
    loadSession,
    newChat,
  } = useChat(initialSessionId);

  const [attachedProduct, setAttachedProduct] = useState<IChatProductContext | null>(null);
  const [occasion, setOccasion] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loadingSession, setLoadingSession] = useState(() => !!initialSessionId);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const measurementsRef = useRef<Record<string, number | string | undefined> | null>(null);
  const followRef = useRef(true);
  const listRef = useRef<FlatList>(null);

  // Badge quota: server state qua React Query, tự refresh sau mỗi tin xong
  // (hook useChat invalidate key này trong finalizeDone).
  const quotaQuery = useQuery({
    queryKey: chatKeys.quota(),
    queryFn: ({ signal }) => authApi.getUserQuota('CHATBOT', { signal }),
    staleTime: 30_000,
  });
  const quotaRaw: any = quotaQuery.data;
  const quotaParsed = quotaRaw?.CHATBOT ?? quotaRaw?.chatbot ?? quotaRaw;
  const quota =
    typeof quotaParsed?.remaining === 'number' || typeof quotaParsed?.limit === 'number'
      ? {
          remaining: quotaParsed.remaining as number | undefined,
          limit: quotaParsed.limit as number | undefined,
        }
      : null;

  // Số đo tải 1 lần, best-effort để gửi kèm context như bản web.
  useEffect(() => {
    let active = true;
    measurementsApi
      .getMeasurements()
      .then((data: any) => {
        if (!active || !data || typeof data !== 'object') return;
        const { id, userId, updatedAt, ...rest } = data;
        const cleaned: Record<string, number | string | undefined> = {};
        Object.entries(rest).forEach(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'string') {
            cleaned[key] = value;
          }
        });
        if (Object.keys(cleaned).length > 0) measurementsRef.current = cleaned;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Sản phẩm đính kèm: từ ProductDetail ("Tư vấn với AI") hoặc params.
  useEffect(() => {
    if (!initialProductId) return;
    let active = true;
    getProduct(initialProductId)
      .then((product) => {
        if (!active) return;
        setAttachedProduct({
          id: String(product.id),
          name: product.name,
          price: product.price,
          image: mainProductImage(product) ?? undefined,
          category: product.category,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialProductId]);

  // Mở màn hình với sessionId có sẵn → nạp lịch sử tin nhắn.
  // Lỗi mạng/session bị xóa thì báo rõ thay vì trắng màn.
  useEffect(() => {
    if (!initialSessionId) return;
    let active = true;
    loadSession(initialSessionId)
      .catch(() => {
        if (active) setSessionError('Không tải được cuộc trò chuyện. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  // Chỉ bám đáy khi user đang ở gần đáy: cuộn lên đọc tin cũ thì không bị
  // giật xuống mỗi khi token mới về (hành vi như bản web).
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 120;
    followRef.current = nearBottom;
    setShowJump((prev) => (prev === !nearBottom ? prev : !nearBottom));
  }, []);

  const jumpToBottom = useCallback(() => {
    followRef.current = true;
    setShowJump(false);
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text, {
        productId: attachedProduct?.id,
        product: attachedProduct ?? undefined,
        context: buildContext(measurementsRef.current, user?.tier),
      });
    },
    [sendMessage, attachedProduct, user?.tier],
  );

  const handleRetry = useCallback(() => {
    const lastUser = [...messages].reverse().find((item) => item.role === 'user');
    if (lastUser && !isStreaming) handleSend(lastUser.content);
  }, [messages, isStreaming, handleSend]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setLoadingSession(true);
      setSessionError(null);
      loadSession(sessionId)
        .catch(() => {
          setSessionError('Không tải được cuộc trò chuyện. Vui lòng thử lại.');
        })
        .finally(() => setLoadingSession(false));
    },
    [loadSession],
  );

  const handleNewChat = useCallback(() => {
    setSessionError(null);
    newChat();
  }, [newChat]);

  const showWelcome = messages.length === 0 && !loadingSession && !sessionError;
  const firstName = user?.name ? user.name.split(' ')[0] : 'bạn';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 px-xl pt-md">
          {/* Header burgundy theo ảnh thiết kế */}
          <View className="rounded-2xl bg-primary-container p-lg shadow-sm">
            <View className="flex-row items-center gap-md">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft-strong">
                <Text className="font-heading text-headline-sm font-bold text-primary-container">
                  S
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-heading text-headline-sm font-bold text-primary-foreground">
                  StAle. Assistant
                </Text>
                <View className="mt-xs flex-row items-center gap-xs">
                  <View className="h-1.5 w-1.5 rounded-full bg-success" />
                  <Text className="text-body-sm text-primary-foreground">
                    Trực tuyến · Phản hồi ngay
                  </Text>
                </View>
              </View>
              <Pressable
                className="min-h-11 min-w-11 items-center justify-center rounded-full"
                accessibilityLabel="Cuộc trò chuyện mới"
                onPress={handleNewChat}
              >
                <RotateCcw size={20} className="text-primary-foreground" />
              </Pressable>
              <Pressable
                className="min-h-11 min-w-11 items-center justify-center rounded-full"
                accessibilityLabel="Lịch sử trò chuyện"
                onPress={() => setSheetVisible(true)}
              >
                <History size={20} className="text-primary-foreground" />
              </Pressable>
              <Pressable
                className="min-h-11 min-w-11 items-center justify-center rounded-full"
                accessibilityLabel="Đóng trò chuyện"
                onPress={() => navigation.goBack()}
              >
                <X size={22} className="text-primary-foreground" />
              </Pressable>
            </View>
            {typeof quota?.remaining === 'number' && typeof quota?.limit === 'number' ? (
              <View className="mt-md self-start rounded-full bg-black/20 px-md py-xs">
                <Text className="text-body-sm font-semibold text-primary-foreground">
                  Còn {quota.remaining}/{quota.limit} lượt hôm nay
                </Text>
              </View>
            ) : null}
          </View>

          {/* Danh sách tin nhắn */}
          <View className="relative mt-md flex-1">
            {loadingSession ? (
              <Loading message="Đang tải cuộc trò chuyện..." />
            ) : sessionError ? (
              <View className="flex-1">
                <ErrorView
                  title="Không tải được cuộc trò chuyện"
                  message={sessionError}
                  onRetry={() =>
                    initialSessionId
                      ? handleSelectSession(initialSessionId)
                      : setSessionError(null)
                  }
                />
                <View className="mt-md items-center">
                  <Button title="Cuộc trò chuyện mới" variant="outline" onPress={handleNewChat} />
                </View>
              </View>
            ) : showWelcome ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center px-md py-xl">
                  <View className="h-20 w-20 items-center justify-center rounded-2xl bg-surface-low">
                    <Ionicons
                      name="chatbubbles-outline"
                      size={40}
                      className="text-on-surface-variant"
                    />
                  </View>
                  <Text className="mt-lg text-center font-heading text-headline-sm font-bold text-on-surface">
                    Xin chào {firstName}! Tôi là StAle. Assistant
                  </Text>
                  <Text className="mt-sm text-center text-body-md leading-relaxed text-on-surface-variant">
                    Tôi có thể giúp bạn thử đồ ảo, tư vấn chọn size vừa vặn, gợi ý
                    phối đồ và giải đáp đơn hàng.
                  </Text>
                  <View className="mt-lg w-full">
                    <QuickChips items={CHAT_QUICK_REPLIES} onSelect={handleSend} />
                  </View>
                </View>
              </ScrollView>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => (
                  <ChatMessage
                    message={item}
                    onRetry={
                      item.role === 'assistant'
                        ? () => {
                            const prevUser = [...messages]
                              .slice(0, index)
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (prevUser && !isStreaming) handleSend(prevUser.content);
                          }
                        : undefined
                    }
                  />
                )}
                onContentSizeChange={() => {
                  if (followRef.current) listRef.current?.scrollToEnd({ animated: false });
                }}
                ListEmptyComponent={
                  <EmptyState
                    icon="💬"
                    title="Bắt đầu trò chuyện"
                    description="Nhắn tin cho StAle. để được tư vấn."
                  />
                }
                ListFooterComponent={<View className="h-md" />}
              />
            )}
            {showJump && !loadingSession && !sessionError && !showWelcome ? (
              <Pressable
                className="absolute bottom-4 right-2 min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-primary-container p-sm shadow-sm"
                accessibilityLabel="Cuộn xuống tin mới nhất"
                onPress={jumpToBottom}
              >
                <Ionicons name="arrow-down" size={20} color={COLORS.onPrimary} />
              </Pressable>
            ) : null}
          </View>

          {/* Lỗi + hành động */}
          {error ? (
            <View className="mb-md rounded-xl border border-surface-line bg-surface-lowest p-md">
              <Text className="text-center text-body-sm text-danger">{error.message}</Text>
              <View className="mt-sm flex-row justify-center gap-md">
                {error.action === 'subscription' ? (
                  <Button
                    title="Xem gói hội viên"
                    size="sm"
                    onPress={() => navigation.navigate('SubscriptionPlans')}
                  />
                ) : (
                  <Button title="Thử lại" size="sm" variant="outline" onPress={handleRetry} />
                )}
              </View>
            </View>
          ) : null}

          {/* Sản phẩm đính kèm */}
          {attachedProduct ? (
            <View className="mb-md flex-row items-center gap-sm rounded-xl border border-outline-variant bg-primary-soft px-md py-sm">
              <Text className="flex-1 text-body-sm font-semibold text-on-surface" numberOfLines={1}>
                Đang tư vấn: {attachedProduct.name}
              </Text>
              <Pressable
                className="min-h-11 min-w-11 items-center justify-center"
                accessibilityLabel="Gỡ sản phẩm đính kèm"
                onPress={() => setAttachedProduct(null)}
              >
                <X size={18} className="text-on-surface-variant" />
              </Pressable>
            </View>
          ) : null}

          {/* Gợi ý dịp mặc */}
          <View className="mb-md">
            <QuickChips
              title="Dịp mặc"
              items={CHAT_OCCASIONS}
              selected={occasion}
              disabled={isStreaming}
              onSelect={(item) => {
                setOccasion(item);
                handleSend(`Tư vấn trang phục đi ${item.toLowerCase()} cho tôi.`);
              }}
            />
          </View>

          {/* Composer sticky đáy */}
          <View className="pb-md">
            <ChatComposer isStreaming={isStreaming} onSend={handleSend} onStop={stop} />
            <Text className="mt-sm text-center text-body-sm text-on-surface-variant">
              Ảnh và số đo của bạn chỉ dùng để tư vấn và được bảo mật.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SessionSheet
        visible={sheetVisible}
        currentSessionId={currentSessionId}
        onClose={() => setSheetVisible(false)}
        onSelect={handleSelectSession}
        onNewChat={newChat}
        onDeletedSession={(id) => {
          if (id === currentSessionId) newChat();
        }}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
