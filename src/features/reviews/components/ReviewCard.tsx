import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, MessageSquare, Pencil, Trash2 } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { IReview } from '../types/review';
import { RatingStars } from './RatingStars';

const ACTION_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };
const META_LABEL_CLASS = 'font-sans text-[10px] font-semibold uppercase tracking-[0.14em]';

function formatReviewDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ReviewImage({ url, label, product = false }: { url: string; label: string; product?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <View
      className={`overflow-hidden rounded-subtle border border-landing-line bg-landing-ivory ${
        product ? 'h-14 w-12' : 'h-20 w-20'
      }`}
    >
      {failed ? (
        <View accessible accessibilityLabel="Không tải được ảnh" className="flex-1 items-center justify-center">
          <MessageSquare size={16} strokeWidth={1.75} color={COLORS.muted} />
        </View>
      ) : (
        // expo-image does not consume NativeWind classes; fill its token-sized wrapper.
        <Image
          accessibilityLabel={label}
          source={{ uri: url }}
          contentFit="cover"
          transition={150}
          style={StyleSheet.absoluteFill}
          onError={() => setFailed(true)}
        />
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

/** Thẻ đánh giá theo FE ReviewCard: khối paper viền mảnh, nhãn "Đã mua hàng" sage-ink, ngày mono. */
export function ReviewCard({ review, owned, onEdit, onDelete }: ReviewCardProps) {
  const displayName = review.user?.name?.trim() || 'Khách hàng';
  const initial = displayName.charAt(0).toLocaleUpperCase('vi-VN');
  const avatarUrl = review.user?.avatarUrl ?? null;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const formattedDate = formatReviewDate(review.createdAt);

  return (
    <View className="mx-lg gap-4 border border-landing-line bg-landing-paper p-5">
      {review.product ? (
        <View className="flex-row items-center gap-md border-b border-landing-line pb-4">
          {review.product.garmentUrl ? (
            <ReviewImage url={review.product.garmentUrl} label={review.product.name} product />
          ) : null}
          <Text className="flex-1 font-sans text-body-md text-landing-obsidian" numberOfLines={2}>
            {review.product.name}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          {avatarUrl && !avatarFailed ? (
            <View className="h-10 w-10 overflow-hidden rounded-full border border-landing-line bg-landing-ivory">
              <Image
                accessibilityLabel={`Ảnh đại diện của ${displayName}`}
                source={{ uri: avatarUrl }}
                contentFit="cover"
                transition={150}
                style={StyleSheet.absoluteFill}
                onError={() => setAvatarFailed(true)}
              />
            </View>
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full border border-landing-line bg-landing-paper">
              <Text className="font-sans text-sm font-semibold text-brass-ink">{initial}</Text>
            </View>
          )}
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <Text numberOfLines={1} className="shrink font-sans text-sm font-semibold text-landing-obsidian">
                {displayName}
              </Text>
              {review.orderId ? (
                <View className="flex-row items-center gap-1">
                  <CheckCircle2 size={12} strokeWidth={1.75} color={COLORS.sageInk} />
                  <Text className={`${META_LABEL_CLASS} text-sage-ink`}>Đã mua hàng</Text>
                </View>
              ) : null}
            </View>
            {formattedDate ? (
              <Text className="mt-0.5 font-mono text-[10px] text-landing-muted">{formattedDate}</Text>
            ) : null}
          </View>
        </View>
        <RatingStars value={review.rating} />
      </View>

      {review.comment ? (
        <Text className="font-sans text-sm leading-relaxed text-landing-muted">{review.comment}</Text>
      ) : (
        <Text className="font-sans text-xs italic text-landing-muted">
          Người mua không để lại nhận xét bằng chữ.
        </Text>
      )}

      {review.images?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {review.images.map((url, index) => (
            <ReviewImage key={`${url}-${index}`} url={url} label={`Ảnh đánh giá ${index + 1}`} />
          ))}
        </ScrollView>
      ) : null}

      {review.replies?.length ? (
        <View className="gap-2.5 border-t border-landing-line pt-3">
          {review.replies.map((reply) => {
            const isShop = reply.user?.role === 'ADMIN';
            const replyDate = formatReviewDate(reply.createdAt);
            return (
              <View
                key={reply.id}
                className={`gap-1.5 border p-3.5 ${
                  isShop ? 'border-oxblood/25 bg-landing-ivory' : 'border-landing-line bg-landing-ivory/60'
                }`}
              >
                <View className="flex-row flex-wrap items-center gap-2">
                  {isShop ? (
                    <View className="bg-oxblood px-2 py-0.5">
                      <Text className={`${META_LABEL_CLASS} text-landing-paper`}>Phản hồi từ shop</Text>
                    </View>
                  ) : (
                    <Text className="font-sans text-xs font-semibold text-landing-obsidian">
                      {reply.user?.name || 'Thành viên'}
                    </Text>
                  )}
                  {replyDate ? (
                    <Text className="font-mono text-[10px] text-landing-muted">{replyDate}</Text>
                  ) : null}
                </View>
                <Text className="font-sans text-sm leading-relaxed text-landing-muted">{reply.content}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {owned ? (
        <View className="flex-row flex-wrap justify-end gap-2 border-t border-landing-line pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chỉnh sửa đánh giá"
            hitSlop={ACTION_HIT_SLOP}
            onPress={() => onEdit(review)}
            className="h-9 flex-row items-center gap-1.5 rounded-subtle border border-landing-line px-3.5 active:opacity-70"
          >
            <Pencil size={12} strokeWidth={1.75} color={COLORS.obsidian} />
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Chỉnh sửa
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa đánh giá"
            hitSlop={ACTION_HIT_SLOP}
            onPress={() => onDelete(review)}
            className="h-9 flex-row items-center gap-1.5 rounded-subtle border border-danger/40 px-3.5 active:opacity-70"
          >
            <Trash2 size={12} strokeWidth={1.75} color={COLORS.danger} />
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger">
              Xóa đánh giá
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
