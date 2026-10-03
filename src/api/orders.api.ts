import { api } from './client';
import { ENDPOINTS } from '@/constants/endpoints';

export interface OrderQuotePayload {
  items: Array<{
    productId: string | number;
    variantId?: string | number;
    quantity: number;
  }>;
  shippingFee: number;
  discountCode?: string;
}

export interface OrderQuoteResponse {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export const ordersApi = {
  quote: async (payload: OrderQuotePayload) => {
    const response = await api.post<{ data: OrderQuoteResponse }>(ENDPOINTS.ORDERS.QUOTE, payload);
    return response.data.data;
  },
  createOrder: async (payload: any) => {
    const response = await api.post<{ data: any }>(ENDPOINTS.ORDERS.CREATE, payload);
    return response.data.data;
  }
};
