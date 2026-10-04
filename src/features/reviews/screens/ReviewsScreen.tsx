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
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RatingFilter } from '../components/RatingFilter';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewForm } from '../components/ReviewForm';
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
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md text-body-sm text-on-surface-variant">Đang tải đánh giá...</Text>
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
      className="flex-1 bg-surface"
      data={reviews}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-md pb-xxxl"
      keyboardShouldPersistTaps="handled"
      refreshing={reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage}
      onRefresh={refresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListHeaderComponent={
        <View className="gap-lg pt-lg">
          <ReviewStatsCard
            stats={statsQuery.data}
            loading={statsQuery.isLoading}
            error={statsQuery.isError}
            onRetry={() => void statsQuery.refetch()}
          />

          <View className="mx-lg flex-row gap-sm">
            <Pressable
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-md bg-primary-container px-md"
              onPress={() => {
                createMutation.reset();
                setEditing(null);
                setWriting((value) => !value);
              }}
            >
              <Text className="text-label-lg text-on-primary">
                {writing ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-md border border-outline-variant bg-surface-lowest px-md"
              onPress={() => navigation.navigate('MyReviews')}
            >
              <Text className="text-label-lg text-primary-container">Đánh giá của tôi</Text>
            </Pressable>
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

          <View>
            <Text className="mb-sm px-lg text-headline-sm text-on-surface">Lọc theo đánh giá</Text>
            <RatingFilter value={rating} onChange={setRating} />
          </View>

          {reviewsQuery.isError ? (
            <View className="mx-lg rounded-lg bg-surface-low p-md">
              <Text className="text-body-sm text-danger">
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
        <EmptyState
          icon="☆"
          title={rating ? `Chưa có đánh giá ${rating} sao` : 'Chưa có đánh giá'}
          description="Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này."
        />
      }
      ListFooterComponent={reviewsQuery.isFetchingNextPage ? (
        <ActivityIndicator className="py-lg" color={COLORS.primaryContainer} />
      ) : null}
    />
  );
}
