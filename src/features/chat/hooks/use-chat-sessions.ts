import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { isCanceledError } from '@/api/http';
import { chatApi } from '@/features/chat/api/chat.api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { chatKeys } from '@/features/chat/hooks/chat-keys';
import {
  removeSessionFromPages,
  SessionPages,
} from '@/features/chat/utils/chat-session-pages';

const PAGE_LIMIT = 20;

export function useChatSessions(limit: number = PAGE_LIMIT) {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: chatKeys.sessions(),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await chatApi.listSessions(pageParam as number, limit, { signal });
      } catch (error) {
        if (isCanceledError(error)) {
          return {
            data: [],
            meta: { total: 0, page: 1, limit, totalPages: 0 },
          };
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.meta.page < lastPage.meta.totalPages ? allPages.length + 1 : undefined,
    enabled: isAuthenticated,
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.sessions() });
      const previous = queryClient.getQueriesData<SessionPages>({
        queryKey: chatKeys.sessions(),
      });
      queryClient.setQueriesData<SessionPages>({ queryKey: chatKeys.sessions() }, (data) =>
        removeSessionFromPages(data, sessionId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
    },
  });
}
