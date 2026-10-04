import type { ReviewListFilters, ReviewRating } from '../types/review';

function isReviewRating(value: number | undefined): value is ReviewRating {
  return Number.isInteger(value) && value !== undefined && value >= 1 && value <= 5;
}

export function normalizeReviewFilters(
  filters: ReviewListFilters = {},
): ReviewListFilters {
  const limit = filters.limit && filters.limit > 0 ? Math.floor(filters.limit) : undefined;

  return {
    ...(limit ? { limit } : {}),
    ...(isReviewRating(filters.rating) ? { rating: filters.rating } : {}),
  };
}

export const reviewKeys = {
  all: ['reviews'] as const,
  productLists: () => [...reviewKeys.all, 'product'] as const,
  product: (productId: string) =>
    [...reviewKeys.productLists(), productId] as const,
  productList: (productId: string, filters: ReviewListFilters = {}) =>
    [...reviewKeys.product(productId), normalizeReviewFilters(filters)] as const,
  statsRoot: () => [...reviewKeys.all, 'stats'] as const,
  stats: (productId: string) =>
    [...reviewKeys.statsRoot(), productId] as const,
  myLists: () => [...reviewKeys.all, 'mine'] as const,
  myList: (filters: ReviewListFilters = {}) =>
    [...reviewKeys.myLists(), normalizeReviewFilters(filters)] as const,
};
