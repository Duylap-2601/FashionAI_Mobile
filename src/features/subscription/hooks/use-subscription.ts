import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions.api';
import { DEFAULT_PLANS } from '../constants/plans';
import { PlanCardData, TargetTier } from '../types/subscription';

export const SUBSCRIPTION_QUERY_KEYS = {
  plans: ['subscription-plans'] as const,
  mySubscription: ['my-subscription'] as const,
  history: (page: number, limit: number) => ['subscription-history', page, limit] as const,
};

/** Lấy danh sách gói cước (kết hợp dữ liệu BE với chi tiết quyền lợi UI) */
export function useSubscriptionPlans() {
  const query = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.plans,
    queryFn: ({ signal }) => subscriptionsApi.getPlans({ signal }),
    staleTime: 5 * 60 * 1000,
  });

  const mergedPlans: PlanCardData[] = DEFAULT_PLANS.map((defaultPlan) => {
    const apiPlan = query.data?.find((p) => p.tier === defaultPlan.id);
    if (apiPlan && typeof apiPlan.price === 'number') {
      return {
        ...defaultPlan,
        numericPrice: apiPlan.price,
        priceText: apiPlan.price === 0 ? '0đ' : `${apiPlan.price.toLocaleString('vi-VN')}đ`,
      };
    }
    return defaultPlan;
  });

  return {
    plans: mergedPlans,
    rawPlans: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Lấy gói cước hiện tại của user */
export function useMySubscription() {
  const query = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
    queryFn: ({ signal }) => subscriptionsApi.getMySubscription({ signal }),
  });

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Lấy lịch sử giao dịch gói cước */
export function useSubscriptionHistory(page: number = 1, limit: number = 20) {
  const query = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.history(page, limit),
    queryFn: ({ signal }) => subscriptionsApi.getSubscriptionHistory(page, limit, { signal }),
  });

  return {
    history: query.data?.items || [],
    meta: query.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Tắt tự động gia hạn */
export function useCancelAutoRenew() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => subscriptionsApi.cancelAutoRenew(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription });
      queryClient.invalidateQueries({ queryKey: ['users-me'] });
    },
  });

  return {
    cancelAutoRenew: mutation.mutate,
    cancelAutoRenewAsync: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}

/** Bật lại tự động gia hạn */
export function useResumeAutoRenew() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => subscriptionsApi.resumeAutoRenew(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription });
      queryClient.invalidateQueries({ queryKey: ['users-me'] });
    },
  });

  return {
    resumeAutoRenew: mutation.mutate,
    resumeAutoRenewAsync: mutation.mutateAsync,
    isResuming: mutation.isPending,
  };
}

/** Hủy lịch chuyển gói hẹn trước (SCHEDULED) */
export function useCancelScheduledSubscription() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => subscriptionsApi.cancelScheduled(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription });
    },
  });

  return {
    cancelScheduled: mutation.mutate,
    cancelScheduledAsync: mutation.mutateAsync,
    isCancellingScheduled: mutation.isPending,
  };
}

/** Nâng cấp / gia hạn gói qua SePay */
export function useUpgradeSubscription() {
  const mutation = useMutation({
    mutationFn: ({
      targetTier,
      provider = 'SEPAY',
    }: {
      targetTier: 'MEMBER' | 'VIP';
      provider?: string;
    }) => subscriptionsApi.checkout({ targetTier, provider }),
  });

  return {
    checkout: mutation.mutate,
    checkoutAsync: mutation.mutateAsync,
    isCheckingOut: mutation.isPending,
  };
}
