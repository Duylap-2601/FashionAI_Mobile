import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { ArrowDown, ArrowLeft, History, RotateCcw, X } from 'lucide-react-native';
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
import { AssistantMark } from '@/features/chat/components/AssistantMark';
import { ChatMessage } from '@/features/chat/components/ChatMessage';
import { ChatComposer } from '@/features/chat/components/ChatComposer';
import { ChatWelcome } from '@/features/chat/components/ChatWelcome';
import { QuickChips } from '@/features/chat/components/QuickChips';
import { SessionSheet } from '@/features/chat/components/SessionSheet';
import { QuotaExhaustedModal } from '@/components/ui/QuotaExhaustedModal';
import { COLORS } from '@/constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Atelier Paper, cùng ChatWindow của web: header giấy viền mảnh, nút icon 44px không viền.
const HEADER_ICON_BUTTON = 'h-11 w-11 items-center justify-center active:opacity-60';
const ACTION_LABEL = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

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
  const [showQuotaModal, setShowQuotaModal] = useState(false);
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

  const quotaRemaining = quota?.remaining;

  const handleSend = useCallback(
    (text: string) => {
      if (typeof quotaRemaining === 'number' && quotaRemaining <= 0) {
        setShowQuotaModal(true);
        return;
      }
      sendMessage(text, {
        productId: attachedProduct?.id,
        product: attachedProduct ?? undefined,
        context: buildContext(measurementsRef.current, user?.tier),
      });
    },
    [sendMessage, attachedProduct, user?.tier, quotaRemaining],
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
  const userName = user?.name?.trim() || undefined;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-landing-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header giấy viền mảnh như ChatWindow của web (không dùng khối đỏ đô: đỏ đô chỉ cho hành động chính). */}
        <View className="flex-row items-center gap-sm border-b border-landing-line px-xs py-xs">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            className={HEADER_ICON_BUTTON}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} strokeWidth={1.75} color={COLORS.obsidian} />
          </Pressable>
          <AssistantMark />
          <View className="min-w-0 flex-1">
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              className="font-sans text-[15px] font-semibold leading-tight text-landing-obsidian"
            >
              Trợ lý thời trang StAie.
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-sage-ink" />
              <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
                StAie. AI Assistant
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cuộc trò chuyện mới"
            className={HEADER_ICON_BUTTON}
            onPress={handleNewChat}
          >
            <RotateCcw size={18} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở lịch sử trò chuyện"
            className={HEADER_ICON_BUTTON}
            onPress={() => setSheetVisible(true)}
          >
            <History size={18} strokeWidth={1.75} color={COLORS.obsidian} />
          </Pressable>
        </View>

        {typeof quota?.remaining === 'number' && typeof quota?.limit === 'number' ? (
          <View className="flex-row items-center justify-between gap-md border-b border-landing-line px-lg py-sm">
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
              Lượt chat hôm nay
            </Text>
            <Text
              className={`font-mono text-[12px] ${
                quota.remaining <= 0 ? 'text-danger' : 'text-landing-obsidian'
              }`}
            >
              Còn {quota.remaining}/{quota.limit} lượt
            </Text>
          </View>
        ) : null}

        <View className="flex-1 px-lg">
          {/* Danh sách tin nhắn */}
          <View className="relative flex-1">
            {loadingSession ? (
              <View
                accessibilityRole="progressbar"
                className="flex-1 items-center justify-center gap-md"
              >
                <ActivityIndicator size="large" color={COLORS.oxblood} />
                <Text className="font-sans text-body-sm text-landing-muted">
                  Đang tải cuộc trò chuyện…
                </Text>
              </View>
            ) : sessionError ? (
              <View className="flex-1 items-center justify-center gap-md px-lg">
                <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
                  Không tải được cuộc trò chuyện
                </Text>
                <Text className="max-w-[280px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                  {sessionError}
                </Text>
                <View className="mt-sm w-full max-w-[280px] gap-sm">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      initialSessionId
                        ? handleSelectSession(initialSessionId)
                        : setSessionError(null)
                    }
                    className="h-11 items-center justify-center rounded-subtle bg-oxblood active:opacity-90"
                  >
                    <Text className={`${ACTION_LABEL} text-landing-paper`}>Thử lại</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleNewChat}
                    className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
                  >
                    <Text className={`${ACTION_LABEL} text-landing-obsidian`}>
                      Cuộc trò chuyện mới
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : showWelcome ? (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <ChatWelcome
                  userName={userName}
                  prompts={CHAT_QUICK_REPLIES}
                  onSelect={handleSend}
                />
              </ScrollView>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerClassName="pt-xl"
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
                  <View className="items-center gap-xs py-giant">
                    <Text className="text-center font-display text-[20px] text-landing-obsidian">
                      Bắt đầu trò chuyện
                    </Text>
                    <Text className="text-center font-sans text-body-sm text-landing-muted">
                      Nhắn tin cho StAie. để được tư vấn.
                    </Text>
                  </View>
                }
                ListFooterComponent={<View className="h-md" />}
              />
            )}
            {showJump && !loadingSession && !sessionError && !showWelcome ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cuộn xuống tin nhắn mới nhất"
                className="absolute bottom-4 right-0 h-11 w-11 items-center justify-center rounded-subtle border border-landing-line bg-ivory active:opacity-80"
                onPress={jumpToBottom}
              >
                <ArrowDown size={16} strokeWidth={1.75} color={COLORS.obsidian} />
              </Pressable>
            ) : null}
          </View>

          {/* Lỗi + hành động: khối giấy kẻ trái như thông báo lỗi của web */}
          {error ? (
            <View
              accessibilityRole="alert"
              className="mb-md gap-xs border-l-2 border-danger bg-ivory px-lg py-sm"
            >
              <Text className="font-sans text-body-sm leading-relaxed text-landing-obsidian">
                {error.message}
              </Text>
              {error.action === 'subscription' ? (
                <Pressable
                  accessibilityRole="button"
                  className="min-h-11 self-start justify-center active:opacity-70"
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                >
                  <Text className={`${ACTION_LABEL} text-oxblood`}>Xem gói hội viên</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  className="min-h-11 self-start justify-center active:opacity-70"
                  onPress={handleRetry}
                >
                  <Text className={`${ACTION_LABEL} text-oxblood`}>Thử lại</Text>
                </Pressable>
              )}
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

          {/* Composer sticky đáy; sản phẩm đính kèm nằm trong khung như ChatInput của web */}
          <View className="pb-md">
            <ChatComposer
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={stop}
              attachment={
                attachedProduct ? (
                  <View className="mb-sm flex-row items-center gap-sm rounded-subtle border border-landing-line bg-landing-paper pl-md">
                    <Text
                      className="flex-1 font-sans text-[12px] text-landing-obsidian"
                      numberOfLines={1}
                    >
                      Đang tư vấn:{' '}
                      <Text className="font-semibold text-oxblood">{attachedProduct.name}</Text>
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      className="h-11 w-11 items-center justify-center active:opacity-60"
                      accessibilityLabel="Bỏ đính kèm sản phẩm"
                      onPress={() => setAttachedProduct(null)}
                    >
                      <X size={14} strokeWidth={1.75} color={COLORS.muted} />
                    </Pressable>
                  </View>
                ) : null
              }
            />
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

      <QuotaExhaustedModal
        visible={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        actionName="AI Chatbot"
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
