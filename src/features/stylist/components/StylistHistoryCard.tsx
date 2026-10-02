import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import type { IStylistResult } from '../types/stylist';

interface StylistHistoryCardProps {
  result: IStylistResult;
  deleting: boolean;
  onOpen: (resultId: string) => void;
  onDelete: (result: IStylistResult) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
}

export function StylistHistoryCard({
  result,
  deleting,
  onOpen,
  onDelete,
}: StylistHistoryCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = failedImageUrl === result.humanImageUrl;

  return (
    <View className="mx-lg flex-row overflow-hidden rounded-xl border border-surface-line bg-surface-lowest">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở kết quả tư vấn ${result.occasion || ''}`.trim()}
        className="flex-1 flex-row active:opacity-70"
        onPress={() => onOpen(result.id)}
      >
        {!imageFailed ? (
          <Image
            source={{ uri: result.humanImageUrl }}
            contentFit="cover"
            transition={150}
            className="h-32 w-24 bg-surface-low"
            onError={() => setFailedImageUrl(result.humanImageUrl)}
          />
        ) : (
          <View className="h-32 w-24 items-center justify-center bg-surface-low">
            <Text className="text-headline-lg text-outline">✦</Text>
          </View>
        )}

        <View className="flex-1 justify-between p-md">
          <View>
            <Text className="text-label-md text-on-surface-variant">{formatDate(result.createdAt)}</Text>
            <Text className="mt-xs text-label-lg text-on-surface" numberOfLines={2}>
              {result.occasion || result.garmentDescription || 'Tư vấn phong cách cá nhân'}
            </Text>
            <Text className="mt-xs text-body-sm text-on-surface-variant" numberOfLines={2}>
              {result.analysis.verdict}
            </Text>
          </View>
          <Text className="text-label-lg text-primary-container">Xem kết quả</Text>
        </View>
      </Pressable>

      <View className="justify-end p-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa kết quả tư vấn"
          disabled={deleting}
          className="min-h-11 min-w-11 items-center justify-center rounded-full active:bg-surface-low disabled:opacity-50"
          onPress={() => onDelete(result)}
        >
          <Text className="text-label-lg text-danger">{deleting ? '…' : 'Xóa'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
