import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getErrorMessage } from '@/utils/error-message';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { useCreateReview } from '@/features/reviews/hooks/useReviewMutations';
import type { CreateReviewFormValues } from '@/features/reviews/schemas/review.schema';
import type { ReviewRating } from '@/features/reviews/types/review';

const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';

interface Props {
  visible: boolean;
  onClose: () => void;
  orderId: string | number;
  productId: string | number;
  productName: string;
  productImage?: string;
  onSuccess?: () => void;
}

/** Đánh giá sản phẩm ngay từ đơn đã hoàn tất, gắn orderId để BE xác thực đã mua. */
export function OrderReviewModal({
  visible,
  onClose,
  orderId,
  productId,
  productName,
  productImage,
  onSuccess,
}: Props) {
  const { mutateAsync, isPending } = useCreateReview();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleClose = () => {
    setImages([]);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (values: CreateReviewFormValues) => {
    setErrorMsg(null);
    try {
      await mutateAsync({
        productId: String(productId),
        input: {
          rating: values.rating as ReviewRating,
          comment: values.comment.trim() || undefined,
          images: images.length > 0 ? images : undefined,
          orderId,
        },
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Không thể gửi đánh giá. Vui lòng thử lại sau.'));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!isPending) handleClose();
      }}
    >
      <SafeAreaView className="flex-1 bg-landing-paper">
        <View className="flex-row items-start justify-between gap-3 border-b border-landing-line px-5 pb-4 pt-5">
          <View className="min-w-0 flex-1 gap-1">
            <Text className={LABEL_CLASS}>Đánh giá sản phẩm</Text>
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              className="font-display text-[24px] leading-tight text-landing-obsidian"
            >
              {productName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            accessibilityState={{ disabled: isPending }}
            disabled={isPending}
            onPress={handleClose}
            className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
          >
            <X size={18} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {productImage ? (
            <View className="flex-row items-center gap-3">
              <View className="h-[72px] w-14 overflow-hidden rounded-subtle border border-landing-line bg-landing-ivory">
                <Image
                  source={{ uri: productImage }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <Text className="flex-1 font-sans text-[12px] leading-relaxed text-landing-muted">
                Đánh giá dựa trên sản phẩm bạn đã nhận trong đơn này.
              </Text>
            </View>
          ) : null}

          <ReviewForm
            mode="create"
            submitting={isPending}
            errorMessage={errorMsg ?? undefined}
            images={images}
            onChangeImages={setImages}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
