import type { HttpOptions } from '@/api/http';
import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError, type ApiPaginationMeta } from '@/types/api';
import type {
  CreateReviewInput,
  IReview,
  IReviewStats,
  ProductReviewsMeta,
  ReviewDistribution,
  ReviewPage,
  ReviewPageParams,
  UpdateReviewInput,
} from '../types/review';

function requireId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError('Dữ liệu đánh giá từ máy chủ không hợp lệ.', 500, 'INVALID_REVIEW_DATA');
  }
  return value;
}

function parseDistribution(value: unknown): ReviewDistribution {
  if (!isRecord(value)) {
    throw new ApiError('Dữ liệu thống kê đánh giá không hợp lệ.', 500, 'INVALID_REVIEW_STATS');
  }

  return {
    1: readNumber(value, '1'),
    2: readNumber(value, '2'),
    3: readNumber(value, '3'),
    4: readNumber(value, '4'),
    5: readNumber(value, '5'),
  };
}

function parsePaginationMeta(value: unknown): ApiPaginationMeta {
  if (!isRecord(value)) {
    throw new ApiError('Dữ liệu phân trang đánh giá không hợp lệ.', 500, 'INVALID_REVIEW_META');
  }

  return {
    total: readNumber(value, 'total'),
    page: readNumber(value, 'page'),
    limit: readNumber(value, 'limit'),
    totalPages: readNumber(value, 'totalPages'),
  };
}

function parseProductReviewsMeta(value: unknown): ProductReviewsMeta {
  if (!isRecord(value)) {
    throw new ApiError('Dữ liệu phân trang đánh giá không hợp lệ.', 500, 'INVALID_REVIEW_META');
  }

  return {
    ...parsePaginationMeta(value),
    avgRating: readNumber(value, 'avgRating'),
    reviewCount: readNumber(value, 'reviewCount'),
    distribution: parseDistribution(value.distribution),
  };
}

function buildParams({ page = 1, limit = 10, rating }: ReviewPageParams) {
  return { page, limit, ...(rating ? { rating } : {}) };
}

export async function getProductReviews(
  productId: string,
  params: ReviewPageParams = {},
  options?: Pick<HttpOptions, 'signal'>,
): Promise<ReviewPage<ProductReviewsMeta>> {
  const id = requireId(productId, 'Product ID');
  const result = await http.getPaged<IReview[]>(ENDPOINTS.REVIEWS.LIST(id), {
    params: buildParams(params),
    signal: options?.signal,
  });

  return { data: result.data, meta: parseProductReviewsMeta(result.meta) };
}

export async function getProductReviewStats(
  productId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IReviewStats> {
  const id = requireId(productId, 'Product ID');
  const value = await http.get<unknown>(ENDPOINTS.REVIEWS.STATS(id), {
    signal: options?.signal,
  });
  if (!isRecord(value)) {
    throw new ApiError('Dữ liệu thống kê đánh giá không hợp lệ.', 500, 'INVALID_REVIEW_STATS');
  }

  return {
    avgRating: readNumber(value, 'avgRating'),
    reviewCount: readNumber(value, 'reviewCount'),
    distribution: parseDistribution(value.distribution),
  };
}

export async function getMyReviews(
  params: ReviewPageParams = {},
  options?: Pick<HttpOptions, 'signal'>,
): Promise<ReviewPage> {
  const result = await http.getPaged<IReview[]>(ENDPOINTS.REVIEWS.MY, {
    params: buildParams(params),
    signal: options?.signal,
  });
  return { data: result.data, meta: parsePaginationMeta(result.meta) };
}

export function createReview(
  productId: string,
  input: CreateReviewInput,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IReview> {
  const id = requireId(productId, 'Product ID');
  return http.post<IReview>(ENDPOINTS.REVIEWS.CREATE(id), input, options);
}

export function updateReview(
  reviewId: string,
  input: UpdateReviewInput,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IReview> {
  const id = requireId(reviewId, 'Review ID');
  return http.patch<IReview>(ENDPOINTS.REVIEWS.UPDATE(id), input, options);
}

export function deleteReview(
  reviewId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<null> {
  const id = requireId(reviewId, 'Review ID');
  return http.delete<null>(ENDPOINTS.REVIEWS.DELETE(id), options);
}
