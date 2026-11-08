import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getMainSocket } from '@/realtime/socket';
import { orderChatApi, type SendOrderChatPayload } from '../api/order-chat.api';
import type { IOrderChatThread } from '../types/order-chat';
import { orderChatKeys } from './order-chat-keys';

const CHAT_PAGE_SIZE = 20;
const CHAT_POLL_MS = 5_000;
const CHAT_LIST_POLL_MS = 15_000;

function isAppActive(): boolean {
  const state = AppState.currentState;
  return state !== 'background' && state !== 'inactive';
}

export function useOrderChat(orderId: string | number) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: orderChatKeys.thread(orderId),
    queryFn: ({ pageParam, signal }) =>
      orderChatApi.getThread(
        orderId,
        pageParam ? { before: pageParam, limit: CHAT_PAGE_SIZE } : { limit: CHAT_PAGE_SIZE },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!orderId,
    // Socket là đường chính; polling chỉ chống trễ khi socket rớt, và dừng khi app nền.
    refetchInterval: () => (isAppActive() ? CHAT_POLL_MS : false),
    refetchOnReconnect: true,
  });

  const messages = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages);
  }, [query.data]);

  const sendMutation = useMutation({
    mutationFn: (payload: SendOrderChatPayload) => orderChatApi.sendMessage(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<InfiniteData<IOrderChatThread, string | undefined>>(
        orderChatKeys.thread(orderId),
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const first = current.pages[0];
          if (first.messages.some((message) => message.id === data.message.id)) return current;

          const pages = [...current.pages];
          pages[0] = {
            ...first,
            messages: [...first.messages, data.message],
            unreadForCustomer: data.unreadForCustomer,
            unreadForAdmin: data.unreadForAdmin,
          };
          return { ...current, pages };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['orders', String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: orderChatKeys.mine() });
    },
  });

  const readMutation = useMutation({
    mutationFn: (upToMessageId?: string) => orderChatApi.markRead(orderId, upToMessageId),
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<IOrderChatThread, string | undefined>>(
        orderChatKeys.thread(orderId),
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const pages = [...current.pages];
          pages[0] = { ...pages[0], unreadForCustomer: 0 };
          return { ...current, pages };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['orders', String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: orderChatKeys.mine() });
    },
  });

  const latestPage = query.data?.pages[0];

  return {
    messages,
    unread: latestPage?.unreadForCustomer ?? 0,
    isLocked: latestPage?.locked ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    sendMessage: sendMutation.mutate,
    sendMessageAsync: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    markRead: readMutation.mutate,
  };
}

export function useMyOrderChats() {
  const query = useQuery({
    queryKey: orderChatKeys.mine(),
    queryFn: ({ signal }) => orderChatApi.getMine({ signal }),
    refetchInterval: () => (isAppActive() ? CHAT_LIST_POLL_MS : false),
    refetchOnReconnect: true,
  });

  const threads = query.data?.threads ?? [];

  return {
    threads,
    orders: query.data?.orders ?? [],
    totalUnread: threads.reduce((sum, thread) => sum + (thread.unread || 0), 0),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useOrderChatRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    const invalidate = (payload?: { orderId?: string }) => {
      if (!payload?.orderId) return;
      const orderId = String(payload.orderId);
      queryClient.invalidateQueries({ queryKey: orderChatKeys.thread(orderId) });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: orderChatKeys.mine() });
    };

    void getMainSocket().then((mainSocket) => {
      if (cancelled) return;
      socket = mainSocket;
      mainSocket.on('order_chat:message', invalidate);
      mainSocket.on('order_chat:read', invalidate);
    });

    return () => {
      cancelled = true;
      socket?.off('order_chat:message', invalidate);
      socket?.off('order_chat:read', invalidate);
    };
  }, [queryClient]);
}
