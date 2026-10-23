import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { usersApi, IUpsertUserAddressDto } from './users.api';

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

  it('createAddress posts a typed address payload', async () => {
    const payload: IUpsertUserAddressDto = {
      recipientName: 'Nguyễn Văn A',
      phone: '0901234567',
      addressLine: '123 Nguyễn Trãi',
      label: 'Nhà riêng',
      ghnProvinceV3Id: '1000001',
      ghnWardV3Id: '1003575',
      isDefault: true,
    };
    (http.post as jest.Mock).mockResolvedValueOnce({ id: 'addr-1', ...payload, version: 1 });
    const res = await usersApi.createAddress(payload);
    expect(http.post).toHaveBeenCalledWith(ENDPOINTS.USERS.ADDRESSES, payload, undefined);
    expect(res.id).toBe('addr-1');
  });

  it('updateAddress calls PATCH /users/me/addresses/:id', async () => {
    const payload: IUpsertUserAddressDto = {
      recipientName: 'Nguyễn Văn A',
      phone: '0901234567',
      addressLine: '123 Nguyễn Trãi',
      ghnProvinceV3Id: '1000001',
      ghnWardV3Id: '1003575',
      expectedVersion: 2,
    };
    (http.patch as jest.Mock).mockResolvedValueOnce({ id: 'addr-1', ...payload, version: 3 });
    await usersApi.updateAddress('addr-1', payload);
    expect(http.patch).toHaveBeenCalledWith(
      `${ENDPOINTS.USERS.ADDRESSES}/addr-1`,
      payload,
      undefined,
    );
  });

  it('deleteAddress calls DELETE /users/me/addresses/:id', async () => {
    (http.delete as jest.Mock).mockResolvedValueOnce({ deleted: true });
    await usersApi.deleteAddress('addr-1');
    expect(http.delete).toHaveBeenCalledWith(
      `${ENDPOINTS.USERS.ADDRESSES}/addr-1`,
      undefined,
    );
  });

  it('setDefaultAddress calls PATCH /users/me/addresses/:id/default', async () => {
    (http.patch as jest.Mock).mockResolvedValueOnce({ id: 'addr-1', isDefault: true });
    await usersApi.setDefaultAddress('addr-1');
    expect(http.patch).toHaveBeenCalledWith(
      `${ENDPOINTS.USERS.ADDRESSES}/addr-1/default`,
      undefined,
      undefined,
    );
  });
});
