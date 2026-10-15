import React, { useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { IReview } from '../types/review';
import { RatingStars } from './RatingStars';

function formatReviewDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
}

function ReviewImage({ url, product = false }: { url: string; product?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <View className={product ? 'h-14 w-12 overflow-hidden rounded-lg border border-catalog-line bg-catalog-muted' : 'h-20 w-20 overflow-hidden rounded-xl border border-catalog-line bg-catalog-muted'}>
      {failed ? (
        <View className="flex-1 items-center justify-center">
          <Text accessibilityLabel="Không tải được ảnh" className="font-sans text-headline-sm text-catalog-muted-text">◇</Text>
        </View>
      ) : (
        // expo-image does not consume NativeWind classes; fill its token-sized wrapper.
        <Image source={{ uri: url }} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      )}
    </View>
  );
}

interface ReviewCardProps {
  review: IReview;
  owned: boolean;
  onEdit: (review: IReview) => void;
  onDelete: (review: IReview) => void;
}

export function ReviewCard({ review, owned, onEdit, onDelete }: ReviewCardProps) {
  const displayName = review.user?.name?.trim() || 'Người dùng FashionAI';
  const initial = displayName.charAt(0).toLocaleUpperCase('vi-VN');

  return (
    <Card variant="outlined" className="mx-lg !rounded-2xl !border-catalog-line !p-xxl">
      {review.product ? (
        <View className="mb-lg flex-row items-center gap-md border-b border-catalog-line pb-lg">
          {review.product.garmentUrl ? <ReviewImage url={review.product.garmentUrl} product /> : null}
          <Text className="flex-1 font-sans text-body-md font-semibold text-primary-container" numberOfLines={2}>{review.product.name}</Text>
        </View>
      ) : null}

      <View className="flex-row items-start gap-md">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-catalog-muted">
          <Text className="font-sans text-body-md font-bold text-primary-container">{initial}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-sans text-body-md font-semibold text-primary-container">{displayName}</Text>
          <Text className="mt-xs font-sans text-body-sm text-catalog-muted-text">{formatReviewDate(review.createdAt)}</Text>
        </View>
        <RatingStars value={review.rating} />
      </View>

      {review.comment ? (
        <Text className="mt-lg font-sans text-body-md leading-relaxed text-on-surface-variant">{review.comment}</Text>
      ) : (
        <Text className="mt-lg font-sans text-body-sm italic text-catalog-muted-text">
          Không có nhận xét bằng chữ.
        </Text>
      )}

      {review.images?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mt-md gap-sm"
        >
          {review.images.map((url, index) => (
            <ReviewImage key={`${url}-${index}`} url={url} />
          ))}
        </ScrollView>
      ) : null}

      {review.replies?.length ? (
        <View className="mt-lg gap-md border-t border-catalog-line pt-lg">
          {review.replies.map((reply) => (
            <View key={reply.id} className="rounded-xl border-l-2 border-primary-container bg-catalog-muted p-lg">
              <Text className="font-sans text-label-lg text-primary-container">
                {reply.user?.role === 'ADMIN' ? 'Phản hồi từ FashionAI' : reply.user?.name || 'Phản hồi'}
              </Text>
              <Text className="mt-sm font-sans text-body-sm leading-relaxed text-on-surface-variant">{reply.content}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {owned ? (
        <View className="mt-lg flex-row flex-wrap justify-end gap-sm border-t border-catalog-line pt-md">
          <Button
            title="Chỉnh sửa"
            variant="outline"
            size="sm"
            className="!rounded-xl !border-catalog-line"
            textClassName="font-sans !text-primary-container"
            onPress={() => onEdit(review)}
          />
          <Button
            title="Xóa"
            variant="ghost"
            size="sm"
            textClassName="font-sans !text-danger"
            onPress={() => onDelete(review)}
          />
        </View>
      ) : null}
    </Card>
  );
}
