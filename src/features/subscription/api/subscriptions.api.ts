import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  PlanItem,
  MySubscriptionResponse,
  SubscriptionHistoryItem,
  SubscriptionHistoryResponse,
  CheckoutResponse,
  SubscriptionDetail,
} from '../types/subscription';

export const subscriptionsApi = {
  /** Lấy danh sách gói và giá từ backend */
  getPlans(opts?: HttpOptions): Promise<PlanItem[]> {
    return http.get<PlanItem[]>(ENDPOINTS.PAYMENTS.PLANS, opts);
  },

  /** Lấy thông tin gói đăng ký hiện tại của user */
  getMySubscription(opts?: HttpOptions): Promise<MySubscriptionResponse> {
    return http.get<MySubscriptionResponse>(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_ME, opts);
  },

  /** Lấy lịch sử đăng ký / gia hạn gói */
  async getSubscriptionHistory(
    page: number = 1,
    limit: number = 20,
    opts?: HttpOptions,
  ): Promise<SubscriptionHistoryResponse> {
    const res = await http.getPaged<SubscriptionHistoryItem[]>(
      ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_HISTORY,
      {
        ...opts,
        params: { page, limit, ...opts?.params },
      },
    );

    const meta = res.meta as any;
    return {
      items: res.data || [],
      meta: {
        total: meta?.total ?? res.data?.length ?? 0,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
        totalPages: meta?.totalPages ?? 1,
      },
    };
  },

  /** Tắt tự động gia hạn cho gói cước hiện tại */
  cancelAutoRenew(opts?: HttpOptions): Promise<SubscriptionDetail> {
    return http.post<SubscriptionDetail>(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_CANCEL, undefined, opts);
  },

  /** Bật lại tự động gia hạn cho gói cước hiện tại */
  resumeAutoRenew(opts?: HttpOptions): Promise<SubscriptionDetail> {
    return http.post<SubscriptionDetail>(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_RESUME, undefined, opts);
  },

  /** Hủy lịch chuyển gói (SCHEDULED) */
  cancelScheduled(opts?: HttpOptions): Promise<{ message?: string; success?: boolean }> {
    return http.post<{ message?: string; success?: boolean }>(
      ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_SCHEDULED_CANCEL,
      undefined,
      opts,
    );
  },

  /** Khởi tạo liên kết thanh toán SePay / ZaloPay để mua/nâng cấp gói */
  checkout(
    payload: { targetTier: 'MEMBER' | 'VIP'; provider?: string },
    opts?: HttpOptions,
  ): Promise<CheckoutResponse> {
    return http.post<CheckoutResponse>(ENDPOINTS.PAYMENTS.CHECKOUT, payload, opts);
  },
};
