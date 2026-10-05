import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export interface CheckoutPayload {
  orderId: string | number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export const paymentsApi = {
  checkout: (payload: CheckoutPayload, opts?: HttpOptions): Promise<CheckoutResponse> => {
    return http.post<CheckoutResponse>(ENDPOINTS.PAYMENTS.CHECKOUT, payload, opts);
  }
};
