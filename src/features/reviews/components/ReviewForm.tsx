import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  createReviewSchema,
  type CreateReviewFormValues,
} from '../schemas/review.schema';
import type { ReviewRating } from '../types/review';
import { RatingStars } from './RatingStars';

interface ReviewFormProps {
  mode: 'create' | 'edit';
  initialRating?: ReviewRating;
  initialComment?: string | null;
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (values: CreateReviewFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ReviewForm({
  mode,
  initialRating = 5,
  initialComment,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReviewFormValues>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { rating: initialRating, comment: initialComment ?? '' },
  });

  useEffect(() => {
    reset({ rating: initialRating, comment: initialComment ?? '' });
  }, [initialComment, initialRating, reset]);

  return (
    <View className="rounded-xl border border-outline-variant bg-surface-lowest p-lg">
      <Text className="mb-md text-headline-sm text-on-surface">
        {mode === 'create' ? 'Viết đánh giá' : 'Chỉnh sửa đánh giá'}
      </Text>

      {mode === 'create' ? (
        <Controller
          control={control}
          name="rating"
          render={({ field: { value, onChange } }) => (
            <View className="mb-md">
              <Text className="mb-xs text-label-lg text-on-surface">Mức đánh giá</Text>
              <RatingStars value={value} onChange={onChange} size="lg" />
              {errors.rating?.message ? (
                <Text className="text-body-sm text-danger">{errors.rating.message}</Text>
              ) : null}
            </View>
          )}
        />
      ) : (
        <View className="mb-md">
          <Text className="text-label-lg text-on-surface">Mức đánh giá</Text>
          <RatingStars value={initialRating} />
          <Text className="mt-xs text-body-sm text-on-surface-variant">
            Số sao không thể thay đổi sau khi gửi.
          </Text>
        </View>
      )}

      <Controller
        control={control}
        name="comment"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Nhận xét"
            placeholder="Chia sẻ trải nghiệm của bạn..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.comment?.message}
            className="min-h-24"
          />
        )}
      />

      {errorMessage ? (
        <Text accessibilityRole="alert" className="mb-md text-body-sm text-danger">
          {errorMessage}
        </Text>
      ) : null}

      <View className="flex-row gap-sm">
        <Button
          title="Hủy"
          variant="outline"
          className="flex-1"
          disabled={submitting}
          onPress={onCancel}
        />
        <Button
          title={mode === 'create' ? 'Gửi đánh giá' : 'Lưu thay đổi'}
          className="flex-1"
          textClassName="text-on-primary"
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}
