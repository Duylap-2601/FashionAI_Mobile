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
