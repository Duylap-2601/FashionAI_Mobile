import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export interface OrderQuotePayload {
  items: Array<{
    productId: string | number;
    variantId?: string | number;
    color?: string;
    quantity: number;
    price?: number;
  }>;
  shippingInfo?: {
    name: string;
    phone: string;
    address: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    ghnProvinceId?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
    note?: string;
  };
  couponCode?: string;
  paymentMethod?: string;
}

export interface OrderQuoteResponse {
  itemsTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  quoteToken: string;
}

export const ordersApi = {
  quote: (payload: OrderQuotePayload, opts?: HttpOptions): Promise<OrderQuoteResponse> => {
    return http.post<OrderQuoteResponse>(ENDPOINTS.ORDERS.QUOTE, payload, opts);
  },
  
  createOrder: (payload: any, opts?: HttpOptions): Promise<any> => {
    return http.post<any>(ENDPOINTS.ORDERS.CREATE, payload, opts);
  }
};
