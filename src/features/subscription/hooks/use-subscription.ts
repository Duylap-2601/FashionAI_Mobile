import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions.api';
import { DEFAULT_PLANS, QUOTA_NOT_INCLUDED, QUOTA_ROWS, formatQuota } from '../constants/plans';
import { PlanCardData } from '../types/subscription';

function formatPlanPrice(price: number): string {
  return price === 0 ? '0đ' : `${price.toLocaleString('vi-VN')}đ`;
}

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

  // Giá, thời hạn và lượt lấy từ API như trang Gói thành viên của web; DEFAULT_PLANS chỉ dự phòng khi API lỗi.
  const mergedPlans: PlanCardData[] = DEFAULT_PLANS.map((defaultPlan) => {
    const apiPlan = query.data?.find((p) => p.tier === defaultPlan.id);
    if (!apiPlan || typeof apiPlan.price !== 'number') return defaultPlan;

    const quotas = Array.isArray(apiPlan.quotas) ? apiPlan.quotas : [];
    const features = [
      ...QUOTA_ROWS.map((row) => {
        const value = formatQuota(
          quotas.find((quota) => quota.action === row.action),
          row.unit,
        );
        return {
          text: `${row.label}: ${value.toLowerCase()}`,
          highlight: defaultPlan.id !== 'FREE' && value !== QUOTA_NOT_INCLUDED,
        };
      }),
      ...(defaultPlan.id === 'FREE'
        ? []
        : [{ text: 'Phối bộ khi thử đồ, mỗi món 1 lượt', highlight: false }]),
      { text: 'Lưu số đo và đặt may theo số đo', highlight: false },
    ];
    const name = apiPlan.label || defaultPlan.name;

    return {
      ...defaultPlan,
      name,
      numericPrice: apiPlan.price,
      priceText: formatPlanPrice(apiPlan.price),
      periodText:
        apiPlan.durationDays > 0 ? `/ ${apiPlan.durationDays} ngày` : 'không thời hạn',
      features,
      ctaText: `Chọn ${name}`,
      quotas,
    };
  });

  return {
    plans: mergedPlans,
    hasApiPlans: mergedPlans.every((plan) => plan.quotas !== undefined),
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
