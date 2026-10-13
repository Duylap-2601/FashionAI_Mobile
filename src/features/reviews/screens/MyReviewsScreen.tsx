import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RatingFilter } from '../components/RatingFilter';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewEmptyState } from '../components/ReviewEmptyState';
import { useMyReviews } from '../hooks/useMyReviews';
import { useDeleteReview, useUpdateReview } from '../hooks/useReviewMutations';
import type { CreateReviewFormValues } from '../schemas/review.schema';
import type { IReview, ReviewRating } from '../types/review';

type Props = NativeStackScreenProps<RootStackParamList, 'MyReviews'>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function MyReviewsScreen(_props: Props) {
  const [rating, setRating] = useState<ReviewRating>();
  const [editing, setEditing] = useState<IReview | null>(null);
  const reviewsQuery = useMyReviews(rating);
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();
  const reviews = useMemo(
    () => reviewsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [reviewsQuery.data],
  );

  const loadMore = useCallback(() => {
    if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
      void reviewsQuery.fetchNextPage();
    }
  }, [reviewsQuery]);

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
        // The form renders the backend ownership error from mutation state.
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
              .catch((error: unknown) => Alert.alert('Không thể xóa đánh giá', getErrorMessage(error)));
          },
        },
      ]);
    },
    [deleteMutation],
  );

  if (reviewsQuery.isLoading && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-catalog-muted">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md font-sans text-body-sm text-catalog-muted-text">Đang tải đánh giá của bạn...</Text>
      </View>
    );
  }

  if (reviewsQuery.isError && reviews.length === 0) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải đánh giá của bạn"
        message={getErrorMessage(reviewsQuery.error)}
        onRetry={() => void reviewsQuery.refetch()}
      />
    );
  }

  return (
    <FlatList
      className="flex-1 bg-catalog-muted"
      data={reviews}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-xxl pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshing={reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage}
      onRefresh={() => void reviewsQuery.refetch()}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListHeaderComponent={
        <View className="gap-xxl">
          <View className="gap-sm border-b border-catalog-line bg-surface-lowest px-lg py-xxl">
            <Text accessibilityRole="header" className="font-sans text-headline-lg font-bold text-primary-container">Đánh giá của tôi</Text>
            <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">Xem lại lịch sử đánh giá và cảm nhận thực tế về các sản phẩm bạn đã mua.</Text>
          </View>
          <Card variant="outlined" className="mx-lg gap-md !rounded-2xl !border-catalog-line">
            <Text className="font-sans text-body-sm font-semibold text-on-surface-variant">Lọc theo đánh giá</Text>
            <RatingFilter value={rating} onChange={setRating} />
          </Card>
          {reviewsQuery.isError ? (
            <Text className="mx-lg rounded-xl border border-catalog-line bg-surface-lowest p-lg font-sans text-body-sm text-danger">
              Chưa thể cập nhật danh sách mới nhất. Nội dung đã tải vẫn được giữ lại.
            </Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View className="gap-sm">
          <ReviewCard
            review={item}
            owned
            onEdit={(review) => {
              updateMutation.reset();
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
          personal
          title={rating ? `Bạn chưa có đánh giá ${rating} sao` : 'Bạn chưa có đánh giá'}
          description="Sau khi nhận hàng, bạn có thể chia sẻ cảm nhận về chất lượng sản phẩm. Các đánh giá của bạn sẽ xuất hiện tại đây."
        />
      }
      ListFooterComponent={reviewsQuery.isFetchingNextPage ? (
        <ActivityIndicator className="py-lg" color={COLORS.primaryContainer} />
      ) : null}
    />
  );
}
