import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isCanceledError } from '@/api/http';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import type { NotificationListResult } from '@/features/notifications/api/notifications.api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { notificationKeys } from '@/features/notifications/hooks/notification-keys';

const PAGE_LIMIT = 20;

type NotificationPages = InfiniteData<NotificationListResult>;

function markItemRead(
  data: NotificationPages | undefined,
  id: string,
): NotificationPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((item) =>
        String(item.id) === String(id) && !item.isRead
          ? { ...item, isRead: true }
          : item,
      ),
      meta: {
        ...page.meta,
        unread: Math.max(
          0,
          page.meta.unread -
            (page.data.some(
              (item) => String(item.id) === String(id) && !item.isRead,
            )
              ? 1
              : 0),
        ),
      },
    })),
  };
}

function markAllPagesRead(
  data: NotificationPages | undefined,
): NotificationPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((item) =>
        item.isRead ? item : { ...item, isRead: true },
      ),
      meta: { ...page.meta, unread: 0 },
    })),
  };
}

export function useNotifications(limit: number = PAGE_LIMIT) {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: notificationKeys.lists(),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await notificationsApi.list(pageParam as number, limit, {
          signal,
        });
      } catch (error) {
        if (isCanceledError(error)) {
          return {
            data: [],
            meta: { total: 0, unread: 0, page: 1, limit, totalPages: 0 },
          };
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? allPages.length + 1
        : undefined,
    enabled: isAuthenticated,
  });
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationsApi.unreadCount({ signal }),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previousLists = queryClient.getQueriesData<NotificationPages>({
        queryKey: notificationKeys.lists(),
      });
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.lists() },
        (data) => markItemRead(data, id),
      );
      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previousLists = queryClient.getQueriesData<NotificationPages>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<{ unread: number }>(
        notificationKeys.unreadCount(),
      );
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.lists() },
        markAllPagesRead,
      );
      queryClient.setQueryData<{ unread: number }>(
        notificationKeys.unreadCount(),
        { unread: 0 },
      );
      return { previousLists, previousCount };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
