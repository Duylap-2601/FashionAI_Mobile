import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { ordersApi } from '../api/orders.api';
import type { ICreateOrderIssuePayload, IDeliveryDisputePayload } from '../types/order';

const TERMINAL_ORDER_STATUSES = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED'];
const ORDER_DETAIL_REFETCH_MS = 30_000;

function isAppActive(): boolean {
  const state = AppState.currentState;
  return state !== 'background' && state !== 'inactive';
}

function normalizeOrderId(id: string | number): string {
  return String(id);
}

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

const ORDERS_PAGE_SIZE = 20;

/** Đơn của tôi theo tab trạng thái + từ khóa, tải thêm từng trang khi cuộn (như web). */
export function useInfiniteOrders(filters: { status?: string; search?: string }) {
  const query = useInfiniteQuery({
    // Nằm dưới ['orders'] nên hủy đơn / nhận hàng / thông báo realtime đều làm mới danh sách.
    queryKey: ['orders', 'list', filters],
    queryFn: ({ pageParam, signal }) =>
      ordersApi.getOrdersPage({ ...filters, page: pageParam, limit: ORDERS_PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
  });

  return {
    orders: query.data?.pages.flatMap((page) => page.data) ?? [],
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

export function useOrder(id: string | number) {
  const orderId = normalizeOrderId(id);
  const query = useQuery({
    queryKey: ['orders', orderId],
    queryFn: ({ signal }) => ordersApi.getOrder(orderId, { signal }),
    enabled: !!id,
    // Đơn đang xử lý cần tự cập nhật: trạng thái thanh toán, vận chuyển, hoàn tiền.
    refetchInterval: (query) => {
      const status = String(query.state.data?.status ?? '').toUpperCase();
      if (TERMINAL_ORDER_STATUSES.includes(status) || !isAppActive()) return false;
      return ORDER_DETAIL_REFETCH_MS;
    },
    refetchOnReconnect: true,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

/**
 * Đơn đã tạo nhưng chưa thanh toán, để checkout nhắc khách trả đơn cũ thay vì đặt thêm đơn trùng.
 * Khoá nằm dưới `['orders']` nên tạo/hủy đơn (invalidate `['orders']`) cũng làm mới danh sách này.
 */
export function useUnpaidOrders() {
  const query = useQuery({
    queryKey: ['orders', 'unpaid'],
    queryFn: ({ signal }) => ordersApi.getUnpaidOrders({ signal }),
  });

  return {
    unpaidOrders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
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
  const normalizedOrderId = normalizeOrderId(orderId);
  const query = useQuery({
    queryKey: ['orderIssues', normalizedOrderId],
    queryFn: ({ signal }) => ordersApi.getOrderIssues(normalizedOrderId, {}, { signal }),
    enabled: !!orderId,
  });

  return {
    issues: query.data?.data ?? [],
    meta: query.data?.meta,
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
      const orderId = normalizeOrderId(variables.orderId);
      queryClient.invalidateQueries({ queryKey: ['orderIssues', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
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

export function useConfirmRefundReceived() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderId: string | number) => ordersApi.confirmRefundReceived(orderId),
    onSuccess: (_, orderId) => {
      const normalizedOrderId = normalizeOrderId(orderId);
      queryClient.invalidateQueries({ queryKey: ['orders', normalizedOrderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: MY_RETURNS_KEY });
    },
  });

  return {
    confirmRefundReceived: mutation.mutate,
    isConfirmingRefund: mutation.isPending,
  };
}

export function useCreateDeliveryDispute() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: IDeliveryDisputePayload) => ordersApi.createDeliveryDispute(payload),
    onSuccess: (_, variables) => {
      const orderId = normalizeOrderId(variables.orderId);
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    createDeliveryDispute: mutation.mutate,
    createDeliveryDisputeAsync: mutation.mutateAsync,
    isCreatingDeliveryDispute: mutation.isPending,
  };
}

export function useUpdateItemMeasurement() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      orderId,
      itemId,
      measurementSnapshot,
      syncToProfile,
    }: {
      orderId: string | number;
      itemId: string | number;
      measurementSnapshot: Record<string, number | null>;
      syncToProfile?: boolean;
    }) =>
      ordersApi.updateMeasurement(orderId, itemId, { measurementSnapshot, syncToProfile }),
    onSuccess: (_, variables) => {
      const orderId = normalizeOrderId(variables.orderId);
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'measurements'] });
    },
  });

  return {
    updateItemMeasurement: mutation.mutate,
    isUpdatingMeasurement: mutation.isPending,
  };
}
