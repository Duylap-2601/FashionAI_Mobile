import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { http, isCanceledError } from '@/api/http';
import { ApiError } from '@/types/api';

const envelope = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  ...(meta ? { meta } : {}),
});

describe('http wrapper', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('envelope unwrapping', () => {
    it('returns data only on get', async () => {
      mock.onGet('/users/me').reply(200, envelope({ id: 'u1', email: 'a@b.c' }));

      await expect(http.get('/users/me')).resolves.toEqual({ id: 'u1', email: 'a@b.c' });
    });

    it('sends the body and returns data on post', async () => {
      mock.onPost('/auth/login').reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ email: 'a@b.c', password: 'pw' });
        return [200, envelope({ accessToken: 'at' })];
      });

      await expect(http.post('/auth/login', { email: 'a@b.c', password: 'pw' })).resolves.toEqual({
        accessToken: 'at',
      });
    });

    it('supports put, patch and delete', async () => {
      mock.onPut('/a').reply(200, envelope('put'));
      mock.onPatch('/b').reply(200, envelope('patch'));
      mock.onDelete('/c').reply(200, envelope(null));

      await expect(http.put('/a', {})).resolves.toBe('put');
      await expect(http.patch('/b', {})).resolves.toBe('patch');
      await expect(http.delete('/c')).resolves.toBeNull();
    });

    it('forwards query params', async () => {
      mock.onGet('/users/me/quota').reply((config) => {
        expect(config.params).toEqual({ action: 'TRY_ON' });
        return [200, envelope({ remaining: 3 })];
      });

      await expect(http.get('/users/me/quota', { params: { action: 'TRY_ON' } })).resolves.toEqual({
        remaining: 3,
      });
    });

    it('keeps the X-Platform: mobile header from the shared client', async () => {
      mock.onGet('/users/me').reply((config) => {
        expect(config.headers?.['X-Platform']).toBe('mobile');
        return [200, envelope(null)];
      });

      await http.get('/users/me');
    });
  });

  describe('getPaged', () => {
    it('returns data and meta', async () => {
      mock
        .onGet('/products')
        .reply(200, envelope([{ id: 'p1' }], { page: 1, limit: 20, total: 1, totalPages: 1 }));

      await expect(http.getPaged('/products')).resolves.toEqual({
        data: [{ id: 'p1' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('returns undefined meta when the backend omits it', async () => {
      mock.onGet('/products').reply(200, envelope([]));

      const result = await http.getPaged('/products');
      expect(result.data).toEqual([]);
      expect(result.meta).toBeUndefined();
    });
  });

  describe('raw', () => {
    it('returns the full envelope', async () => {
      mock.onGet('/users/me').reply(200, envelope({ id: 'u1' }));

      await expect(http.raw('get', '/users/me')).resolves.toEqual({
        success: true,
        code: 'OK',
        message: 'Thành công',
        data: { id: 'u1' },
      });
    });
  });

  describe('upload', () => {
    it('sends multipart/form-data and reports progress', async () => {
      const onProgress = jest.fn();
      const form = new FormData();
      form.append('image', 'fake-blob');

      mock.onPost('/try-on').reply((config) => {
        expect(String(config.headers?.['Content-Type'])).toContain('multipart/form-data');
        config.onUploadProgress?.({ loaded: 25, total: 100 } as any);
        config.onUploadProgress?.({ loaded: 100, total: 100 } as any);
        return [200, envelope({ resultUrl: 'https://x/y.png' })];
      });

      await expect(http.upload('/try-on', form, { onProgress })).resolves.toEqual({
        resultUrl: 'https://x/y.png',
      });
      expect(onProgress).toHaveBeenNthCalledWith(1, 25);
      expect(onProgress).toHaveBeenNthCalledWith(2, 100);
    });

    it('ignores progress events without a total', async () => {
      const onProgress = jest.fn();

      mock.onPost('/try-on').reply((config) => {
        config.onUploadProgress?.({ loaded: 10 } as any);
        return [200, envelope(null)];
      });

      await http.upload('/try-on', new FormData(), { onProgress });
      expect(onProgress).not.toHaveBeenCalled();
    });
  });

  describe('error normalization', () => {
    it('maps a backend error envelope to ApiError', async () => {
      mock.onPost('/auth/login').reply(401, {
        success: false,
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
        details: ['email'],
      });

      await expect(http.post('/auth/login', {})).rejects.toMatchObject({
        name: 'ApiError',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
        details: ['email'],
      });
    });

    it('maps a network failure to NETWORK_ERROR', async () => {
      mock.onGet('/users/me').networkError();

      const error = (await http.get('/users/me').catch((e) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(0);
    });

    it('maps a timeout to REQUEST_TIMEOUT', async () => {
      mock.onGet('/users/me').timeout();

      const error = (await http.get('/users/me').catch((e) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('REQUEST_TIMEOUT');
      expect(error.statusCode).toBe(408);
    });

    it('maps a non-envelope error response to UNKNOWN_ERROR', async () => {
      mock.onGet('/users/me').reply(500, '<html>Bad Gateway</html>');

      const error = (await http.get('/users/me').catch((e) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('cancellation', () => {
    it('rejects with a cancellation error when the signal aborts', async () => {
      const controller = new AbortController();
      mock.onGet('/products').reply(() => new Promise(() => {}));

      const pending = http.getPaged('/products', { signal: controller.signal });
      controller.abort();

      const error = await pending.catch((e) => e);
      expect(isCanceledError(error)).toBe(true);
    });

    it('does not flag a real failure as cancelled', async () => {
      mock.onGet('/users/me').networkError();

      const error = await http.get('/users/me').catch((e) => e);
      expect(isCanceledError(error)).toBe(false);
    });

    it('recognizes a raw AbortError', () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      expect(isCanceledError(abortError)).toBe(true);
      expect(isCanceledError(new Error('boom'))).toBe(false);
      expect(isCanceledError(null)).toBe(false);
    });
  });
});
