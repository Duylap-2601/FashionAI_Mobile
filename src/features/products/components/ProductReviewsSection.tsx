import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MessageSquarePlus } from 'lucide-react-native';
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
  onWriteReview: () => void;
  writeReviewDisabled?: boolean;
}

function ReviewAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initial = displayName.charAt(0).toLocaleUpperCase('vi-VN');

  if (avatarUrl && !failed) {
    return (
      <View className="h-8 w-8 overflow-hidden rounded-full border border-landing-line bg-paper">
        <Image
          accessibilityLabel={`Ảnh đại diện của ${displayName}`}
          source={{ uri: avatarUrl }}
          contentFit="cover"
          transition={150}
          style={StyleSheet.absoluteFill}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-paper">
      <Text className="font-sans text-body-sm font-bold text-oxblood">
        {initial}
      </Text>
    </View>
  );
}

function ReviewRow({ review }: { review: IReview }) {
  const displayName = review.user?.name?.trim() || 'Người dùng FashionAI';

  return (
    <View className="gap-sm rounded-subtle border border-landing-line bg-ivory p-md">
      <View className="flex-row items-center gap-sm">
        <ReviewAvatar
          displayName={displayName}
          avatarUrl={review.user?.avatarUrl}
        />

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

  return (
    <View className="gap-md border-t border-landing-line pt-xl">
      <View className="gap-xs">
        <Text
          accessibilityRole="header"
          className="font-display text-headline-sm text-obsidian"
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

      <View className="flex-row flex-wrap items-center gap-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Viết đánh giá sản phẩm"
          disabled={writeReviewDisabled}
          onPress={onWriteReview}
          className={`min-h-11 flex-row items-center justify-center gap-xs rounded-subtle bg-oxblood px-md active:opacity-85 ${
            writeReviewDisabled ? 'opacity-50' : ''
          }`}
        >
          <MessageSquarePlus size={14} color={COLORS.paper} />
          <Text className="font-sans text-label-md font-semibold uppercase tracking-widest text-paper">
            Viết đánh giá
          </Text>
        </Pressable>
        {reviews.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả đánh giá"
            onPress={onViewAll}
            className="min-h-11 flex-row items-center gap-xs rounded-subtle border border-landing-line px-md active:opacity-70"
          >
            <Text className="font-sans text-label-md font-semibold uppercase tracking-widest text-oxblood">
              Xem tất cả
            </Text>
            <ChevronRight size={14} color={COLORS.oxblood} />
          </Pressable>
        ) : null}
      </View>

      {reviews.length > 0 ? (
        <View className="gap-md">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </View>
      ) : (
        <View className="rounded-subtle border border-landing-line bg-ivory p-md">
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            Chưa có đánh giá nào cho sản phẩm này. Nếu bạn đã mua và nhận hàng,
            hãy chia sẻ cảm nhận đầu tiên.
          </Text>
        </View>
      )}
    </View>
  );
}
