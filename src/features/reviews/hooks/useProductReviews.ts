import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getProductReviews, getProductReviewStats } from '../api/reviews.api';
import { reviewKeys } from '../api/review.keys';
import type { ReviewRating } from '../types/review';

const REVIEW_PAGE_SIZE = 10;

export function useProductReviews(productId: string, rating?: ReviewRating) {
  const normalizedProductId = productId.trim();

  return useInfiniteQuery({
    queryKey: reviewKeys.productList(normalizedProductId, {
      limit: REVIEW_PAGE_SIZE,
      rating,
    }),
    queryFn: ({ pageParam, signal }) =>
      getProductReviews(
        normalizedProductId,
        { page: pageParam, limit: REVIEW_PAGE_SIZE, rating },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: normalizedProductId.length > 0,
  });
}

export function useProductReviewStats(productId: string) {
  const normalizedProductId = productId.trim();

  return useQuery({
    queryKey: reviewKeys.stats(normalizedProductId),
    queryFn: ({ signal }) =>
      getProductReviewStats(normalizedProductId, { signal }),
    enabled: normalizedProductId.length > 0,
  });
}
