import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  clearRack,
  getRackItems,
  pinProductToRack,
  removeRackItem,
} from '../api/rack.api';
import { rackKeys } from '../api/rack.keys';

export function useRackItems() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: rackKeys.list(),
    queryFn: ({ signal }) => getRackItems({ signal }),
    enabled: isAuthenticated,
  });
}

function useInvalidateRack() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: rackKeys.list() });
}

export function usePinProductToRack() {
  const invalidateRack = useInvalidateRack();
  return useMutation({
    mutationFn: (productId: string) => pinProductToRack(productId),
    onSuccess: invalidateRack,
  });
}

export function useRemoveRackItem() {
  const invalidateRack = useInvalidateRack();
  return useMutation({
    mutationFn: (rackItemId: string) => removeRackItem(rackItemId),
    onSuccess: invalidateRack,
  });
}

export function useClearRack() {
  const invalidateRack = useInvalidateRack();
  return useMutation({
    mutationFn: clearRack,
    onSuccess: invalidateRack,
  });
}
