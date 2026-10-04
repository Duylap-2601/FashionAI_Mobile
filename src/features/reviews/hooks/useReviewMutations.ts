import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productKeys } from '@/features/products/api/products.api';
import { createReview, deleteReview, updateReview } from '../api/reviews.api';
import { reviewKeys } from '../api/review.keys';
import type { CreateReviewInput, UpdateReviewInput } from '../types/review';

function useReviewInvalidation() {
  const queryClient = useQueryClient();

  return {
    content(productId: string) {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.product(productId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.myLists() }),
      ]);
    },
    rating(productId: string) {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.product(productId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.stats(productId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.myLists() }),
        queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
      ]);
    },
  };
}

export function useCreateReview() {
  const invalidate = useReviewInvalidation();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: CreateReviewInput }) =>
      createReview(productId, input),
    onSuccess: (_review, variables) => invalidate.rating(variables.productId),
  });
}

export function useUpdateReview() {
  const invalidate = useReviewInvalidation();
  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; productId: string; input: UpdateReviewInput }) =>
      updateReview(reviewId, input),
    onSuccess: (_review, variables) => invalidate.content(variables.productId),
  });
}

export function useDeleteReview() {
  const invalidate = useReviewInvalidation();
  return useMutation({
    mutationFn: ({ reviewId }: { reviewId: string; productId: string }) =>
      deleteReview(reviewId),
    onSuccess: (_result, variables) => invalidate.rating(variables.productId),
  });
}
