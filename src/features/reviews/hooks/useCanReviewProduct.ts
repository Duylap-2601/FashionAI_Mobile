import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOrders } from '@/features/orders/hooks/use-orders';
import type { IOrder, IOrderItem } from '@/features/orders/types/order';
import { getMyReviews } from '../api/reviews.api';
import { reviewKeys } from '../api/review.keys';

export type ReviewEligibilityReason =
  | 'eligible'
  | 'not_authenticated'
  | 'not_purchased_or_delivered'
  | 'already_reviewed'
  | 'loading';

export interface ReviewEligibility {
  canReview: boolean;
  eligibleOrderId: string | number | null;
  reason: ReviewEligibilityReason;
  isLoading: boolean;
}

export function useCanReviewProduct(productId: string): ReviewEligibility {
  const { isAuthenticated } = useAuth();
  const { orders, isLoading: ordersLoading } = useOrders();
  const myReviewsQuery = useQuery({
    queryKey: reviewKeys.myList({ limit: 100 }),
    queryFn: ({ signal }) =>
      getMyReviews({ page: 1, limit: 100 }, { signal }),
    enabled: isAuthenticated,
  });

  return useMemo(() => {
    if (!isAuthenticated) {
      return {
        canReview: false,
        eligibleOrderId: null,
        reason: 'not_authenticated',
        isLoading: false,
      };
    }

    if (ordersLoading || myReviewsQuery.isLoading) {
      return {
        canReview: false,
        eligibleOrderId: null,
        reason: 'loading',
        isLoading: true,
      };
    }

    const deliveredOrders = orders.filter(
      (order: IOrder) =>
        order.status === 'COMPLETED' &&
        order.items.some(
          (item: IOrderItem) => String(item.productId) === String(productId),
        ),
    );

    if (deliveredOrders.length === 0) {
      return {
        canReview: false,
        eligibleOrderId: null,
        reason: 'not_purchased_or_delivered',
        isLoading: false,
      };
    }

    const myReviews = myReviewsQuery.data?.data ?? [];
    const reviewedOrderIds = new Set(
      myReviews
        .filter((review) => String(review.productId) === String(productId))
        .map((review) => String(review.orderId)),
    );
    const availableOrders = deliveredOrders.filter(
      (order) => !reviewedOrderIds.has(String(order.id)),
    );

    if (availableOrders.length === 0) {
      return {
        canReview: false,
        eligibleOrderId: null,
        reason: 'already_reviewed',
        isLoading: false,
      };
    }

    return {
      canReview: true,
      eligibleOrderId: availableOrders[0].id,
      reason: 'eligible',
      isLoading: false,
    };
  }, [
    isAuthenticated,
    myReviewsQuery.data,
    myReviewsQuery.isLoading,
    orders,
    ordersLoading,
    productId,
  ]);
}
