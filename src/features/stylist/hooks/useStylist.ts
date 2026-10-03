import { useEffect, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isCanceledError } from '@/api/http';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  analyzeStylist,
  deleteStylistHistoryItem,
  getStylistHistory,
  getStylistHistoryItem,
} from '../api/stylist.api';
import { stylistKeys } from '../api/stylist.keys';
import type { IStylistAnalyzeInput } from '../types/stylist';

const STYLIST_HISTORY_PAGE_SIZE = 20;

export function useAnalyzeStylist() {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (input: IStylistAnalyzeInput) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setUploadProgress(0);
      return analyzeStylist(input, {
        signal: controller.signal,
        onProgress: setUploadProgress,
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(stylistKeys.detail(result.id), result);
      return queryClient.invalidateQueries({ queryKey: stylistKeys.histories() });
    },
    onSettled: () => {
      controllerRef.current = null;
    },
  });

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  return {
    ...mutation,
    uploadProgress,
    cancel: () => controllerRef.current?.abort(),
    error: mutation.error && !isCanceledError(mutation.error) ? mutation.error : null,
  };
}

export function useStylistHistory() {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: stylistKeys.history({ limit: STYLIST_HISTORY_PAGE_SIZE }),
    queryFn: ({ pageParam, signal }) =>
      getStylistHistory(
        { page: pageParam, limit: STYLIST_HISTORY_PAGE_SIZE },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: isAuthenticated,
  });
}

export function useStylistResult(resultId: string) {
  const { isAuthenticated } = useAuth();
  const id = resultId.trim();

  return useQuery({
    queryKey: stylistKeys.detail(id),
    queryFn: ({ signal }) => getStylistHistoryItem(id, { signal }),
    enabled: isAuthenticated && id.length > 0,
  });
}

export function useDeleteStylistHistoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId: string) => deleteStylistHistoryItem(resultId),
    onSuccess: (_result, resultId) => {
      queryClient.removeQueries({ queryKey: stylistKeys.detail(resultId) });
      return queryClient.invalidateQueries({ queryKey: stylistKeys.histories() });
    },
  });
}
