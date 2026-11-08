import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ordersApi, UNPAID_ORDERS_LIMIT } from './orders.api';
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

  it('getOrdersPage sends the tab status and search to the backend', async () => {
    const ordersData = [{ id: '1', orderCode: 9027452, status: 'SHIPPING' }];
    const meta = { total: 41, page: 3, limit: 20, totalPages: 3 };
    mock.onGet(ENDPOINTS.ORDERS.LIST).reply((config) => {
      expect(config.params).toEqual({ status: 'SHIPPING', search: 'vest', page: 3, limit: 20 });
      return [200, envelope(ordersData, meta)];
    });

    await expect(
      ordersApi.getOrdersPage({ status: 'SHIPPING', search: 'vest', page: 3, limit: 20 }),
    ).resolves.toEqual({ data: ordersData, meta });
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

  it('getMyReturns pages through orders with returns', async () => {
    const orders = [{ id: 'o1', orderCode: 15560998, status: 'RETURNED', amountRefundedVnd: 769700, issues: [] }];
    const meta = { total: 11, page: 2, limit: 10, totalPages: 2 };
    mock.onGet(ENDPOINTS.ORDERS.MY_RETURNS).reply((config) => {
      expect(config.params).toEqual({ page: 2, limit: 10 });
      return [200, envelope(orders, meta)];
    });

    await expect(ordersApi.getMyReturns({ page: 2, limit: 10 })).resolves.toEqual({ data: orders, meta });
  });

  it('getMyReturns tolerates a response without pagination meta', async () => {
    mock.onGet(ENDPOINTS.ORDERS.MY_RETURNS).reply(200, envelope([]));

    await expect(ordersApi.getMyReturns()).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
  });

  it('getOrderIssues sends paging params and synthesizes missing meta', async () => {
    const issues = [{ id: 'issue-1', status: 'PENDING' }];
    mock.onGet(ENDPOINTS.ORDERS.ISSUES('order-1')).reply((config) => {
      expect(config.params).toEqual({ page: 2, limit: 50 });
      return [200, envelope(issues)];
    });

    await expect(ordersApi.getOrderIssues('order-1', { page: 2 })).resolves.toEqual({
      data: issues,
      meta: { page: 2, limit: 50, total: 1, totalPages: 1 },
    });
  });

  it('confirmRefundReceived posts to the refund confirmation endpoint', async () => {
    const order = { id: 'order-1', refundConfirmedAt: '2026-11-04T10:00:00.000Z' };
    mock.onPost(ENDPOINTS.ORDERS.CONFIRM_REFUND_RECEIVED('order-1')).reply(200, envelope(order));

    await expect(ordersApi.confirmRefundReceived('order-1')).resolves.toEqual(order);
  });

  it('createDeliveryDispute sends only description and evidence images', async () => {
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    const order = { id: 'order-1', status: 'DELIVERY_DISPUTED' };
    mock.onPost(ENDPOINTS.ORDERS.DELIVERY_DISPUTE('order-1')).reply((config) => {
      expect(String(config.headers?.['Content-Type'])).toContain('multipart/form-data');
      return [201, envelope(order)];
    });

    const evidence = { uri: 'file:///door.jpg', name: 'door.jpg', type: 'image/jpeg' };
    await expect(
      ordersApi.createDeliveryDispute({
        orderId: 'order-1',
        description: 'Hãng báo giao lúc 15h nhưng mình không có nhà',
        images: [evidence],
      }),
    ).resolves.toEqual(order);

    const appended = appendSpy.mock.calls.filter(([name]) => name !== 'evidenceImages');
    expect(appended).toEqual([
      ['description', 'Hãng báo giao lúc 15h nhưng mình không có nhà'],
    ]);
    expect(appendSpy.mock.calls.filter(([name]) => name === 'evidenceImages')).toHaveLength(1);
  });

  it('createOrderIssue sends a refund-only multipart form with the refund bank account', async () => {
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    const issue = { id: 'issue-1', status: 'PENDING' };
    mock.onPost(ENDPOINTS.ORDERS.REPORT_ISSUE('order-1', 'item-1')).reply((config) => {
      expect(String(config.headers?.['Content-Type'])).toContain('multipart/form-data');
      return [201, envelope(issue)];
    });

    const evidence = { uri: 'file:///evidence.jpg', name: 'evidence.jpg', type: 'image/jpeg' };
    const result = await ordersApi.createOrderIssue({
      orderId: 'order-1',
      orderItemId: 'item-1',
      reason: 'WRONG_SIZE',
      description: 'Áo lệch vai trái khoảng 4cm',
      evidenceImages: [evidence],
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountHolder: 'NGUYEN VAN A',
    });

    expect(result).toEqual(issue);
    const fields = Object.fromEntries(
      appendSpy.mock.calls
        .filter(([name]) => name !== 'evidenceImages')
        .map(([name, value]) => [name, value]),
    );
    expect(fields).toEqual({
      reason: 'WRONG_SIZE',
      description: 'Áo lệch vai trái khoảng 4cm',
      desiredResolution: 'REFUND',
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountHolder: 'NGUYEN VAN A',
    });
    expect(appendSpy.mock.calls.filter(([name]) => name === 'evidenceImages')).toHaveLength(1);
  });

  describe('getUnpaidOrders', () => {
    it('requests CREATED orders limited to 5 and keeps only PENDING payments', async () => {
      const ordersData = [
        { id: 'o-1', orderCode: 101, status: 'CREATED', paymentStatus: 'PENDING', totalVnd: 530000, paymentDueAt: '2026-11-05T08:00:00.000Z' },
        { id: 'o-2', orderCode: 102, status: 'CREATED', paymentStatus: 'FAILED', totalVnd: 410000 },
        { id: 'o-3', orderCode: 103, status: 'CREATED', paymentStatus: null, amount: 250000 },
        { id: 'o-4', orderCode: 104, status: 'CREATED', paymentStatus: 'PENDING', amount: 999000, paymentDueAt: null },
      ];
      mock.onGet(ENDPOINTS.ORDERS.LIST).reply(200, envelope(ordersData, { page: 1, limit: 5, total: 4 }));

      const result = await ordersApi.getUnpaidOrders();

      expect(mock.history.get).toHaveLength(1);
      expect(mock.history.get[0].params).toEqual({ status: 'CREATED', limit: UNPAID_ORDERS_LIMIT });
      expect(UNPAID_ORDERS_LIMIT).toBe(5);
      expect(result.map((order) => order.id)).toEqual(['o-1', 'o-4']);
    });

    it('keeps status and limit even when the caller passes other params, and forwards the signal', async () => {
      mock.onGet(ENDPOINTS.ORDERS.LIST).reply(200, envelope([]));
      const controller = new AbortController();

      const result = await ordersApi.getUnpaidOrders({
        signal: controller.signal,
        params: { status: 'COMPLETED', limit: 50, search: 'ao' },
      });

      expect(result).toEqual([]);
      expect(mock.history.get[0].params).toEqual({ status: 'CREATED', limit: 5, search: 'ao' });
      expect(mock.history.get[0].signal).toBe(controller.signal);
    });

    it('returns an empty list when the response data is not an array', async () => {
      mock.onGet(ENDPOINTS.ORDERS.LIST).reply(200, envelope(null));

      await expect(ordersApi.getUnpaidOrders()).resolves.toEqual([]);
    });
  });
});
