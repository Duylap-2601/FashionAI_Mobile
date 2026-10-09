import { useInfiniteQuery } from '@tanstack/react-query';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { isCanceledError } from '@/api/http';
import { TryOnResult } from '@/features/try-on/types/try-on';
import { tryOnQueryKeys } from '@/features/try-on/hooks/try-on-query-keys';

const PAGE_LIMIT = 20;

export function useTryOnHistory(limit: number = PAGE_LIMIT) {
  return useInfiniteQuery<TryOnResult[], Error>({
    queryKey: tryOnQueryKeys.history(limit),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await tryOnApi.getHistory(pageParam as number, limit, { signal });
      } catch (error) {
        if (isCanceledError(error)) return [];
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === limit ? allPages.length + 1 : undefined,
  });
}
