import type { ApiPaginationMeta } from '@/types/api';

export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'SYSTEM'
  | 'REVIEW';

export interface INotificationData {
  orderId?: string;
  orderCode?: string;
  status?: string;
  reviewId?: string;
  productId?: string;
  replyId?: string;
  type?: string;
  [key: string]: unknown;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: INotificationData | null;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationMeta extends ApiPaginationMeta {
  unread: number;
}
