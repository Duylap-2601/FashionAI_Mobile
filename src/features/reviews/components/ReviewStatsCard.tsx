import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { IReviewStats, ReviewRating } from '../types/review';
import { RatingStars } from './RatingStars';

const RATINGS: ReviewRating[] = [5, 4, 3, 2, 1];

interface ReviewStatsCardProps {
  stats?: IReviewStats;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Mức sao đang lọc; thanh của mức đó được tô oxblood như FE RatingOverview. */
  selectedRating?: ReviewRating;
  children?: React.ReactNode;
}

/** Tổng quan đánh giá theo FE RatingOverview: điểm mono lớn, sao, phân bố oxblood/taupe. */
export function ReviewStatsCard({
  stats,
  loading,
  error,
  onRetry,
  selectedRating,
  children,
}: ReviewStatsCardProps) {
  return (
    <View className="mx-lg border border-landing-line bg-landing-ivory p-5">
      {loading && !stats ? (
        <View className="items-center gap-md py-xxl">
          <ActivityIndicator color={COLORS.oxblood} />
          <Text className="font-sans text-body-sm text-landing-muted">Đang tải thống kê đánh giá...</Text>
        </View>
      ) : error && !stats ? (
        <View className="items-center gap-xs py-lg">
          <Text className="text-center font-sans text-body-sm text-landing-muted">
            Chưa thể tải thống kê đánh giá.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử tải lại thống kê đánh giá"
            onPress={onRetry}
            className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
          >
            <Text className="font-sans text-body-sm font-bold text-oxblood">Thử lại</Text>
          </Pressable>
        </View>
      ) : stats ? (
        <View className="gap-8">
          <View className="items-center">
            <Text className="font-mono text-[56px] font-medium leading-none tracking-tight text-landing-obsidian">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0.0'}
            </Text>
            <View className="mt-3">
              <RatingStars value={stats.avgRating} size="lg" />
            </View>
            <Text className="mt-2 font-sans text-xs text-landing-muted">
              {stats.reviewCount > 0
                ? `Dựa trên ${stats.reviewCount} lượt đánh giá`
                : 'Chưa có lượt đánh giá nào'}
            </Text>
          </View>

          <View className="gap-2.5">
            {RATINGS.map((rating) => {
              const count = stats.distribution[rating];
              const percent = stats.reviewCount > 0 ? Math.round((count / stats.reviewCount) * 100) : 0;
              const isRowSelected = selectedRating === rating;
              return (
                <View
                  key={rating}
                  accessible
                  accessibilityLabel={`${rating} sao, ${count} đánh giá, ${percent} phần trăm`}
                  className="flex-row items-center gap-3"
                >
                  <View className="w-10 flex-row items-center gap-1">
                    <Text className="font-mono text-xs text-landing-muted">{rating}</Text>
                    <Star size={12} strokeWidth={1.75} color={COLORS.oxblood} fill={COLORS.oxblood} />
                  </View>
                  <View className="h-2 flex-1 overflow-hidden bg-landing-paper">
                    {/* Computed width: the bar mirrors the real share of this rating. */}
                    <View
                      className={`h-full ${isRowSelected ? 'bg-oxblood' : 'bg-taupe'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </View>
                  <Text className="w-10 text-right font-mono text-[11px] text-landing-muted">{percent}%</Text>
                  <Text className="w-9 text-right font-mono text-[11px] text-landing-muted">({count})</Text>
                </View>
              );
            })}
          </View>

          {error ? (
            <View className="border-l-2 border-danger bg-landing-paper px-md py-sm">
              <Text className="font-sans text-body-sm text-danger">Thống kê mới nhất chưa thể cập nhật.</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {children ? <View className="mt-7 gap-sm border-t border-landing-line pt-5">{children}</View> : null}
    </View>
  );
}
