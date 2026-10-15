import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { usersApi } from './users.api';

jest.mock('@/api/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('usersApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getMe calls GET /users/me', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({ id: '1', name: 'User 1' });
    const res = await usersApi.getMe();
    expect(http.get).toHaveBeenCalledWith(ENDPOINTS.USERS.ME, undefined);
    expect(res).toEqual({ id: '1', name: 'User 1' });
  });

  it('updateMe calls PUT /users/me with payload', async () => {
    const payload = { name: 'New Name', phone: '0901234567' };
    (http.put as jest.Mock).mockResolvedValueOnce({ id: '1', ...payload });
    const res = await usersApi.updateMe(payload);
    expect(http.put).toHaveBeenCalledWith(ENDPOINTS.USERS.ME, payload, undefined);
    expect(res.name).toBe('New Name');
  });

  it('getQuota calls GET /users/me/quota with action param', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({ used: 0, limit: 3, remaining: 3 });
    const res = await usersApi.getQuota('TRY_ON');
    expect(http.get).toHaveBeenCalledWith(ENDPOINTS.USERS.QUOTA, {
      params: { action: 'TRY_ON' },
    });
    expect(res.remaining).toBe(3);
  });

  it('getAddresses calls GET /users/me/addresses', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce([{ id: 'addr-1', isDefault: true }]);
    const res = await usersApi.getAddresses();
    expect(http.get).toHaveBeenCalledWith(ENDPOINTS.USERS.ADDRESSES, undefined);
    expect(res).toHaveLength(1);
  });

  it('setDefaultAddress calls PATCH /users/me/addresses/:id/default', async () => {
    (http.patch as jest.Mock).mockResolvedValueOnce({ id: 'addr-1', isDefault: true });
    await usersApi.setDefaultAddress('addr-1');
    expect(http.patch).toHaveBeenCalledWith(
      `${ENDPOINTS.USERS.ADDRESSES}/addr-1/default`,
      undefined,
      undefined
    );
  });
});
