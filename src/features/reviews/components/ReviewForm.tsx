import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ImagePlus, X } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/constants/theme';
import {
  describeEvidenceRejection,
  MAX_REVIEW_IMAGES,
} from '@/features/orders/utils/evidence-images';
import { pickReviewImages } from '../utils/review-images';
import {
  createReviewSchema,
  type CreateReviewFormValues,
} from '../schemas/review.schema';
import type { ReviewRating } from '../types/review';
import { RatingStars } from './RatingStars';

// Same wording as FE reviews/constants/write-review-modal.ts › RATING_LABELS.
const RATING_LABELS: Record<ReviewRating, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng, vừa vặn',
  5: 'Cực kỳ ưng ý & chất lượng',
};

const BUTTON_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

function getRatingLabel(value: number): string {
  return RATING_LABELS[value as ReviewRating] ?? '';
}

interface ReviewFormProps {
  mode: 'create' | 'edit';
  initialRating?: ReviewRating;
  initialComment?: string | null;
  submitting: boolean;
  errorMessage?: string;
  images?: string[];
  onChangeImages?: (images: string[]) => void;
  onSubmit: (values: CreateReviewFormValues) => Promise<void>;
  onCancel: () => void;
}

/** Biểu mẫu đánh giá theo FE WriteReviewModal: nhãn brass, khối chọn sao giữa hai đường kẻ, nút vuông. */
export function ReviewForm({
  mode,
  initialRating = 5,
  initialComment,
  submitting,
  errorMessage,
  images = [],
  onChangeImages,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const canAddImages = Boolean(onChangeImages) && images.length < MAX_REVIEW_IMAGES;

  const handleAddImages = async () => {
    if (!onChangeImages) return;
    const result = await pickReviewImages(MAX_REVIEW_IMAGES - images.length);
    if (result.cancelled) return;

    setImageError(describeEvidenceRejection(result.rejectedSize, result.rejectedType));
    if (result.images.length > 0) {
      onChangeImages([...images, ...result.images].slice(0, MAX_REVIEW_IMAGES));
    }
  };

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
    <View className="gap-6 border border-landing-line bg-landing-paper p-5">
      <View>
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          {mode === 'create' ? 'Đánh giá sản phẩm' : 'Sửa đánh giá'}
        </Text>
        <Text accessibilityRole="header" className="mt-1.5 font-display text-2xl leading-tight text-landing-obsidian">
          {mode === 'create' ? 'Viết đánh giá' : 'Chỉnh sửa đánh giá'}
        </Text>
      </View>

      <View className="items-center border-y border-landing-line py-5">
        <Text className="text-center font-sans text-sm text-landing-obsidian">Bạn thấy sản phẩm thế nào?</Text>
        {mode === 'create' ? (
          <Controller
            control={control}
            name="rating"
            render={({ field: { value, onChange } }) => (
              <View className="mt-2 items-center">
                <RatingStars value={value} onChange={onChange} size="lg" />
                <Text
                  accessibilityLiveRegion="polite"
                  className="mt-1 text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] text-landing-oxblood"
                >
                  {getRatingLabel(value)}
                </Text>
                {errors.rating?.message ? (
                  <Text className="mt-1 font-sans text-body-sm text-danger">{errors.rating.message}</Text>
                ) : null}
              </View>
            )}
          />
        ) : (
          <View className="mt-3 items-center">
            <RatingStars value={initialRating} size="lg" />
            <Text className="mt-2 text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] text-landing-oxblood">
              {getRatingLabel(initialRating)}
            </Text>
            <Text className="mt-2 text-center font-sans text-body-sm text-landing-muted">
              Số sao không thể thay đổi sau khi gửi.
            </Text>
          </View>
        )}
      </View>

      <Controller
        control={control}
        name="comment"
        render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <Text className="mb-1.5 font-sans text-sm font-medium text-landing-obsidian">
              Nhận xét <Text className="font-normal text-landing-muted">(không bắt buộc)</Text>
            </Text>
            <Input
              accessibilityLabel="Nhận xét"
              placeholder="Chất liệu vải, đường may, độ vừa với số đo, giao hàng..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.comment?.message}
              containerClassName="!mb-0"
              className="min-h-24 font-sans !text-sm leading-relaxed !text-landing-obsidian"
              fieldContainerClassName="!rounded-subtle !border-landing-line !bg-landing-ivory"
            />
          </View>
        )}
      />

      {onChangeImages ? (
        <View>
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className="font-sans text-sm font-medium text-landing-obsidian">
              Ảnh thực tế{' '}
              <Text className="font-mono text-[11px] font-normal text-landing-muted">
                {images.length}/{MAX_REVIEW_IMAGES}
              </Text>
            </Text>
          </View>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {images.map((url, index) => (
              <View
                key={`${index}-${url.slice(-16)}`}
                className="h-16 w-16 overflow-hidden rounded-subtle border border-landing-line bg-landing-ivory"
              >
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  accessibilityLabel={`Ảnh ${index + 1} của đánh giá`}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xóa ảnh ${index + 1}`}
                  disabled={submitting}
                  onPress={() => {
                    setImageError(null);
                    onChangeImages(images.filter((_, imageIndex) => imageIndex !== index));
                  }}
                  hitSlop={6}
                  className="absolute right-0 top-0 h-6 w-6 items-center justify-center bg-landing-obsidian/70 active:opacity-70"
                >
                  <X size={12} strokeWidth={2} color={COLORS.paper} />
                </Pressable>
              </View>
            ))}

            {canAddImages ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thêm ảnh thực tế"
                disabled={submitting}
                onPress={() => void handleAddImages()}
                className="h-16 w-16 items-center justify-center gap-1 rounded-subtle border border-dashed border-taupe bg-landing-ivory active:opacity-70 disabled:opacity-50"
              >
                <ImagePlus size={16} strokeWidth={1.75} color={COLORS.muted} />
                <Text className="font-sans text-[10px] text-landing-muted">Tải ảnh</Text>
              </Pressable>
            ) : null}
          </View>
          {imageError ? (
            <Text className="mt-1.5 font-sans text-[11.5px] leading-relaxed text-danger">
              {imageError}
            </Text>
          ) : null}
        </View>
      ) : null}

      {errorMessage ? (
        <View accessibilityRole="alert" className="border-l-2 border-danger bg-landing-ivory px-md py-sm">
          <Text className="font-sans text-body-sm text-danger">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="flex-col-reverse gap-2 border-t border-landing-line pt-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hủy"
          accessibilityState={{ disabled: submitting }}
          disabled={submitting}
          onPress={onCancel}
          className={`h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70 ${
            submitting ? 'opacity-50' : ''
          }`}
        >
          <Text className={`${BUTTON_LABEL_CLASS} text-landing-obsidian`}>Hủy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'create' ? 'Gửi đánh giá' : 'Lưu thay đổi'}
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          className={`h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-5 active:opacity-90 ${
            submitting ? 'opacity-50' : ''
          }`}
        >
          {submitting ? <ActivityIndicator size="small" color={COLORS.paper} /> : null}
          <Text className={`${BUTTON_LABEL_CLASS} text-landing-paper`}>
            {mode === 'create' ? 'Gửi đánh giá' : 'Lưu thay đổi'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
