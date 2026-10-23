import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ordersApi } from './orders.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T, meta?: any) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  meta,
});

describe('ordersApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('quote posts quote payload and returns quote response', async () => {
    const payload = {
      items: [{ productId: 'prod-1', quantity: 1, price: 500000 }],
      shippingAddressId: 'addr-1',
      addressVersion: 2,
    };
    const quoteData = {
      itemsTotal: 500000,
      shippingFee: 30000,
      discountAmount: 0,
      totalAmount: 530000,
      quoteToken: 'token-123',
    };

    mock.onPost(ENDPOINTS.ORDERS.QUOTE).reply(200, envelope(quoteData));

    const result = await ordersApi.quote(payload);
    expect(result).toEqual(quoteData);
  });

  it('createOrder posts quote token and returns created order', async () => {
    const payload = {
      items: [{ productId: 'prod-1', quantity: 1, price: 500000 }],
      shippingAddressId: 'addr-1',
      addressVersion: 2,
      quoteToken: 'token-123',
      totalAmount: 530000,
      paymentMethod: 'BANK_TRANSFER',
    };
    const orderData = { id: 'order-1', orderCode: 'FASHION-1', totalAmount: 530000 };

    mock.onPost(ENDPOINTS.ORDERS.CREATE).reply(200, envelope(orderData));

    const result = await ordersApi.createOrder(payload);
    expect(result).toEqual(orderData);
  });

  it('getOrders fetches list of orders', async () => {
    const ordersData = [
      { id: '1', orderCode: '9027452', status: 'PENDING', totalAmount: 610500 },
      { id: '2', orderCode: '69290348', status: 'CANCELLED', totalAmount: 1367000 },
    ];

    mock.onGet(ENDPOINTS.ORDERS.LIST).reply(200, envelope(ordersData));

    const result = await ordersApi.getOrders();
    expect(result).toEqual(ordersData);
  });

  it('getOrder fetches single order detail', async () => {
    const orderData = { id: '1', orderCode: '9027452', status: 'PENDING' };

    mock.onGet(ENDPOINTS.ORDERS.DETAIL('1')).reply(200, envelope(orderData));

    const result = await ordersApi.getOrder('1');
    expect(result).toEqual(orderData);
  });

  it('cancelOrder sends patch request', async () => {
    mock.onPatch(ENDPOINTS.ORDERS.CANCEL('1')).reply(200, envelope({ success: true }));

    const result = await ordersApi.cancelOrder('1');
    expect(result).toEqual({ success: true });
  });

  it('confirmDelivery sends post request', async () => {
    mock.onPost(ENDPOINTS.ORDERS.CONFIRM_DELIVERY('1')).reply(200, envelope({ success: true }));

    const result = await ordersApi.confirmDelivery('1');
    expect(result).toEqual({ success: true });
  });
});
