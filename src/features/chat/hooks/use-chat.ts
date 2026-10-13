import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/realtime/socket';
import { authApi } from '@/features/auth/api/auth.api';
import { chatApi } from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/chat-keys';
import {
  CHAT_MESSAGE_MAX_LENGTH,
  ChatDonePayload,
  ChatErrorPayload,
  ChatSendPayload,
  ChatTokenPayload,
  IChatContextPayload,
  IChatMessage,
  IChatProductContext,
} from '@/features/chat/types/chat';

export type ChatErrorAction = 'subscription' | null;

interface SendOptions {
  productId?: string;
  product?: IChatProductContext;
  context?: IChatContextPayload;
}

interface ChatErrorState {
  message: string;
  action: ChatErrorAction;
}

type SendOutcome =
  | { status: 'done'; sessionId?: string }
  | { status: 'expired' }
  | { status: 'stopped' }
  | { status: 'failed'; code: string; message: string };

const CONNECT_TIMEOUT_MS = 12_000;
const FIRST_TOKEN_TIMEOUT_MS = 12_000;

function mapChatError(code: string, fallback: string): ChatErrorState {
  switch (code) {
    case 'QUOTA_EXCEEDED':
      return {
        message: 'Bạn đã hết lượt trò chuyện hôm nay. Hạn mức sẽ làm mới vào ngày mai.',
        action: 'subscription',
      };
    case 'SUBSCRIPTION_REQUIRED':
      return {
        message: 'Tính năng trò chuyện AI cần gói hội viên. Nâng cấp để tiếp tục.',
        action: 'subscription',
      };
    case 'BUSY':
      return {
        message: 'AI đang trả lời tin trước. Vui lòng đợi chút rồi gửi lại.',
        action: null,
      };
    case 'STREAM_ERROR':
      return {
        message: 'AI trả lời dở dang do sự cố. Gửi lại tin này không mất thêm lượt.',
        action: null,
      };
    case 'TOKEN_EXPIRED':
    case 'UNAUTHORIZED':
      return {
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        action: null,
      };
    default:
      return { message: fallback || 'Đã xảy ra lỗi, vui lòng thử lại.', action: null };
  }
}

function waitForConnect(socket: Socket, timeoutMs: number): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      reject(new Error('WS_CONNECT_FAILED'));
    }, timeoutMs);
    const onConnect = () => {
      clearTimeout(timer);
      socket.off('connect_error', onError);
      resolve();
    };
    const onError = () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      reject(new Error('WS_CONNECT_FAILED'));
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
    socket.connect();
  });
}

