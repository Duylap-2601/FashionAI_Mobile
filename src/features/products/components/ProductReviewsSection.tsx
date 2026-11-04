import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, MessageSquarePlus, Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { RatingStars } from '@/features/reviews/components/RatingStars';
import { ReviewCard } from '@/features/reviews/components/ReviewCard';
import {
  useProductReviewStats,
  useProductReviews,
} from '@/features/reviews/hooks/useProductReviews';

interface ProductReviewsSectionProps {
  productId: string;
  onViewAll: () => void;
  onWriteReview: () => void;
  writeReviewDisabled?: boolean;
}

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.14em]';
const noop = () => undefined;

/**
 * Review preview on product detail, following FE ReviewSection: brass label, Playfair title,
 * one sentence, square oxblood write action, real rating only, paper review cards.
 */
export function ProductReviewsSection({
  productId,
  onViewAll,
  onWriteReview,
  writeReviewDisabled = false,
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
  const hasRating = Boolean(stats && total && stats.avgRating > 0);

  return (
    <View className="gap-lg border-t border-landing-line pt-xl">
      <View className="gap-md border-b border-landing-line pb-5">
        <View>
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
            Đánh giá
          </Text>
          <Text
            accessibilityRole="header"
            className="mt-2 font-display text-headline-lg font-normal leading-tight text-landing-obsidian"
          >
            Đánh giá và nhận xét
          </Text>
          <Text className="mt-2 font-sans text-sm leading-relaxed text-landing-muted">
            Phản hồi thực tế từ khách hàng đã trải nghiệm sản phẩm và may đo.
          </Text>
        </View>

        {hasRating && stats && total ? (
          <View className="flex-row items-center gap-sm">
            <RatingStars value={stats.avgRating} size="sm" />
            <Text className="font-mono text-body-sm tabular-nums text-landing-obsidian">
              {stats.avgRating.toFixed(1)}
            </Text>
            <Text className="font-sans text-body-sm tabular-nums text-landing-muted">
              ({total.toLocaleString('vi-VN')} đánh giá)
            </Text>
          </View>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-sm">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Viết đánh giá sản phẩm"
            accessibilityState={{ disabled: writeReviewDisabled }}
            disabled={writeReviewDisabled}
            onPress={onWriteReview}
            className={`h-11 flex-row items-center justify-center gap-sm rounded-subtle bg-oxblood px-5 active:opacity-90 ${
              writeReviewDisabled ? 'opacity-50' : ''
            }`}
          >
            <MessageSquarePlus size={16} strokeWidth={1.75} color={COLORS.paper} />
            <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>
              Viết đánh giá
            </Text>
          </Pressable>
          {reviews.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem tất cả đánh giá"
              onPress={onViewAll}
              className="h-11 flex-row items-center gap-xs rounded-subtle border border-landing-line px-4 active:opacity-70"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>
                Xem tất cả
              </Text>
              <ChevronRight size={14} strokeWidth={1.75} color={COLORS.obsidian} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {reviews.length > 0 ? (
        <View className="gap-md">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              owned={false}
              onEdit={noop}
              onDelete={noop}
            />
          ))}
        </View>
      ) : (
        <View className="items-center gap-3 border border-landing-line bg-landing-ivory px-6 py-14">
          <Star size={28} strokeWidth={1.5} color={COLORS.oxblood} />
          <Text className="text-center font-display text-xl text-landing-obsidian">
            Chưa có đánh giá nào cho sản phẩm này
          </Text>
          <Text className="text-center font-sans text-sm leading-relaxed text-landing-muted">
            Nếu bạn đã mua và nhận sản phẩm này, hãy là người đầu tiên chia sẻ cảm nhận.
          </Text>
        </View>
      )}
    </View>
  );
}
