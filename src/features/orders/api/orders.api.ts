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
  },
  
  getOrders: (opts?: HttpOptions): Promise<any[]> => {
    return http.get<any[]>(ENDPOINTS.ORDERS.LIST, opts);
  },
  
  getOrder: (id: string | number, opts?: HttpOptions): Promise<any> => {
    return http.get<any>(ENDPOINTS.ORDERS.DETAIL(id), opts);
  },
  
  getTracking: (id: string | number, opts?: HttpOptions): Promise<any> => {
    return http.get<any>(ENDPOINTS.ORDERS.TRACKING(id), opts);
  },
  
  cancelOrder: (id: string | number, opts?: HttpOptions): Promise<any> => {
    return http.patch<any>(ENDPOINTS.ORDERS.CANCEL(id), undefined, opts);
  },
  
  confirmDelivery: (id: string | number, payload?: { note?: string }, opts?: HttpOptions): Promise<any> => {
    return http.post<any>(ENDPOINTS.ORDERS.CONFIRM_DELIVERY(id), payload, opts);
  },

  updateMeasurement: (orderId: string | number, itemId: string | number, data: any, opts?: HttpOptions): Promise<any> => {
    return http.patch<any>(ENDPOINTS.ORDERS.UPDATE_MEASUREMENT(orderId, itemId), data, opts);
  },
};
