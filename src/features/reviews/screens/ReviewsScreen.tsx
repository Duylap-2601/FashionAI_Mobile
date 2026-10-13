import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RatingFilter } from '../components/RatingFilter';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewEmptyState } from '../components/ReviewEmptyState';
import { ReviewStatsCard } from '../components/ReviewStatsCard';
import { useProductReviews, useProductReviewStats } from '../hooks/useProductReviews';
import {
  useCreateReview,
  useDeleteReview,
  useUpdateReview,
} from '../hooks/useReviewMutations';
import type { CreateReviewFormValues } from '../schemas/review.schema';
import type { IReview, ReviewRating } from '../types/review';

type Props = NativeStackScreenProps<RootStackParamList, 'Reviews'>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function ReviewsScreen({ navigation, route }: Props) {
  const productId = route.params.productId.trim();
  const { user } = useAuth();
  const [rating, setRating] = useState<ReviewRating>();
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<IReview | null>(null);
  const reviewsQuery = useProductReviews(productId, rating);
  const statsQuery = useProductReviewStats(productId);
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();

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
          input: { rating: values.rating as ReviewRating, ...(comment ? { comment } : {}) },
        });
        setWriting(false);
      } catch {
        // Mutation state renders the authoritative backend eligibility/permission error.
      }
    },
    [createMutation, productId],
  );

  const submitEdit = useCallback(
    async (values: CreateReviewFormValues) => {
      if (!editing) return;
      try {
        await updateMutation.mutateAsync({
          reviewId: editing.id,
          productId: editing.productId,
          input: { comment: values.comment.trim() },
        });
        setEditing(null);
      } catch {
        // Mutation state renders the backend ownership error.
      }
    },
    [editing, updateMutation],
  );

  const confirmDelete = useCallback(
    (review: IReview) => {
      Alert.alert('Xóa đánh giá?', 'Đánh giá đã xóa không thể khôi phục.', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void deleteMutation
              .mutateAsync({ reviewId: review.id, productId: review.productId })
              .catch((error: unknown) => {
                Alert.alert('Không thể xóa đánh giá', getErrorMessage(error));
              });
          },
        },
      ]);
    },
    [deleteMutation],
  );

  if (!productId) {
    return (
      <ErrorView
        fullscreen
        title="Không thể mở đánh giá"
        message="Thông tin sản phẩm không hợp lệ."
      />
    );
  }

  if (reviewsQuery.isLoading && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md font-sans text-body-sm text-catalog-muted-text">Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (reviewsQuery.isError && reviews.length === 0) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải đánh giá"
        message={getErrorMessage(reviewsQuery.error)}
        onRetry={() => void reviewsQuery.refetch()}
      />
    );
  }

  return (
    <FlatList
      className="flex-1 bg-surface-lowest"
      data={reviews}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-xxl pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshing={reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage}
      onRefresh={refresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListHeaderComponent={
        <View className="gap-xxl pt-xxl">
          <View className="gap-sm px-lg">
            <Text accessibilityRole="header" className="font-sans text-headline-lg font-bold text-primary-container">Đánh giá & Nhận xét</Text>
            <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">Phản hồi thực tế từ khách hàng đã trải nghiệm sản phẩm may đo.</Text>
          </View>
          <View className="mx-lg flex-row flex-wrap gap-sm">
            <Button
              title={writing ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
              size="sm"
              className="!rounded-xl"
              textClassName="font-sans !text-on-primary"
              onPress={() => {
                createMutation.reset();
                setEditing(null);
                setWriting((value) => !value);
              }}
            />
            <Button
              title="Đánh giá của tôi"
              variant="outline"
              size="sm"
              className="!rounded-xl !border-catalog-line"
              textClassName="font-sans !text-primary-container"
              onPress={() => navigation.navigate('MyReviews')}
            />
          </View>

          {writing ? (
            <View className="mx-lg">
              <ReviewForm
                mode="create"
                submitting={createMutation.isPending}
                errorMessage={createMutation.isError ? getErrorMessage(createMutation.error) : undefined}
                onSubmit={submitCreate}
                onCancel={() => setWriting(false)}
              />
            </View>
          ) : null}

          <ReviewStatsCard
            stats={statsQuery.data}
            loading={statsQuery.isLoading}
            error={statsQuery.isError}
            onRetry={() => void statsQuery.refetch()}
          >
            <Text className="font-sans text-body-sm font-semibold text-on-surface-variant">Lọc theo:</Text>
            <RatingFilter value={rating} onChange={setRating} stats={statsQuery.data} />
          </ReviewStatsCard>

          {reviewsQuery.isError ? (
            <View className="mx-lg rounded-xl border border-catalog-line bg-catalog-muted p-lg">
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
                onSubmit={submitEdit}
                onCancel={() => setEditing(null)}
              />
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={
        <ReviewEmptyState
          title={rating ? `Chưa có đánh giá ${rating} sao` : 'Chưa có đánh giá'}
          description={rating ? 'Hãy thử chọn mức sao khác hoặc xem tất cả đánh giá.' : 'Nếu bạn đã mua và nhận sản phẩm này, hãy là người đầu tiên chia sẻ cảm nhận nhé!'}
        />
      }
      ListFooterComponent={reviewsQuery.isFetchingNextPage ? (
        <ActivityIndicator className="py-lg" color={COLORS.primaryContainer} />
      ) : null}
    />
  );
}
