import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { notificationsApi } from './notifications.api';
import { ENDPOINTS } from '@/constants/endpoints';

const NOTIFICATION = {
  id: 'n1',
  userId: 'u1',
  type: 'ORDER_STATUS',
  title: 'Đơn hàng đang giao',
  message: 'Đơn #DH001 đang trên đường giao tới bạn.',
  data: { orderId: 'o1', orderCode: 'DH001' },
  isRead: false,
  createdAt: '2026-10-07T00:00:00.000Z',
};

describe('notifications API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('list sends page/limit and keeps the unread meta', async () => {
    mock.onGet(ENDPOINTS.NOTIFICATIONS.LIST).reply((config) => {
      expect(config.params).toMatchObject({ page: 1, limit: 20 });
      return [
        200,
        {
          success: true,
          code: 'OK',
          message: 'Thành công',
          data: [NOTIFICATION],
          meta: { total: 1, unread: 1, page: 1, limit: 20, totalPages: 1 },
        },
      ];
    });

    const result = await notificationsApi.list(1, 20);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].isRead).toBe(false);
    expect(result.meta).toMatchObject({ total: 1, unread: 1 });
  });

  it('unreadCount returns the unread number', async () => {
    mock.onGet(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT).reply(200, {
      success: true,
      code: 'OK',
      message: 'Thành công',
      data: { unread: 3 },
    });

    await expect(notificationsApi.unreadCount()).resolves.toEqual({ unread: 3 });
  });

  it('markRead patches a single notification', async () => {
    mock.onPatch(ENDPOINTS.NOTIFICATIONS.READ('n1')).reply(200, {
      success: true,
      code: 'OK',
      message: 'Thành công',
      data: { id: 'n1', isRead: true },
    });

    await expect(notificationsApi.markRead('n1')).resolves.toEqual({
      id: 'n1',
      isRead: true,
    });
  });

  it('markAllRead patches read-all', async () => {
    mock.onPatch(ENDPOINTS.NOTIFICATIONS.READ_ALL).reply(200, {
      success: true,
      code: 'OK',
      message: 'Thành công',
      data: { updated: 5 },
    });

    await expect(notificationsApi.markAllRead()).resolves.toEqual({ updated: 5 });
  });
});
