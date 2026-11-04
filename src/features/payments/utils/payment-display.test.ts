import { formatOrderCode, getPaymentConfirmState } from './payment-display';

describe('formatOrderCode', () => {
  it('always shows ORD-<code>', () => {
    expect(formatOrderCode(2000955)).toBe('ORD-2000955');
    expect(formatOrderCode('ORD-2000955')).toBe('ORD-2000955');
    expect(formatOrderCode('#2000955')).toBe('ORD-2000955');
  });

  it('hides a missing code', () => {
    expect(formatOrderCode(undefined)).toBeNull();
    expect(formatOrderCode('  ')).toBeNull();
  });
});

describe('getPaymentConfirmState', () => {
  it('waits for the order before deciding', () => {
    expect(getPaymentConfirmState(undefined, false)).toBe('loading');
  });

  it('is paid only when the backend says PAID', () => {
    expect(getPaymentConfirmState({ status: 'MEASUREMENT_REVIEW', paymentStatus: 'PAID' }, false)).toBe('paid');
  });

  it('treats cancelled orders and failed or expired payments as failed', () => {
    expect(getPaymentConfirmState({ status: 'CANCELLED', paymentStatus: 'PENDING' }, false)).toBe('failed');
    expect(getPaymentConfirmState({ status: 'CREATED', paymentStatus: 'EXPIRED' }, false)).toBe('failed');
    expect(getPaymentConfirmState({ status: 'CREATED', paymentStatus: 'FAILED' }, false)).toBe('failed');
  });

  it('keeps confirming a pending payment until the wait runs out', () => {
    expect(getPaymentConfirmState({ status: 'CREATED', paymentStatus: 'PENDING' }, false)).toBe('confirming');
    expect(getPaymentConfirmState({ status: 'CREATED', paymentStatus: 'PENDING' }, true)).toBe('timed-out');
  });
});
