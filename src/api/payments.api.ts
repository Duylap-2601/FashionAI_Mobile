import { api } from './client';
import { ENDPOINTS } from '@/constants/endpoints';

export interface CheckoutPayload {
  orderId: string | number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export const paymentsApi = {
  checkout: async (payload: CheckoutPayload) => {
    const response = await api.post<{ data: CheckoutResponse }>(ENDPOINTS.PAYMENTS.CHECKOUT, payload);
    return response.data.data;
  }
};
