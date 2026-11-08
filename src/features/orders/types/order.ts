export enum EOrderStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELIVERY_DISPUTED = 'DELIVERY_DISPUTED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum EPaymentMethod {
  SEPAY = 'SEPAY',
  ZALOPAY = 'ZALOPAY',
  WALLET = 'WALLET',
}

export interface IShippingAddress {
  fullName?: string;
  name?: string;
  phone: string;
  address: string;
  addressLine?: string;
  provinceName?: string;
  wardName?: string;
  ghnProvinceV3Id?: string;
  ghnWardV3Id?: string;
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

export type OrderIssueReason =
  | 'WRONG_SIZE'
  | 'WRONG_COLOR'
  | 'QUALITY_MISMATCH'
  | 'OTHER'
  | 'REFUND_NOT_RECEIVED';
// BE chỉ còn hỗ trợ hoàn tiền, không còn đổi hàng.
export type OrderIssueDesiredResolution = 'REFUND';
export type OrderIssueStatus = 'PENDING' | 'APPROVED' | 'RESOLVED' | 'REJECTED';

export interface IRefundBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

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
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
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

export type OrderRefundStatus = 'PENDING' | 'REQUIRED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
/** Khoản hoàn: tiền hàng hoặc phí ship ban đầu, chuyển và ghi nhận riêng. */
export type OrderRefundKind = 'GOODS' | 'SHIPPING';

export interface IOrderRefund {
  id: string;
  /** Khoản cũ (trước khi tách) không có `kind`: coi là tiền hàng. */
  kind?: OrderRefundKind;
  amountVnd: number;
  status: OrderRefundStatus;
  requestedAt: string;
  processedAt?: string | null;
  failedReason?: string | null;
}

/** Chứng từ hoàn tiền: mã giao dịch / ghi chú và `receiptImages` (ảnh chuyển khoản). */
export type RefundEvidence = string | Record<string, unknown> | null;

export interface IOrderHistoryEvent {
  id?: string;
  type?: string | null;
  toStatus?: string | null;
  publicMessage?: string | null;
  message?: string | null;
  occurredAt?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Phần dữ liệu GET /orders/:id mà màn đổi trả & hoàn tiền dùng. */
export interface IOrderReturnsView {
  id: string;
  orderCode?: string | number;
  orderNumber?: string | number;
  status?: string;
  refundStatus?: string | null;
  refundConfirmedAt?: string | null;
  amountPaidVnd?: number | string | null;
  amountRefundedVnd?: number | string | null;
  refunds?: IOrderRefund[];
  refundEvidence?: RefundEvidence;
  refundBankName?: string | null;
  refundAccountNumber?: string | null;
  refundAccountHolder?: string | null;
  history?: IOrderHistoryEvent[];
  items?: (IOrderItemSummary & { id?: string | number })[];
  deliveryDispute?: IDeliveryDispute | null;
  allowedActions?: IOrderAllowedActions;
  chatUnreadForCustomer?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface IOrderItemSummary {
  productNameSnapshot?: string | null;
  productImageSnapshot?: string | null;
  color?: string | null;
  quantity?: number | null;
}

/** Một đơn có yêu cầu đổi trả (GET /order-issues/mine). */
export interface IMyReturnOrder {
  id: string;
  orderCode: number | string;
  status: string;
  refundStatus?: string | null;
  amountRefundedVnd: number;
  createdAt: string;
  updatedAt: string;
  issues: {
    id: string;
    status: OrderIssueStatus;
    reason: OrderIssueReason;
    createdAt: string;
    orderItem?: { productNameSnapshot?: string | null; productImageSnapshot?: string | null } | null;
  }[];
}

export interface IEvidenceImage {
  uri: string;
  name: string;
  type: string;
}

export interface ICreateOrderIssuePayload extends IRefundBankAccount {
  orderId: string | number;
  orderItemId: string | number;
  reason: OrderIssueReason;
  description: string;
  evidenceImages: IEvidenceImage[];
}

export type DeliveryDisputeStatus = 'OPEN' | 'RESOLVED' | 'CANCELLED';

export type DeliveryDisputeResolution =
  | 'CUSTOMER_CONFIRMED_RECEIVED'
  | 'ADMIN_CONFIRMED_RECEIVED'
  | 'REFUNDED'
  | 'LOST';

export interface IDeliveryDispute {
  id: string;
  status: DeliveryDisputeStatus;
  resolution?: DeliveryDisputeResolution | null;
  description: string;
  evidenceImages: string[];
  carrierRawStatus?: string | null;
  carrierDeliveredAt?: string | null;
  adminNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface IOrderAllowedActions {
  cancel?: boolean;
  confirmDelivery?: boolean;
  reportDeliveryIssue?: boolean;
  startShipmentCreation?: boolean;
  createReplacementShipment?: boolean;
  updateMeasurement?: boolean;
}

export interface IDeliveryDisputePayload {
  orderId: string | number;
  description: string;
  images: IEvidenceImage[];
}

export interface IMeasurementReviewState {
  status?: 'OPEN' | 'SUBMITTED' | 'RESOLVED' | 'CLOSED' | string;
  message?: string | null;
  requestedFields?: string[];
  fields?: string[];
  editable?: boolean;
  openedAt?: string;
  submittedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface IMeasurementDisplayItem {
  field: string;
  label: string;
  value: number;
  unit: string;
}

/** Item của GET /orders/:id: tiền theo dòng + dữ liệu số đo/review. */
export interface IOrderDetailItem {
  id?: string | number;
  productId?: string | number;
  productName?: string | null;
  productNameSnapshot?: string | null;
  productImage?: string | null;
  productImageSnapshot?: string | null;
  color?: string | null;
  quantity?: number | null;
  price?: number | null;
  unitPriceVnd?: number | string | null;
  listUnitPriceVnd?: number | string | null;
  lineTotalVnd?: number | string | null;
  measurementSnapshot?: Record<string, unknown> | null;
  measurementDisplay?: IMeasurementDisplayItem[] | null;
  measurementReview?: IMeasurementReviewState | null;
  measurementRequiredFields?: string[] | null;
  measurementMissingFields?: string[] | null;
  [key: string]: unknown;
}

