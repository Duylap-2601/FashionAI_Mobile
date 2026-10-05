import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export interface CheckoutPayload {
  orderId: string | number;
  provider?: string;
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  payUrl?: string;
  qrCode?: string;
  orderCode?: string;
}

export const paymentsApi = {
  checkout: (payload: CheckoutPayload, opts?: HttpOptions): Promise<CheckoutResponse> => {
    return http.post<CheckoutResponse>(ENDPOINTS.PAYMENTS.CHECKOUT, payload, opts);
  }
};
