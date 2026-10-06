import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { IOrder } from '../types/order';
import { isCanceledError } from '@/api/http';

export function useOrders() {
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: ({ signal }) => ordersApi.getOrders({ signal }),
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useOrder(id: string | number) {
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: ({ signal }) => ordersApi.getOrder(id, { signal }),
    enabled: !!id,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (id: string | number) => ordersApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    cancelOrder: mutation.mutate,
    cancelOrderAsync: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ id, note }: { id: string | number; note?: string }) => ordersApi.confirmDelivery(id, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    confirmDelivery: mutation.mutate,
    confirmDeliveryAsync: mutation.mutateAsync,
    isConfirmingDelivery: mutation.isPending,
  };
}
