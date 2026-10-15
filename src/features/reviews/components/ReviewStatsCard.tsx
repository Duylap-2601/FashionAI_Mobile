import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/theme';
import type { IReviewStats, ReviewRating } from '../types/review';
import { RatingStars } from './RatingStars';

const RATINGS: ReviewRating[] = [5, 4, 3, 2, 1];

interface ReviewStatsCardProps {
  stats?: IReviewStats;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  children?: React.ReactNode;
}

export function ReviewStatsCard({ stats, loading, error, onRetry, children }: ReviewStatsCardProps) {
  return (
    <Card variant="outlined" className="mx-lg !rounded-2xl !border-catalog-line !bg-catalog-muted !p-xxl">
      {loading && !stats ? (
        <View className="items-center gap-md py-xxl">
          <ActivityIndicator color={COLORS.primaryContainer} />
          <Text className="font-sans text-body-sm text-catalog-muted-text">Đang tải thống kê đánh giá...</Text>
        </View>
      ) : error && !stats ? (
        <View className="items-center gap-sm py-lg">
          <Text className="font-sans text-body-sm text-on-surface-variant">Chưa thể tải thống kê đánh giá.</Text>
          <Button title="Thử lại" variant="ghost" size="sm" textClassName="font-sans !text-primary-container" onPress={onRetry} />
        </View>
      ) : stats ? (
        <View className="gap-xxxl">
          <View className="items-center gap-sm">
            <Text className="font-sans text-6xl font-bold tabular-nums text-primary-container">{stats.avgRating.toFixed(1)}</Text>
            <RatingStars value={Math.round(stats.avgRating)} />
            <Text className="font-sans text-body-sm text-catalog-muted-text">
              {stats.reviewCount > 0 ? `Dựa trên ${stats.reviewCount} lượt đánh giá` : 'Chưa có lượt đánh giá nào'}
            </Text>
          </View>
          <View className="gap-md">
            {RATINGS.map((rating) => {
              const count = stats.distribution[rating];
              const percent = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
              return (
                <View key={rating} className="flex-row items-center gap-sm" accessibilityLabel={`${rating} sao, ${count} đánh giá, ${Math.round(percent)} phần trăm`}>
                  <Text className="w-8 font-sans text-body-sm text-on-surface-variant">{rating} <Text className="text-warning">★</Text></Text>
                  <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                    <View className="h-full rounded-full bg-warning" style={{ width: `${percent}%` }} />
                  </View>
                  <Text className="w-9 text-right font-sans text-body-sm tabular-nums text-catalog-muted-text">{Math.round(percent)}%</Text>
                  <Text className="w-8 text-right font-sans text-body-sm tabular-nums text-catalog-muted-text">({count})</Text>
                </View>
              );
            })}
          </View>
          {error ? <Text className="font-sans text-body-sm text-danger">Thống kê mới nhất chưa thể cập nhật.</Text> : null}
        </View>
      ) : null}
      {children ? <View className="mt-xxl gap-md border-t border-catalog-line pt-xxl">{children}</View> : null}
    </Card>
  );
}
