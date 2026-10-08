import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';

jest.mock('expo-file-system', () => ({
  Directory: class Directory {},
  File: class File {
    static downloadFileAsync = jest.fn();
  },
  Paths: { cache: '/cache' },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() },
}));

const envelope = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
});

const RESULT = {
  id: 'r1',
  resultUrl: 'https://cdn.example/result.jpg',
  category: 'UPPER',
  garments: [],
  createdAt: '2026-10-03T00:00:00.000Z',
};

const humanImage = { uri: 'file:///human.jpg', name: 'human.jpg', type: 'image/jpeg' };
const garmentImage = { uri: 'file:///ao.jpg', name: 'ao.jpg', type: 'image/jpeg' };

describe('tryOnApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('generate uploads multipart form and returns the unwrapped result', async () => {
    mock.onPost(ENDPOINTS.TRY_ON.GENERATE).reply((config) => {
      expect(config.headers?.['Content-Type']).toMatch(/multipart\/form-data/);
      return [200, envelope(RESULT)];
    });

    await expect(
      tryOnApi.generate({
        humanImage,
        garments: [{ category: 'UPPER', garmentImage }],
      }),
    ).resolves.toEqual(RESULT);
  });

  it('generate supports the legacy single-garment fields', async () => {
    mock.onPost(ENDPOINTS.TRY_ON.GENERATE).reply(200, envelope(RESULT));

    await expect(
      tryOnApi.generate({ humanImage, productId: 'p1', garmentCategory: 'LOWER' }),
    ).resolves.toEqual(RESULT);
  });

  it('getHistory sends page/limit params and returns the list', async () => {
    mock.onGet(ENDPOINTS.TRY_ON.HISTORY).reply((config) => {
      expect(config.params).toMatchObject({ page: 1, limit: 20 });
      return [200, envelope([RESULT])];
    });

    await expect(tryOnApi.getHistory(1, 20)).resolves.toEqual([RESULT]);
  });

  it('getDetail fetches a single history item', async () => {
    mock.onGet(ENDPOINTS.TRY_ON.DETAIL('r1')).reply(200, envelope(RESULT));

    await expect(tryOnApi.getDetail('r1')).resolves.toEqual(RESULT);
  });

  it('remove and removeAll call the delete endpoints', async () => {
    mock.onDelete(ENDPOINTS.TRY_ON.DELETE('r1')).reply(200, envelope(null));
    mock.onDelete(ENDPOINTS.TRY_ON.DELETE_ALL).reply(200, envelope(null));

    await expect(tryOnApi.remove('r1')).resolves.toBeNull();
    await expect(tryOnApi.removeAll()).resolves.toBeNull();
  });

  it('propagates quota errors as ApiError', async () => {
    mock.onPost(ENDPOINTS.TRY_ON.GENERATE).reply(429, {
      success: false,
      statusCode: 429,
      code: 'QUOTA_EXCEEDED',
      message: 'Hết lượt thử đồ',
    });

    await expect(
      tryOnApi.generate({ humanImage, garments: [{ category: 'UPPER', garmentImage }] }),
    ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  });

  it('downloadResult requires login before touching the file system', async () => {
    await expect(tryOnApi.downloadResult('r1')).rejects.toThrow(
      'Bạn cần đăng nhập để tải ảnh kết quả.',
    );
  });

  it('is an ApiError instance check sanity', () => {
    expect(new ApiError('x', 400, 'Y')).toBeInstanceOf(Error);
  });
});
