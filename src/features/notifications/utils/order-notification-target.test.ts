import { getOrderNotificationTarget } from './order-notification-target';

describe('getOrderNotificationTarget', () => {
  it('opens the order returns screen for issue reviews', () => {
    expect(getOrderNotificationTarget('ORDER_ISSUE', { orderId: 'o1' })).toEqual({
      screen: 'OrderReturns',
      orderId: 'o1',
    });
  });

  it('opens the order returns screen for refund payments, falling back to the order code', () => {
    expect(getOrderNotificationTarget('PAYMENT', { orderCode: 15560998, refundStatus: 'COMPLETED' })).toEqual({
      screen: 'OrderReturns',
      orderId: '15560998',
    });
  });

  it('opens the returns list when an issue notification has no order', () => {
    expect(getOrderNotificationTarget('ORDER_ISSUE', {})).toEqual({ screen: 'Returns' });
  });

  it('keeps order status and plain payment notifications on the order detail', () => {
    expect(getOrderNotificationTarget('ORDER_STATUS', { orderId: 'o1' })).toEqual({
      screen: 'OrderDetail',
      orderId: 'o1',
    });
    expect(getOrderNotificationTarget('PAYMENT', { orderId: 'o2' })).toEqual({
      screen: 'OrderDetail',
      orderId: 'o2',
    });
  });

  it('opens the order detail focused on the shop chat for new messages', () => {
    expect(getOrderNotificationTarget('ORDER_CHAT', { orderId: 'o3' })).toEqual({
      screen: 'OrderDetail',
      orderId: 'o3',
      focusChat: true,
    });
    expect(getOrderNotificationTarget('ORDER_CHAT', { orderCode: 15560998 })).toEqual({
      screen: 'OrderDetail',
      orderId: '15560998',
      focusChat: true,
    });
    expect(getOrderNotificationTarget('ORDER_CHAT', {})).toBeNull();
  });

  it('ignores other notification types', () => {
    expect(getOrderNotificationTarget('PROMOTION', { orderId: 'o1' })).toBeNull();
    expect(getOrderNotificationTarget('ORDER_STATUS', {})).toBeNull();
  });
});
