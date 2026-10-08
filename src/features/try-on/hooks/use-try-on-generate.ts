import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { TryOnGenerateRequest, TryOnResult } from '@/features/try-on/types/try-on';
import { tryOnQueryKeys } from '@/features/try-on/hooks/try-on-query-keys';

export function useTryOnGenerate() {
  const queryClient = useQueryClient();

  return useMutation<TryOnResult, Error, TryOnGenerateRequest & { onProgress?: (percent: number) => void }>({
    mutationFn: ({ onProgress, ...payload }) =>
      tryOnApi.generate(payload, onProgress ? { onProgress } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tryOnQueryKeys.history() });
    },
  });
}
