import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getMyReviews } from '../api/reviews.api';
import { reviewKeys } from '../api/review.keys';
import type { ReviewRating } from '../types/review';

const REVIEW_PAGE_SIZE = 10;

export function useMyReviews(rating?: ReviewRating) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: reviewKeys.myList({ limit: REVIEW_PAGE_SIZE, rating }),
    queryFn: ({ pageParam, signal }) =>
      getMyReviews(
        { page: pageParam, limit: REVIEW_PAGE_SIZE, rating },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: isAuthenticated,
  });
}
