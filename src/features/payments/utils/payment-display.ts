/** Mã đơn hiển thị cho khách dạng `ORD-<mã>`, kể cả khi nơi gọi đã truyền `ORD-…` hay `#…`. */
export function formatOrderCode(code?: string | number | null): string | null {
  if (code === undefined || code === null) return null;
  const raw = String(code).trim().replace(/^(ORD-|#)/i, '');
  return raw ? `ORD-${raw}` : null;
}

export type PaymentConfirmState = 'loading' | 'paid' | 'failed' | 'confirming' | 'timed-out';

/** Thanh toán ở các trạng thái này chắc chắn thất bại / hết hạn, không phải "đang chờ xác nhận". */
const FAILED_PAYMENT_STATUSES = ['EXPIRED', 'FAILED'];

/**
 * Trạng thái màn kết quả, như trang /payment/success của web: IPN của cổng có thể đến sau
 * khi app vừa quay về, nên đơn chưa PAID thì "đang xác nhận" tới khi hết thời gian chờ.
 */
export function getPaymentConfirmState(
  order: { status?: string | null; paymentStatus?: string | null } | null | undefined,
  timedOut: boolean,
): PaymentConfirmState {
  if (!order) return 'loading';
  if (order.paymentStatus === 'PAID') return 'paid';
  if (order.status === 'CANCELLED' || FAILED_PAYMENT_STATUSES.includes(order.paymentStatus ?? '')) {
    return 'failed';
  }
  return timedOut ? 'timed-out' : 'confirming';
}
