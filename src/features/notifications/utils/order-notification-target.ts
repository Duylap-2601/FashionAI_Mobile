export type OrderNotificationTarget =
  | { screen: 'OrderReturns'; orderId: string }
  | { screen: 'Returns' }
  | { screen: 'OrderDetail'; orderId: string };

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

/**
 * Màn cần mở cho thông báo đơn hàng, khớp web: duyệt đổi trả (ORDER_ISSUE) và các lần
 * hoàn tiền (PAYMENT có refundStatus) mở màn đổi trả của đơn; còn lại mở chi tiết đơn.
 * Hoàn tiền qua cổng online có thể chỉ kèm orderCode, BE nhận cả mã đơn lẫn id.
 */
export function getOrderNotificationTarget(type: unknown, data: Record<string, unknown>): OrderNotificationTarget | null {
  const orderRef = readString(data.orderId) ?? readString(data.orderCode);
  if (type === 'ORDER_ISSUE' || (type === 'PAYMENT' && data.refundStatus)) {
    return orderRef ? { screen: 'OrderReturns', orderId: orderRef } : { screen: 'Returns' };
  }
  if ((type === 'ORDER_STATUS' || type === 'PAYMENT') && orderRef) {
    return { screen: 'OrderDetail', orderId: orderRef };
  }
  return null;
}
