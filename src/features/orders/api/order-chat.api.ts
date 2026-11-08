import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import type { IEvidenceImage } from '../types/order';
import type { IMyOrderChats, IOrderChatMessage, IOrderChatThread } from '../types/order-chat';

export interface OrderChatThreadParams {
  before?: string;
  limit?: number;
}

export interface SendOrderChatPayload {
  orderId: string | number;
  content?: string;
  clientMessageId?: string;
  images?: IEvidenceImage[];
}

export interface SendOrderChatResponse {
  message: IOrderChatMessage;
  unreadForCustomer: number;
  unreadForAdmin: number;
}

export const orderChatApi = {
  getThread: (
    orderId: string | number,
    params: OrderChatThreadParams = {},
    opts?: HttpOptions,
  ): Promise<IOrderChatThread> =>
    http.get<IOrderChatThread>(ENDPOINTS.ORDERS.CHAT_THREAD(orderId), { ...opts, params }),

  sendMessage: (payload: SendOrderChatPayload, opts?: HttpOptions): Promise<SendOrderChatResponse> => {
    const form = new FormData();
    if (payload.content) form.append('content', payload.content);
    if (payload.clientMessageId) form.append('clientMessageId', payload.clientMessageId);
    payload.images?.forEach((img) => form.append('images', img as unknown as Blob));

    return http.upload<SendOrderChatResponse>(
      ENDPOINTS.ORDERS.CHAT_MESSAGES(payload.orderId),
      form,
      { ...opts, timeout: opts?.timeout ?? 30000 },
    );
  },

  markRead: (orderId: string | number, upToMessageId?: string, opts?: HttpOptions): Promise<any> =>
    http.post<any>(
      ENDPOINTS.ORDERS.CHAT_READ(orderId),
      upToMessageId ? { upToMessageId } : {},
      opts,
    ),

  getMine: (opts?: HttpOptions): Promise<IMyOrderChats> =>
    http.get<IMyOrderChats>(ENDPOINTS.ORDER_CHATS.MINE, opts),
};
