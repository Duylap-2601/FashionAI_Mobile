import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import {
  useProductReviewStats,
  useProductReviews,
} from '@/features/reviews/hooks/useProductReviews';
import type { IReview } from '@/features/reviews/types/review';
import { formatDate } from '@/utils/date';

interface ProductReviewsSectionProps {
  productId: string;
  onViewAll: () => void;
}

function ReviewRow({ review }: { review: IReview }) {
  const displayName = review.user?.name?.trim() || 'Người dùng FashionAI';
  const initial = displayName.charAt(0).toLocaleUpperCase('vi-VN');

  return (
    <View className="gap-sm rounded-subtle border border-landing-line bg-ivory p-md">
      <View className="flex-row items-center gap-sm">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-paper">
          <Text className="font-sans text-body-sm font-bold text-oxblood">
            {initial}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="font-sans text-body-sm font-semibold text-obsidian"
          >
            {displayName}
          </Text>
          <Text className="font-sans text-2xs text-landing-muted">
            {formatDate(review.createdAt)}
          </Text>
        </View>
        <Text
          accessibilityLabel={`${review.rating} trên 5 sao`}
          className="font-sans text-body-sm text-brass"
        >
          {'★'.repeat(review.rating)}
          <Text className="text-taupe">
            {'★'.repeat(5 - review.rating)}
          </Text>
        </Text>
      </View>
      {review.comment ? (
        <Text
          numberOfLines={3}
          className="font-sans text-body-md leading-relaxed text-landing-muted"
        >
          {review.comment}
        </Text>
      ) : (
        <Text className="font-sans text-body-sm italic text-landing-muted">
          Không có nhận xét bằng chữ.
        </Text>
      )}
    </View>
  );
}

export function ProductReviewsSection({
  productId,
  onViewAll,
}: ProductReviewsSectionProps) {
  const reviewsQuery = useProductReviews(productId);
  const statsQuery = useProductReviewStats(productId);
  const reviews = useMemo(
    () =>
      (reviewsQuery.data?.pages.flatMap((page) => page.data) ?? []).slice(0, 3),
    [reviewsQuery.data],
  );
  const stats = statsQuery.data;
  const total = stats?.reviewCount ?? reviewsQuery.data?.pages[0]?.meta.total;

  if (reviews.length === 0) {
    return null;
  }

  return (
    <View className="gap-md border-t border-landing-line pt-xl">
      <View className="flex-row items-end justify-between gap-sm">
        <View className="flex-1 gap-xs">
          <Text
            accessibilityRole="header"
            className="font-sans text-headline-sm font-semibold text-obsidian"
          >
            Đánh giá từ khách hàng
          </Text>
          {stats && total ? (
            <View className="flex-row items-center gap-xs">
              <Text accessibilityElementsHidden className="text-body-sm text-brass">
                ★
              </Text>
              <Text className="font-mono text-body-sm tabular-nums text-obsidian">
                {stats.avgRating.toFixed(1)}
              </Text>
              <Text className="font-sans text-body-sm tabular-nums text-landing-muted">
                ({total.toLocaleString('vi-VN')} đánh giá)
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả đánh giá"
          onPress={onViewAll}
          className="min-h-11 flex-row items-center gap-xs px-xs active:opacity-70"
        >
          <Text className="font-sans text-label-md font-semibold uppercase tracking-widest text-oxblood">
            Xem tất cả
          </Text>
          <ChevronRight size={14} color={COLORS.oxblood} />
        </Pressable>
      </View>

      <View className="gap-md">
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </View>
    </View>
  );
}
