import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { IReview } from '../types/review';
import { RatingStars } from './RatingStars';

function formatReviewDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
}

function ReviewImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View className="h-24 w-24 items-center justify-center rounded-lg bg-surface-low">
        <Text className="text-body-sm text-on-surface-variant">Không tải được ảnh</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      contentFit="cover"
      transition={150}
      className="h-24 w-24 rounded-lg bg-surface-low"
      onError={() => setFailed(true)}
    />
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
    <View className="mx-lg rounded-xl border border-surface-line bg-surface-lowest p-lg">
      {review.product ? (
        <Text className="mb-md text-label-lg text-primary-container" numberOfLines={2}>
          {review.product.name}
        </Text>
      ) : null}

      <View className="flex-row items-start">
        <View className="mr-md h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
          <Text className="text-headline-sm text-primary-strong">{initial}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-label-lg text-on-surface">{displayName}</Text>
          <RatingStars value={review.rating} />
        </View>
        <Text className="text-body-sm text-on-surface-variant">
          {formatReviewDate(review.createdAt)}
        </Text>
      </View>

      {review.comment ? (
        <Text className="mt-md text-body-md text-on-surface">{review.comment}</Text>
      ) : (
        <Text className="mt-md italic text-body-sm text-on-surface-variant">
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
        <View className="mt-lg gap-sm border-l-2 border-primary-soft-strong pl-md">
          {review.replies.map((reply) => (
            <View key={reply.id} className="rounded-lg bg-surface-low p-md">
              <Text className="text-label-lg text-on-surface">
                {reply.user?.role === 'ADMIN' ? 'Phản hồi từ FashionAI' : reply.user?.name || 'Phản hồi'}
              </Text>
              <Text className="mt-xs text-body-sm text-on-surface">{reply.content}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {owned ? (
        <View className="mt-md flex-row justify-end gap-sm border-t border-surface-line pt-sm">
          <Pressable
            accessibilityRole="button"
            className="min-h-11 justify-center px-md"
            onPress={() => onEdit(review)}
          >
            <Text className="text-label-lg text-primary-container">Chỉnh sửa</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 justify-center px-md"
            onPress={() => onDelete(review)}
          >
            <Text className="text-label-lg text-danger">Xóa</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
