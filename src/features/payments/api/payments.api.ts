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
  paymentId?: string;
}

export interface PaymentStatusResponse {
  id: string;
  status: string;
  provider: string;
  orderId?: string;
  orderCode?: string;
  failureReason?: string;
}

export const paymentsApi = {
  checkout: (payload: CheckoutPayload, opts?: HttpOptions): Promise<CheckoutResponse> => {
    return http.post<CheckoutResponse>(ENDPOINTS.PAYMENTS.CHECKOUT, payload, opts);
  },
  getPaymentStatus: (paymentId: string | number, opts?: HttpOptions): Promise<PaymentStatusResponse> => {
    return http.get<PaymentStatusResponse>(ENDPOINTS.PAYMENTS.STATUS(paymentId), opts);
  },
  getPaymentOrders: (opts?: HttpOptions): Promise<any[]> => {
    return http.get<any[]>(ENDPOINTS.PAYMENTS.ORDERS, opts);
  },
};
