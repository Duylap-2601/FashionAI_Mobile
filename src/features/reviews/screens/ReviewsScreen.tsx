import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessageSquarePlus } from 'lucide-react-native';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RatingFilter } from '../components/RatingFilter';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewEmptyState } from '../components/ReviewEmptyState';
import { ReviewStatsCard } from '../components/ReviewStatsCard';
import { useCanReviewProduct } from '../hooks/useCanReviewProduct';
import { useProductReviews, useProductReviewStats } from '../hooks/useProductReviews';
import {
  useCreateReview,
  useDeleteReview,
  useUpdateReview,
} from '../hooks/useReviewMutations';
import type { CreateReviewFormValues } from '../schemas/review.schema';
import type { IReview, ReviewRating } from '../types/review';

type Props = NativeStackScreenProps<RootStackParamList, 'Reviews'>;

const BUTTON_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.14em]';

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function ReviewsScreen({ navigation, route }: Props) {
  const productId = route.params.productId.trim();
  const { user } = useAuth();
  const [rating, setRating] = useState<ReviewRating>();
  const [writing, setWriting] = useState(
    Boolean(route.params.startWriting),
  );
  const [editing, setEditing] = useState<IReview | null>(null);
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [eligibilityModal, setEligibilityModal] = useState<
    'already_reviewed' | 'not_purchased' | null
  >(null);
  const reviewsQuery = useProductReviews(productId, rating);
  const statsQuery = useProductReviewStats(productId);
  const reviewEligibility = useCanReviewProduct(productId);
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();

  const handleToggleWriting = useCallback(() => {
    createMutation.reset();
    setEditing(null);
    setEditImages([]);

    if (writing) {
      setWriting(false);
      return;
    }

    setCreateImages([]);

    if (reviewEligibility.isLoading) {
      return;
    }

    if (!reviewEligibility.canReview) {
      setEligibilityModal(
        reviewEligibility.reason === 'already_reviewed'
          ? 'already_reviewed'
          : 'not_purchased',
      );
      return;
    }

    setWriting(true);
  }, [createMutation, reviewEligibility, writing]);

  const reviews = useMemo(
    () => reviewsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [reviewsQuery.data],
  );

  const refresh = useCallback(() => {
    void Promise.all([reviewsQuery.refetch(), statsQuery.refetch()]);
  }, [reviewsQuery, statsQuery]);

  const loadMore = useCallback(() => {
    if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
      void reviewsQuery.fetchNextPage();
    }
  }, [reviewsQuery]);

  const submitCreate = useCallback(
    async (values: CreateReviewFormValues) => {
      try {
        const comment = values.comment.trim();
        await createMutation.mutateAsync({
          productId,
          input: {
            rating: values.rating as ReviewRating,
            ...(comment ? { comment } : {}),
            ...(createImages.length > 0 ? { images: createImages } : {}),
            ...(reviewEligibility.eligibleOrderId
              ? { orderId: reviewEligibility.eligibleOrderId }
              : {}),
          },
        });
        setCreateImages([]);
        setWriting(false);
      } catch {
        // Mutation state renders the authoritative backend eligibility/permission error.
      }
    },
    [createMutation, createImages, productId, reviewEligibility.eligibleOrderId],
  );

  const submitEdit = useCallback(
    async (values: CreateReviewFormValues) => {
      if (!editing) return;
      try {
        await updateMutation.mutateAsync({
          reviewId: editing.id,
          productId: editing.productId,
          input: { comment: values.comment.trim(), images: editImages },
        });
        setEditing(null);
        setEditImages([]);
      } catch {
        // Mutation state renders the backend ownership error.
      }
    },
    [editImages, editing, updateMutation],
  );

  const confirmDelete = useCallback(
    (review: IReview) => {
      // Wording mirrors FE ReviewSection › AccountConfirmDialog.
      Alert.alert(
        'Xóa đánh giá',
        'Bạn có chắc chắn muốn xóa đánh giá này? Sau khi xóa, bạn có thể đánh giá lại sản phẩm này.',
        [
          { text: 'Giữ lại', style: 'cancel' },
          {
            text: 'Xóa đánh giá',
            style: 'destructive',
            onPress: () => {
              void deleteMutation
                .mutateAsync({ reviewId: review.id, productId: review.productId })
                .catch((error: unknown) => {
                  Alert.alert('Không thể xóa đánh giá', getErrorMessage(error));
                });
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

  if (!productId) {
    return (
      <View className="flex-1 justify-center bg-landing-ivory">
        <ReviewEmptyState
          tone="error"
          title="Không thể mở đánh giá"
          description="Thông tin sản phẩm không hợp lệ."
        />
      </View>
    );
  }

  if (reviewsQuery.isLoading && reviews.length === 0) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Đang tải đánh giá"
        className="flex-1 items-center justify-center bg-landing-ivory"
      >
        <ActivityIndicator size="large" color={COLORS.oxblood} />
        <Text className="mt-md font-sans text-body-sm text-landing-muted">Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (reviewsQuery.isError && reviews.length === 0) {
    return (
      <View className="flex-1 justify-center bg-landing-ivory">
        <ReviewEmptyState
          tone="error"
          title="Chưa thể tải đánh giá"
          description={getErrorMessage(reviewsQuery.error)}
          actionLabel="Thử lại"
          onAction={() => void reviewsQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <>
      <FlatList
        className="flex-1 bg-landing-ivory"
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-lg pb-xxxl"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View className="gap-8 pb-sm pt-xl">
            <View className="mx-lg border-b border-landing-line pb-5">
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
                Đánh giá
              </Text>
              <Text accessibilityRole="header" className="mt-2 font-display text-headline-lg text-landing-obsidian">
                Đánh giá và nhận xét
              </Text>
              <Text className="mt-2 font-sans text-sm leading-relaxed text-landing-muted">
                Phản hồi thực tế từ khách hàng đã trải nghiệm sản phẩm và may đo.
              </Text>
              <View className="mt-5 flex-row flex-wrap gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={writing ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
                  accessibilityState={{ expanded: writing }}
                  onPress={handleToggleWriting}
                  className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-5 active:opacity-90"
                >
                  <MessageSquarePlus size={16} strokeWidth={1.75} color={COLORS.paper} />
                  <Text className={`${BUTTON_LABEL_CLASS} text-landing-paper`}>
                    {writing ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đánh giá của tôi"
                  onPress={() => navigation.navigate('MyReviews')}
                  className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
                >
                  <Text className={`${BUTTON_LABEL_CLASS} text-landing-obsidian`}>Đánh giá của tôi</Text>
                </Pressable>
              </View>
            </View>

            {writing ? (
              <View className="mx-lg">
                <ReviewForm
                  mode="create"
                  submitting={createMutation.isPending}
                  errorMessage={createMutation.isError ? getErrorMessage(createMutation.error) : undefined}
                  images={createImages}
                  onChangeImages={setCreateImages}
                  onSubmit={submitCreate}
                  onCancel={() => setWriting(false)}
                />
              </View>
            ) : null}

            <ReviewStatsCard
              stats={statsQuery.data}
              loading={statsQuery.isLoading}
              error={statsQuery.isError}
              selectedRating={rating}
              onRetry={() => void statsQuery.refetch()}
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
                Lọc theo
              </Text>
              <RatingFilter value={rating} onChange={setRating} stats={statsQuery.data} />
            </ReviewStatsCard>

            {reviewsQuery.isError ? (
              <View accessibilityRole="alert" className="mx-lg border-l-2 border-danger bg-landing-paper px-md py-sm">
                <Text className="font-sans text-body-sm text-danger">
                  Chưa thể cập nhật danh sách mới nhất. Nội dung đã tải vẫn được giữ lại.
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View className="gap-sm">
            <ReviewCard
              review={item}
              owned={item.userId === user?.id}
              onEdit={(review) => {
                updateMutation.reset();
                setWriting(false);
                setEditImages(Array.isArray(review.images) ? review.images : []);
                setEditing(review);
              }}
              onDelete={confirmDelete}
            />
            {editing?.id === item.id ? (
              <View className="mx-lg">
                <ReviewForm
                  mode="edit"
                  initialRating={item.rating}
                  initialComment={item.comment}
                  submitting={updateMutation.isPending}
                  errorMessage={updateMutation.isError ? getErrorMessage(updateMutation.error) : undefined}
                  images={editImages}
                  onChangeImages={setEditImages}
                  onSubmit={submitEdit}
                  onCancel={() => {
                    setEditing(null);
                    setEditImages([]);
                  }}
                />
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <ReviewEmptyState
            title={rating ? `Chưa có đánh giá ${rating} sao nào` : 'Chưa có đánh giá nào cho sản phẩm này'}
            description={
              rating
                ? 'Hãy thử chọn mức sao khác hoặc xem tất cả đánh giá.'
                : 'Nếu bạn đã mua và nhận sản phẩm này, hãy là người đầu tiên chia sẻ cảm nhận.'
            }
            actionLabel={writing ? undefined : 'Viết đánh giá'}
            actionIcon
            onAction={writing ? undefined : handleToggleWriting}
          />
        }
        ListFooterComponent={
          reviewsQuery.isFetchingNextPage ? (
            <ActivityIndicator className="py-lg" color={COLORS.oxblood} />
          ) : null
        }
      />
      <FeedbackModal
        visible={eligibilityModal !== null}
        type="info"
        title={
          eligibilityModal === 'already_reviewed'
            ? 'Bạn đã đánh giá sản phẩm này'
            : 'Chỉ khách đã mua và nhận hàng mới được đánh giá'
        }
        message={
          eligibilityModal === 'already_reviewed'
            ? 'Bạn có thể chỉnh sửa đánh giá đã gửi trong mục Đánh giá của tôi.'
            : 'Đơn hàng cần ở trạng thái đã hoàn tất trước khi bạn có thể chia sẻ cảm nhận.'
        }
        dismissible
        onClose={() => setEligibilityModal(null)}
        primaryButtonText="Đã hiểu"
        onPrimaryPress={() => setEligibilityModal(null)}
      />
    </>
  );
}
