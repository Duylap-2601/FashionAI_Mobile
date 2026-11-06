import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { isPaginationMeta, type ApiPaginationMeta } from '@/types/api';
import type { ICreateOrderIssuePayload, IMyReturnOrder, IOrderIssue } from '../types/order';

export interface IOrderShippingInfo {
  name: string;
  phone: string;
  address: string;
  provinceName?: string;
  wardName?: string;
  note?: string;
  notes?: string;
  ghnProvinceV3Id?: string;
  ghnWardV3Id?: string;
}

export interface OrderQuotePayload {
  items: {
    productId: string | number;
    color?: string;
    quantity: number;
    price?: number;
  }[];
  shippingAddressId?: string;
  addressVersion?: number;
  shippingInfo?: IOrderShippingInfo;
  shippingNote?: string;
  couponCode?: string;
  paymentMethod?: string;
}

export interface OrderCreatePayload extends OrderQuotePayload {
  quoteToken?: string;
  totalAmount?: number;
  idempotencyKey?: string;
}

export interface OrderQuoteResponse {
  /** Tiền hàng sau khi áp chương trình sale (giá sale × số lượng). */
  itemsTotal: number;
  /** Tiền hàng theo giá niêm yết (giá gốc × số lượng); lớn hơn `itemsTotal` khi có sale. */
  listItemsTotal?: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  quoteToken: string;
  expiresAt?: string;
  shippingQuote?: Record<string, unknown>;
}

export interface ICreateOrderResponse {
  id: string;
  orderCode?: string;
  totalAmount?: number;
  [key: string]: unknown;
}

export interface OrdersListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/** Số đơn chưa thanh toán tối đa mà checkout nhắc khách (giống web). */
export const UNPAID_ORDERS_LIMIT = 5;

/** Đơn đã tạo nhưng chưa trả tiền: chỉ các trường của `GET /orders` mà checkout cần. */
export interface IUnpaidOrder {
  id: string;
  orderCode: number;
  status: string;
  paymentStatus?: string | null;
  /** Tổng tiền đơn (VND). Đơn cũ có thể chưa có, khi đó dùng `amount`. */
  totalVnd?: number | null;
  amount?: number | null;
  /** Hạn thanh toán; quá hạn thì máy chủ tự hủy đơn. */
  paymentDueAt?: string | null;
}

export const ordersApi = {
  quote: (payload: OrderQuotePayload, opts?: HttpOptions): Promise<OrderQuoteResponse> => {
    return http.post<OrderQuoteResponse>(ENDPOINTS.ORDERS.QUOTE, payload, opts);
  },
  
  createOrder: (payload: OrderCreatePayload, opts?: HttpOptions): Promise<ICreateOrderResponse> => {
    return http.post<ICreateOrderResponse>(ENDPOINTS.ORDERS.CREATE, payload, opts);
  },
  
  getOrders: (opts?: HttpOptions): Promise<any[]> => {
    return http.get<any[]>(ENDPOINTS.ORDERS.LIST, opts);
  },
  
  /** Một trang đơn của tôi; BE lọc theo một trạng thái và tìm theo mã đơn / tên sản phẩm. */
  getOrdersPage: async (
    params: OrdersListParams = {},
    opts?: HttpOptions,
  ): Promise<{ data: any[]; meta?: ApiPaginationMeta }> => {
    const res = await http.getPaged<any[]>(ENDPOINTS.ORDERS.LIST, { ...opts, params });
    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: isPaginationMeta(res.meta) ? res.meta : undefined,
    };
  },

  getOrder: (id: string | number, opts?: HttpOptions): Promise<any> => {
    return http.get<any>(ENDPOINTS.ORDERS.DETAIL(id), opts);
  },

  /** Đơn mới tạo (CREATED) còn chờ thanh toán, để checkout nhắc khách trả đơn cũ thay vì đặt trùng. */
  getUnpaidOrders: async (opts?: HttpOptions): Promise<IUnpaidOrder[]> => {
    const orders = await http.get<IUnpaidOrder[]>(ENDPOINTS.ORDERS.LIST, {
      ...opts,
      params: { ...opts?.params, status: 'CREATED', limit: UNPAID_ORDERS_LIMIT },
    });
    if (!Array.isArray(orders)) return [];
    return orders.filter((order) => order.paymentStatus === 'PENDING');
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

  /** Các đơn có yêu cầu đổi trả của tôi, mới cập nhật trước. */
  getMyReturns: async (
    params: { page?: number; limit?: number } = {},
    opts?: HttpOptions,
  ): Promise<{ data: IMyReturnOrder[]; meta?: ApiPaginationMeta }> => {
    const res = await http.getPaged<IMyReturnOrder[]>(ENDPOINTS.ORDERS.MY_RETURNS, { ...opts, params });
    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: isPaginationMeta(res.meta) ? res.meta : undefined,
    };
  },

  getOrderIssues: async (orderId: string | number, opts?: HttpOptions): Promise<any[]> => {
    const res = await http.get<any>(ENDPOINTS.ORDERS.ISSUES(orderId), opts);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  createOrderIssue: (payload: ICreateOrderIssuePayload, opts?: HttpOptions): Promise<IOrderIssue> => {
    const form = new FormData();
    form.append('reason', payload.reason);
    form.append('description', payload.description);
    // BE chỉ nhận hoàn tiền; tài khoản nhận hoàn là bắt buộc (CreateOrderIssueDto).
    form.append('desiredResolution', 'REFUND');
    form.append('bankName', payload.bankName);
    form.append('accountNumber', payload.accountNumber);
    form.append('accountHolder', payload.accountHolder);

    payload.evidenceImages.forEach((img) => {
      form.append('evidenceImages', img as unknown as Blob);
    });

    return http.upload<IOrderIssue>(
      ENDPOINTS.ORDERS.REPORT_ISSUE(payload.orderId, payload.orderItemId),
      form,
      { ...opts, timeout: opts?.timeout ?? 30000 }
    );
  },
};

