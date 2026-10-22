export enum EOrderStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum EPaymentMethod {
  SEPAY = 'SEPAY',
  ZALOPAY = 'ZALOPAY',
  WALLET = 'WALLET',
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  note?: string;
}

export interface IOrderItem {
  id?: string | number;
  productId: string | number;
  productName: string;
  variantId?: string | number;
  size?: string;
  color?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrder {
  id: string | number;
  orderNumber: string;
  userId: string;
  status: EOrderStatus;
  paymentMethod: EPaymentMethod;
  isPaid: boolean;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  trackingCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IOrderQuote {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export type OrderIssueReason = 'WRONG_SIZE' | 'WRONG_COLOR' | 'QUALITY_MISMATCH' | 'OTHER';
export type OrderIssueDesiredResolution = 'REFUND' | 'EXCHANGE';
export type OrderIssueStatus = 'PENDING' | 'APPROVED' | 'RESOLVED' | 'REJECTED';

export interface IOrderIssue {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  reason: OrderIssueReason;
  description: string;
  desiredResolution: OrderIssueDesiredResolution;
  approvedResolution?: OrderIssueDesiredResolution | null;
  evidenceImages?: string[];
  status: OrderIssueStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
  orderItem?: {
    id: string;
    productId: string;
    quantity: number;
    color?: string | null;
    productNameSnapshot?: string | null;
    productImageSnapshot?: string | null;
  };
}

export interface ICreateOrderIssuePayload {
  orderId: string | number;
  orderItemId: string | number;
  reason: OrderIssueReason;
  description: string;
  desiredResolution: OrderIssueDesiredResolution;
  evidenceImages?: Array<{ uri: string; name: string; type: string }>;
}

