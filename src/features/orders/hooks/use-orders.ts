import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import type { ICreateOrderIssuePayload } from '../types/order';

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

export function useOrderIssues(orderId: string | number) {
  const query = useQuery({
    queryKey: ['orderIssues', orderId],
    queryFn: ({ signal }) => ordersApi.getOrderIssues(orderId, { signal }),
    enabled: !!orderId,
  });

  return {
    issues: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export const MY_RETURNS_KEY = ['myReturns'] as const;
const MY_RETURNS_PAGE_SIZE = 10;

/** Đơn có đổi trả của tôi, tải thêm từng trang khi cuộn. */
export function useMyReturns() {
  const query = useInfiniteQuery({
    queryKey: MY_RETURNS_KEY,
    queryFn: ({ pageParam, signal }) =>
      ordersApi.getMyReturns({ page: pageParam, limit: MY_RETURNS_PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
  });

  return {
    orders: query.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    total: query.data?.pages[0]?.meta?.total,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useCreateOrderIssue() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ICreateOrderIssuePayload) => ordersApi.createOrderIssue(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orderIssues', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: MY_RETURNS_KEY });
    },
  });

  return {
    createOrderIssue: mutation.mutate,
    createOrderIssueAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}

