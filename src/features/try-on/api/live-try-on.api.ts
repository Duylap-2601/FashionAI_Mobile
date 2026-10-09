import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { LiveGarmentCheck, LiveQuota, LiveSession } from '@/features/try-on/types/live-try-on';

export const liveTryOnApi = {
  getQuota(opts?: HttpOptions): Promise<LiveQuota> {
    return http.get<LiveQuota>(ENDPOINTS.LIVE_TRY_ON.QUOTA, opts);
  },

  checkGarment(productId: string, opts?: HttpOptions): Promise<LiveGarmentCheck> {
    return http.get<LiveGarmentCheck>(ENDPOINTS.LIVE_TRY_ON.GARMENT_CHECK(productId), opts);
  },

  createSession(
    productId: string,
    idempotencyKey: string,
    opts?: HttpOptions,
  ): Promise<LiveSession> {
    return http.post<LiveSession>(
      ENDPOINTS.LIVE_TRY_ON.CREATE_SESSION,
      { productId },
      { ...opts, headers: { ...opts?.headers, 'Idempotency-Key': idempotencyKey } },
    );
  },

  getSession(id: string, opts?: HttpOptions): Promise<LiveSession> {
    return http.get<LiveSession>(ENDPOINTS.LIVE_TRY_ON.GET_SESSION(id), opts);
  },

  pause(id: string, reason: string, opts?: HttpOptions): Promise<LiveSession> {
    return http.post<LiveSession>(ENDPOINTS.LIVE_TRY_ON.PAUSE(id), { reason }, opts);
  },

  resume(id: string, productId?: string, opts?: HttpOptions): Promise<LiveSession> {
    return http.post<LiveSession>(
      ENDPOINTS.LIVE_TRY_ON.RESUME(id),
      productId ? { productId } : {},
      opts,
    );
  },

  end(id: string, reason: string, opts?: HttpOptions): Promise<LiveSession> {
    return http.post<LiveSession>(ENDPOINTS.LIVE_TRY_ON.END(id), { reason }, opts);
  },
};
