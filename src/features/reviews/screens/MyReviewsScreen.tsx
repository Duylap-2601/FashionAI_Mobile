import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { MessageSquare, Pencil, Star, Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { formatDate } from '@/utils/date';
import { ReviewForm } from '../components/ReviewForm';
import { useMyReviews } from '../hooks/useMyReviews';
import { useDeleteReview, useUpdateReview } from '../hooks/useReviewMutations';
import type { CreateReviewFormValues } from '../schemas/review.schema';
import type { IReview } from '../types/review';

type Props = NativeStackScreenProps<RootStackParamList, 'MyReviews'>;

const STAR_SLOTS = [1, 2, 3, 4, 5];

const SKELETON_ROWS = [0, 1, 2];

const ACTION_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${rating} trên 5 sao`}
      className="flex-row items-center gap-[3px]"
    >
      {STAR_SLOTS.map((slot) => (
        <Star
          key={slot}
          size={12}
          strokeWidth={1.5}
          color={COLORS.oxblood}
          fill={slot <= rating ? COLORS.oxblood : 'transparent'}
        />
      ))}
    </View>
  );
}

interface IReviewRowProps {
  review: IReview;
  onEdit: (review: IReview) => void;
  onDelete: (review: IReview) => void;
  onOpenProduct: (productId: string) => void;
}

function ReviewRow({ review, onEdit, onDelete, onOpenProduct }: IReviewRowProps) {
  const productName = review.product?.name || 'Sản phẩm đã mua';
  const productImage = review.product?.garmentUrl ?? null;
  const edited = Boolean(review.updatedAt && review.createdAt && review.updatedAt !== review.createdAt);
  const images = Array.isArray(review.images) ? review.images : [];

  return (
    <View className="border-b border-landing-line px-lg py-5">
      <View className="flex-row gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem sản phẩm ${productName}`}
          hitSlop={ACTION_HIT_SLOP}
          onPress={() => onOpenProduct(review.productId)}
          className="h-[72px] w-14 overflow-hidden rounded-subtle border border-landing-line bg-ivory active:opacity-80"
        >
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <MessageSquare size={18} strokeWidth={1.75} color={COLORS.muted} />
            </View>
          )}
        </Pressable>

        <View className="min-w-0 flex-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem sản phẩm ${productName}`}
            onPress={() => onOpenProduct(review.productId)}
            className="active:opacity-70"
          >
            <Text numberOfLines={2} className="font-sans text-body-md text-landing-obsidian">
              {productName}
            </Text>
          </Pressable>

          <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
            <ReviewStars rating={review.rating} />
            <Text className="font-mono text-[11px] text-landing-muted">
              {formatDate(review.createdAt)}
              {edited ? ' · đã sửa' : ''}
            </Text>
          </View>

          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sửa đánh giá"
              hitSlop={ACTION_HIT_SLOP}
              onPress={() => onEdit(review)}
              className="h-9 flex-row items-center gap-1.5 rounded-subtle border border-landing-line px-3 active:opacity-70"
            >
              <Pencil size={12} strokeWidth={1.75} color={COLORS.obsidian} />
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                Sửa
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa đánh giá"
              hitSlop={ACTION_HIT_SLOP}
              onPress={() => onDelete(review)}
              className="h-9 flex-row items-center gap-1.5 rounded-subtle border border-danger/40 px-3 active:opacity-70"
            >
              <Trash2 size={12} strokeWidth={1.75} color={COLORS.danger} />
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger">
                Xóa
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mt-3">
        {review.comment ? (
          <Text className="font-sans text-body-md leading-relaxed text-landing-obsidian/85">
            {review.comment}
          </Text>
        ) : (
          <Text className="font-sans text-body-md italic text-landing-muted">
            Bạn chỉ chấm sao, không viết nhận xét.
          </Text>
        )}

        {images.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {images.map((imageUrl, index) => (
              <View
                key={`${index}-${imageUrl.slice(-16)}`}
                className="h-16 w-16 overflow-hidden rounded-subtle border border-landing-line bg-ivory"
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={150}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ReviewListSkeleton() {
  const [pulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      {SKELETON_ROWS.map((row) => (
        <View key={row} className="flex-row gap-6 border-b border-landing-line px-lg py-6">
          <View className="h-[72px] w-14 rounded-subtle bg-landing-taupe/40" />
          <View className="flex-1 gap-3">
            <View className="h-4 w-1/2 rounded-subtle bg-landing-taupe/40" />
            <View className="h-3 w-1/4 rounded-subtle bg-landing-taupe/30" />
            <View className="h-3 w-3/4 rounded-subtle bg-landing-taupe/30" />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

export function MyReviewsScreen({ navigation }: Props) {
  const [editing, setEditing] = useState<IReview | null>(null);
  const reviewsQuery = useMyReviews(undefined);
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();
  const reviews = useMemo(
    () => reviewsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [reviewsQuery.data],
  );
  const total = reviewsQuery.data?.pages[0]?.meta.total ?? reviews.length;

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

  const openProduct = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const showSkeleton = reviewsQuery.isLoading && reviews.length === 0;
  const showError = reviewsQuery.isError && reviews.length === 0;

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <FlatList
        className="flex-1"
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-xxxl"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage}
        onRefresh={() => void reviewsQuery.refetch()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View>
            <View className="gap-4 border-b border-landing-line px-lg pb-5 pt-lg">
              <BackButton onPress={() => navigation.goBack()} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
                Tài khoản
              </Text>
              <Text
                accessibilityRole="header"
                className="font-display text-headline-lg text-landing-obsidian"
              >
                Đánh giá của tôi
              </Text>
              <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
                Nhận xét bạn đã gửi cho những sản phẩm đã nhận. Bạn có thể sửa hoặc xóa bất cứ lúc nào.
              </Text>
            </View>
            {reviews.length > 0 ? (
              <Text className="px-lg pt-4 pb-3 text-xs text-landing-muted">
                <Text className="font-mono text-landing-obsidian">{total}</Text> đánh giá
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View className={index === 0 ? 'border-t border-landing-line' : ''}>
            <ReviewRow
              review={item}
              onEdit={(review) => {
                updateMutation.reset();
                setEditing(review);
              }}
              onDelete={confirmDelete}
              onOpenProduct={openProduct}
            />
            {editing?.id === item.id ? (
              <View className="px-lg pb-5">
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
          showSkeleton ? (
            <ReviewListSkeleton />
          ) : showError ? (
            <View className="mx-lg mt-lg items-center gap-4 rounded-subtle border border-landing-line bg-ivory px-6 py-12">
              <Text className="text-center font-display text-2xl text-landing-obsidian">
                Không tải được đánh giá
              </Text>
              <Text className="text-center font-sans text-body-md leading-relaxed text-landing-muted">
                Kiểm tra kết nối rồi thử lại.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thử lại"
                hitSlop={ACTION_HIT_SLOP}
                onPress={() => void reviewsQuery.refetch()}
                className="mt-2 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                  Thử lại
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mx-lg mt-lg items-center gap-4 rounded-subtle border border-landing-line bg-ivory px-6 py-14">
              <Text className="text-center font-display text-2xl text-landing-obsidian">
                Bạn chưa có đánh giá nào
              </Text>
              <Text className="text-center font-sans text-body-md leading-relaxed text-landing-muted">
                Khi đơn may đo hoàn tất, bạn có thể đánh giá từng sản phẩm trong mục Đơn hàng.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xem đơn hàng"
                hitSlop={ACTION_HIT_SLOP}
                onPress={() =>
                  navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'Orders' } })
                }
                className="mt-2 h-11 items-center justify-center rounded-subtle bg-oxblood px-6 active:opacity-90"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                  Xem đơn hàng
                </Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          reviewsQuery.isFetchingNextPage ? (
            <View className="py-lg">
              <ActivityIndicator color={COLORS.oxblood} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
