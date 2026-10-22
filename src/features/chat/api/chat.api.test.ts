import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { chatApi } from '@/features/chat/api/chat.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T, meta?: unknown) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  ...(meta ? { meta } : {}),
});

const SESSION = {
  id: 's1',
  title: 'Tư vấn size blazer',
  updatedAt: '2026-10-10T00:00:00.000Z',
  lastMessage: 'Cho tôi tư vấn size...',
  lastRole: 'user',
};

const DETAIL = {
  ...SESSION,
  createdAt: '2026-10-09T00:00:00.000Z',
  messages: [
    { id: 'm1', role: 'user', content: 'Chào', createdAt: '2026-10-09T00:00:00.000Z' },
  ],
};

describe('chatApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('listSessions sends page/limit and validates meta', async () => {
    mock.onGet(ENDPOINTS.CHAT.SESSIONS).reply((config) => {
      expect(config.params).toMatchObject({ page: 1, limit: 20 });
      return [
        200,
        envelope([SESSION], { total: 1, page: 1, limit: 20, totalPages: 1 }),
      ];
    });

    await expect(chatApi.listSessions(1, 20)).resolves.toEqual({
      data: [SESSION],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('listSessions throws on invalid meta', async () => {
    mock.onGet(ENDPOINTS.CHAT.SESSIONS).reply(200, envelope([SESSION], { total: 1 }));

    await expect(chatApi.listSessions(1, 20)).rejects.toMatchObject({
      code: 'INVALID_CHAT_META',
    });
  });

  it('getSession fetches a single session with messages', async () => {
    mock.onGet(ENDPOINTS.CHAT.SESSION_DETAIL('s1')).reply(200, envelope(DETAIL));

    await expect(chatApi.getSession('s1')).resolves.toEqual(DETAIL);
  });

  it('deleteSession calls the delete endpoint', async () => {
    mock.onDelete(ENDPOINTS.CHAT.SESSION_DELETE('s1')).reply(200, envelope({ deleted: true }));

    await expect(chatApi.deleteSession('s1')).resolves.toEqual({ deleted: true });
  });
});
