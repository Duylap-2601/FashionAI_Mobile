import {
  getOrderCode,
  getOrderTotal,
  getPaymentMethodLabel,
  toNumber,
} from './order-format';

describe('order-format', () => {
  it('builds one order code and keeps zero values', () => {
    expect(getOrderCode({ orderCode: 15560998 })).toBe('ORD-15560998');
    expect(getOrderCode({ orderNumber: 12 })).toBe('ORD-12');
    expect(getOrderCode({ id: 'abc' })).toBe('ORD-abc');
    expect(getOrderCode({ orderCode: 0, orderNumber: 12 })).toBe('ORD-0');
  });

  it('parses decimal strings coming from Prisma and rejects garbage', () => {
    expect(toNumber('769700.00')).toBe(769700);
    expect(toNumber(769700)).toBe(769700);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });

  it('falls back to the legacy amount field for the order total', () => {
    expect(getOrderTotal({ amount: '530000.00' })).toBe(530000);
    expect(getOrderTotal({ totalVnd: 1, amount: 2 })).toBe(1);
  });

  it('prefers the paid payment provider and labels manual transfers', () => {
    expect(
      getPaymentMethodLabel({
        paymentMethod: 'BANK_TRANSFER',
        payments: [{ provider: 'ZALOPAY', status: 'PAID' }],
      }),
    ).toBe('ZaloPay');
    expect(getPaymentMethodLabel({ paymentMethod: 'MANUAL_ADMIN' })).toBe(
      'Chuyển khoản (shop xác nhận)',
    );
    expect(getPaymentMethodLabel({})).toBe('Chưa xác định');
  });
});
