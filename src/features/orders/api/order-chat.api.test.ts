import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import { orderChatApi } from './order-chat.api';

const envelope = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
});

const message = {
  id: 'm1',
  senderRole: 'CUSTOMER' as const,
  content: 'Shop kiểm tra giúp em số đo vai',
  attachments: [],
  createdAt: '2026-11-04T10:00:00.000Z',
};

const thread = {
  messages: [message],
  nextCursor: 'm1',
  hasMore: true,
  unreadForCustomer: 2,
  unreadForAdmin: 0,
  locked: false,
};

describe('orderChatApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('loads a thread with the older-message cursor', async () => {
    mock.onGet(ENDPOINTS.ORDERS.CHAT_THREAD('order-1')).reply((config) => {
      expect(config.params).toEqual({ before: 'm1', limit: 20 });
      return [200, envelope(thread)];
    });

    await expect(
      orderChatApi.getThread('order-1', { before: 'm1', limit: 20 }),
    ).resolves.toEqual(thread);
  });

  it('sends content, idempotency key and attachments with the images field', async () => {
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    mock.onPost(ENDPOINTS.ORDERS.CHAT_MESSAGES('order-1')).reply((config) => {
      expect(String(config.headers?.['Content-Type'])).toContain('multipart/form-data');
      return [201, envelope({ message, unreadForCustomer: 0, unreadForAdmin: 1 })];
    });

    const image = { uri: 'file:///chat.jpg', name: 'chat.jpg', type: 'image/jpeg' };
    await orderChatApi.sendMessage({
      orderId: 'order-1',
      content: 'Shop kiểm tra giúp em số đo vai',
      clientMessageId: 'client-1',
      images: [image],
    });

    expect(appendSpy.mock.calls).toEqual([
      ['content', 'Shop kiểm tra giúp em số đo vai'],
      ['clientMessageId', 'client-1'],
      ['images', image],
    ]);
  });

  it('marks the thread read up to the newest message', async () => {
    mock.onPost(ENDPOINTS.ORDERS.CHAT_READ('order-1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ upToMessageId: 'm1' });
      return [200, envelope({ updated: 2, unreadForCustomer: 0, unreadForAdmin: 0 })];
    });

    await expect(orderChatApi.markRead('order-1', 'm1')).resolves.toEqual({
      updated: 2,
      unreadForCustomer: 0,
      unreadForAdmin: 0,
    });
  });

  it('loads the customer thread list', async () => {
    const mine = {
      threads: [
        {
          orderId: 'order-1',
          orderCode: 15560998,
          orderStatus: 'SHIPPING',
          lastMessageAt: '2026-11-04T10:00:00.000Z',
          lastMessagePreview: 'Shop đã gửi',
          unread: 1,
        },
      ],
      orders: [{ orderId: 'order-1', orderCode: 15560998, status: 'SHIPPING' }],
    };
    mock.onGet(ENDPOINTS.ORDER_CHATS.MINE).reply(200, envelope(mine));

    await expect(orderChatApi.getMine()).resolves.toEqual(mine);
  });
});
