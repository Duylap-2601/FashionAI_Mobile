import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { IReviewStats, ReviewRating } from '../types/review';
import { RatingStars } from './RatingStars';

const RATINGS: ReviewRating[] = [5, 4, 3, 2, 1];

interface ReviewStatsCardProps {
  stats?: IReviewStats;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export function ReviewStatsCard({ stats, loading, error, onRetry }: ReviewStatsCardProps) {
  if (loading && !stats) {
    return (
      <View className="mx-lg rounded-xl bg-surface-lowest p-lg">
        <Text className="text-body-sm text-on-surface-variant">Đang tải thống kê đánh giá...</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View className="mx-lg rounded-xl border border-surface-line bg-surface-lowest p-lg">
        <Text className="text-body-sm text-on-surface-variant">Chưa thể tải thống kê đánh giá.</Text>
        <Pressable className="min-h-11 justify-center" onPress={onRetry}>
          <Text className="text-label-lg text-primary-container">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  if (!stats) return null;

  return (
    <View className="mx-lg rounded-xl border border-surface-line bg-surface-lowest p-lg">
      <View className="mb-lg flex-row items-center">
        <View className="mr-xl items-center">
          <Text className="text-display text-on-surface">{stats.avgRating.toFixed(1)}</Text>
          <RatingStars value={Math.round(stats.avgRating)} />
          <Text className="mt-xs text-body-sm text-on-surface-variant">
            {stats.reviewCount} đánh giá
          </Text>
        </View>
        <View className="flex-1 gap-xs">
          {RATINGS.map((rating) => {
            const count = stats.distribution[rating];
            const percent = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
            return (
              <View key={rating} className="flex-row items-center gap-sm">
                <Text className="w-xxl text-body-sm text-on-surface-variant">{rating}★</Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface-high">
                  <View
                    className="h-2 rounded-full bg-warning"
                    style={{ width: `${percent}%` }}
                  />
                </View>
                <Text className="w-xxl text-right text-body-sm text-on-surface-variant">{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {error ? (
        <Text className="text-body-sm text-danger">Thống kê mới nhất chưa thể cập nhật.</Text>
      ) : null}
    </View>
  );
}