// Hook WS cho 1 cuộc trò chuyện: optimistic message + stream token từng chữ.
// Mỗi thời điểm chỉ 1 request (BE lock theo user, client chặn trùng).
export function useChat(initialSessionId?: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ChatErrorState | null>(null);
  // Tăng mỗi lần chat:done — màn hình dùng để refresh quota hiển thị.
  const [completedCount, setCompletedCount] = useState(0);

  const streamingRef = useRef(false);
  const sessionIdRef = useRef<string | undefined>(initialSessionId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    socket: Socket;
    cleanup: () => void;
    settle: (outcome: SendOutcome) => void;
  } | null>(null);

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const finishAssistant = useCallback((assistantId: string) => {
    setMessages((prev) =>
      prev.map((item) =>
        item.id === assistantId ? { ...item, streaming: false } : item,
      ),
    );
  }, []);

  const stop = useCallback(() => {
    streamingRef.current = false;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) {
      pending.cleanup();
      pending.settle({ status: 'stopped' });
    }
    setIsStreaming(false);
    setMessages((prev) => prev.map((item) => ({ ...item, streaming: false })));
  }, []);

  // Một vòng emit → token → done/error. Không tạo message, chỉ stream.
  const sendOnce = useCallback(
    (
      socket: Socket,
      payload: ChatSendPayload,
      assistantId: string,
    ): Promise<SendOutcome> =>
      new Promise((resolve) => {
        let settled = false;
        const onToken = (event: ChatTokenPayload) => {
          if (!streamingRef.current) return;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          const chunk = event?.data ?? '';
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + chunk } : item,
            ),
          );
        };
        const cleanup = () => {
          socket.off('chat:token', onToken);
          socket.off('chat:done', onDone);
          socket.off('chat:error', onError);
        };
        const settle = (outcome: SendOutcome) => {
          if (settled) return;
          settled = true;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          cleanup();
          if (pendingRef.current?.socket === socket) pendingRef.current = null;
          resolve(outcome);
        };
        const onDone = (event: ChatDonePayload) => {
          settle({ status: 'done', sessionId: event?.sessionId });
        };
        const onError = (event: ChatErrorPayload) => {
          const code = event?.code ?? 'ERROR';
          if (code === 'TOKEN_EXPIRED') {
            settle({ status: 'expired' });
          } else {
            settle({ status: 'failed', code, message: event?.message ?? '' });
          }
        };
        pendingRef.current = { socket, cleanup, settle };
        socket.on('chat:token', onToken);
        socket.on('chat:done', onDone);
        socket.on('chat:error', onError);
        timerRef.current = setTimeout(() => {
          settle({ status: 'failed', code: 'TIMEOUT', message: '' });
        }, FIRST_TOKEN_TIMEOUT_MS);
        socket.emit('chat:send', payload);
      }),
    [],
  );

  const finalizeDone = useCallback(
    (userId: string, assistantId: string, sessionId?: string) => {
      streamingRef.current = false;
      setIsStreaming(false);
      finishAssistant(assistantId);
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === userId || item.id === assistantId
              ? { ...item, sessionId }
              : item,
          ),
        );
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: chatKeys.quota() });
      setCompletedCount((count) => count + 1);
    },
    [finishAssistant, queryClient],
  );

  const finalizeError = useCallback(
    (assistantId: string, code: string, message: string) => {
      streamingRef.current = false;
      setIsStreaming(false);
      finishAssistant(assistantId);
      setError(mapChatError(code, message));
    },
    [finishAssistant],
  );

  const runSend = useCallback(
    async (text: string, opts: SendOptions): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;
      if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) {
        setError({ message: 'Tin nhắn quá dài. Vui lòng rút gọn lại.', action: null });
        return;
      }

      streamingRef.current = true;
      setIsStreaming(true);
      setError(null);

      const userId = `user_${Date.now()}`;
      const assistantId = `assistant_${Date.now() + 1}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: 'user',
          content: trimmed,
          sessionId: sessionIdRef.current,
          createdAt: new Date().toISOString(),
          productId: opts.productId,
          product: opts.product,
        },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          streaming: true,
          sessionId: sessionIdRef.current,
          createdAt: new Date().toISOString(),
        },
      ]);

      const payload: ChatSendPayload = { message: trimmed };
      if (sessionIdRef.current) payload.sessionId = sessionIdRef.current;
      if (opts.productId) payload.productId = opts.productId;
      if (opts.context) payload.context = opts.context;

      const connectFresh = async (): Promise<Socket | null> => {
        try {
          const socket = await getChatSocket();
          await waitForConnect(socket, CONNECT_TIMEOUT_MS);
          return socket;
        } catch {
          return null;
        }
      };

      const failConnect = () => {
        finalizeError(
          assistantId,
          'CONNECT',
          'Không kết nối được với trợ lý AI. Vui lòng kiểm tra mạng và thử lại.',
        );
      };

      const firstSocket = await connectFresh();
      if (!streamingRef.current) return;
      if (!firstSocket) {
        failConnect();
        return;
      }
      const first = await sendOnce(firstSocket, payload, assistantId);
      if (first.status === 'done') {
        finalizeDone(userId, assistantId, first.sessionId);
        return;
      }
      if (first.status === 'stopped' || !streamingRef.current) return;

      if (first.status === 'expired') {
        // Token của socket cũ đã hết hạn: kéo 1 request HTTP để interceptor xoay
        // token (BE /chat không có auth:refresh), nối lại socket rồi gửi lại 1 lần.
        try {
          await authApi.getCurrentUser();
          const stale = await getChatSocket();
          stale.disconnect();
          const fresh = await getChatSocket();
          await waitForConnect(fresh, CONNECT_TIMEOUT_MS);
          if (!streamingRef.current) return;
          const second = await sendOnce(fresh, payload, assistantId);
          if (second.status === 'done') {
            finalizeDone(userId, assistantId, second.sessionId);
            return;
          }
          if (second.status === 'stopped' || !streamingRef.current) return;
          if (second.status === 'expired') {
            finalizeError(assistantId, 'TOKEN_EXPIRED', '');
          } else {
            finalizeError(assistantId, second.code, second.message);
          }
          return;
        } catch {
          finalizeError(assistantId, 'TOKEN_EXPIRED', '');
          return;
        }
      }

      finalizeError(assistantId, first.code, first.message);
    },
    [finalizeDone, finalizeError, sendOnce],
  );

  const sendMessage = useCallback(
    (text: string, opts: SendOptions = {}) => {
      void runSend(text, opts);
    },
    [runSend],
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      stop();
      setError(null);
      const detail = await chatApi.getSession(sessionId);
      setCurrentSessionId(detail.id);
      setMessages(
        (detail.messages ?? []).map((item) => ({
          ...item,
          sessionId: detail.id,
          streaming: false,
        })),
      );
    },
    [stop],
  );

  const newChat = useCallback(() => {
    stop();
    setError(null);
    setCurrentSessionId(undefined);
    setMessages([]);
  }, [stop]);

  return {
    messages,
    currentSessionId,
    isStreaming,
    error,
    completedCount,
    sendMessage,
    stop,
    loadSession,
    newChat,
    setCurrentSessionId,
  };
}
