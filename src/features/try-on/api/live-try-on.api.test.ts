import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { liveTryOnApi } from '@/features/try-on/api/live-try-on.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
});

const SESSION = {
  id: 's1',
  productId: 'p1',
  status: 'active',
  remainingSeconds: 120,
  createdAt: '2026-10-03T00:00:00.000Z',
};

describe('liveTryOnApi (session lifecycle)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('getQuota returns the live quota', async () => {
    mock
      .onGet(ENDPOINTS.LIVE_TRY_ON.QUOTA)
      .reply(200, envelope({ enabled: true, eligible: true, remaining: 300, limit: 600, seconds: 300 }));

    await expect(liveTryOnApi.getQuota()).resolves.toMatchObject({ eligible: true });
  });

  it('checkGarment checks live support for a product', async () => {
    mock
      .onGet(ENDPOINTS.LIVE_TRY_ON.GARMENT_CHECK('p1'))
      .reply(200, envelope({ productId: 'p1', supported: true, category: 'UPPER' }));

    await expect(liveTryOnApi.checkGarment('p1')).resolves.toMatchObject({
      supported: true,
    });
  });

  it('createSession forwards the idempotency key header', async () => {
    mock.onPost(ENDPOINTS.LIVE_TRY_ON.CREATE_SESSION).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ productId: 'p1' });
      expect(config.headers?.['Idempotency-Key']).toBe('key-123');
      return [200, envelope(SESSION)];
    });

    await expect(liveTryOnApi.createSession('p1', 'key-123')).resolves.toEqual(SESSION);
  });

  it('pause, resume and end drive the full session lifecycle', async () => {
    mock.onPost(ENDPOINTS.LIVE_TRY_ON.PAUSE('s1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ reason: 'client_pause' });
      return [200, envelope({ ...SESSION, status: 'paused' })];
    });
    mock.onPost(ENDPOINTS.LIVE_TRY_ON.RESUME('s1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ productId: 'p1' });
      return [200, envelope(SESSION)];
    });
    mock.onPost(ENDPOINTS.LIVE_TRY_ON.END('s1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ reason: 'client_end' });
      return [200, envelope({ ...SESSION, status: 'ended' })];
    });

    await expect(liveTryOnApi.pause('s1', 'client_pause')).resolves.toMatchObject({
      status: 'paused',
    });
    await expect(liveTryOnApi.resume('s1', 'p1')).resolves.toMatchObject({
      status: 'active',
    });
    await expect(liveTryOnApi.end('s1', 'client_end')).resolves.toMatchObject({
      status: 'ended',
    });
  });

  it('getSession fetches the current session state', async () => {
    mock.onGet(ENDPOINTS.LIVE_TRY_ON.GET_SESSION('s1')).reply(200, envelope(SESSION));

    await expect(liveTryOnApi.getSession('s1')).resolves.toEqual(SESSION);
  });
});
