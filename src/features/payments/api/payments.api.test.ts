import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { paymentsApi } from './payments.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T, meta?: any) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  meta,
});

describe('paymentsApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('checkout creates checkout link and returns response', async () => {
    const checkoutRes = {
      checkoutUrl: 'https://pay.sepay.vn/123',
      orderCode: 'ORD-9027452',
      paymentId: 'pay-1',
    };
    mock.onPost(ENDPOINTS.PAYMENTS.CHECKOUT).reply(200, envelope(checkoutRes));

    const result = await paymentsApi.checkout({ orderId: 'ord-1' });
    expect(result).toEqual(checkoutRes);
  });

  it('getPaymentStatus fetches status by payment id', async () => {
    const statusRes = {
      id: 'pay-1',
      status: 'PAID',
      provider: 'SEPAY',
      orderId: 'ord-1',
    };
    mock.onGet(ENDPOINTS.PAYMENTS.STATUS('pay-1')).reply(200, envelope(statusRes));

    const result = await paymentsApi.getPaymentStatus('pay-1');
    expect(result).toEqual(statusRes);
  });
});
