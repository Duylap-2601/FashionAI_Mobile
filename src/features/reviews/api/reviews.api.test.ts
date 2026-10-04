import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  createReview,
  deleteReview,
  getMyReviews,
  getProductReviewStats,
  getProductReviews,
  updateReview,
} from './reviews.api';

const envelope = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  ...(meta ? { meta } : {}),
});

const review = {
  id: 'r1',
  productId: 'p1',
  userId: 'u1',
  orderId: 'o1',
  rating: 5 as const,
  comment: 'Rất đẹp',
  images: ['https://cdn.example/review.jpg'],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('reviews API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('gets a filtered product review page and preserves review stats metadata', async () => {
    const meta = {
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 2,
      avgRating: 4.5,
      reviewCount: 8,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 5 },
    };
    mock.onGet(ENDPOINTS.REVIEWS.LIST('p1')).reply((config) => {
      expect(config.params).toEqual({ page: 2, limit: 10, rating: 5 });
      return [200, envelope([review], meta)];
    });

    await expect(
      getProductReviews(' p1 ', { page: 2, limit: 10, rating: 5 }),
    ).resolves.toEqual({ data: [review], meta });
  });

  it('gets product review statistics from the dedicated endpoint', async () => {
    const stats = {
      avgRating: 4.2,
      reviewCount: 12,
      distribution: { 1: 1, 2: 0, 3: 2, 4: 3, 5: 6 },
    };
    mock.onGet(ENDPOINTS.REVIEWS.STATS('p1')).reply(200, envelope(stats));

    await expect(getProductReviewStats('p1')).resolves.toEqual(stats);
  });

  it('gets the current user review page with an optional rating filter', async () => {
    const meta = { total: 1, page: 1, limit: 10, totalPages: 1 };
    mock.onGet(ENDPOINTS.REVIEWS.MY).reply((config) => {
      expect(config.params).toEqual({ page: 1, limit: 10, rating: 4 });
      return [200, envelope([review], meta)];
    });

    await expect(
      getMyReviews({ page: 1, limit: 10, rating: 4 }),
    ).resolves.toEqual({ data: [review], meta });
  });

  it('creates a JSON review with URL array images and no order id', async () => {
    mock.onPost(ENDPOINTS.REVIEWS.CREATE('p1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        rating: 5,
        comment: 'Rất đẹp',
        images: ['https://cdn.example/review.jpg'],
      });
      return [201, envelope(review)];
    });

    await expect(
      createReview('p1', {
        rating: 5,
        comment: 'Rất đẹp',
        images: ['https://cdn.example/review.jpg'],
      }),
    ).resolves.toEqual(review);
  });

  it('updates only mutable review fields and deletes through the ownership endpoints', async () => {
    mock.onPatch(ENDPOINTS.REVIEWS.UPDATE('r1')).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ comment: 'Đã cập nhật' });
      return [200, envelope({ ...review, comment: 'Đã cập nhật' })];
    });
    mock.onDelete(ENDPOINTS.REVIEWS.DELETE('r1')).reply(200, envelope(null));

    await expect(updateReview('r1', { comment: 'Đã cập nhật' })).resolves.toMatchObject({
      id: 'r1',
      comment: 'Đã cập nhật',
    });
    await expect(deleteReview('r1')).resolves.toBeNull();
  });
});
