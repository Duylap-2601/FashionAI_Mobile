export type OrderChatSenderRole = 'CUSTOMER' | 'ADMIN';

export interface IOrderChatMessage {
  id: string;
  senderId?: string | null;
  senderRole: OrderChatSenderRole;
  senderName?: string | null;
  senderAvatarUrl?: string | null;
  content: string;
  attachments: string[];
  clientMessageId?: string | null;
  readByCustomerAt?: string | null;
  readByAdminAt?: string | null;
  createdAt: string;
}

export interface IOrderChatThread {
  messages: IOrderChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadForCustomer: number;
  unreadForAdmin: number;
  locked?: boolean;
}

export interface IOrderChatThreadSummary {
  orderId: string;
  orderCode: number;
  orderStatus: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
}

export interface IMyOrderChats {
  threads: IOrderChatThreadSummary[];
  orders: { orderId: string; orderCode: number; status: string }[];
}
