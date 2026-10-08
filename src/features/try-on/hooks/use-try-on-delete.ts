import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { tryOnQueryKeys } from '@/features/try-on/hooks/try-on-query-keys';

export function useTryOnDelete() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: tryOnQueryKeys.history() });

  const remove = useMutation<void, Error, string>({
    mutationFn: (id) => tryOnApi.remove(id),
    onSuccess: invalidate,
  });

  const removeMany = useMutation<void, Error, string[]>({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => tryOnApi.remove(id)));
    },
    onSuccess: invalidate,
  });

  const removeAll = useMutation<void, Error, void>({
    mutationFn: () => tryOnApi.removeAll(),
    onSuccess: invalidate,
  });

  return { remove, removeMany, removeAll };
}
