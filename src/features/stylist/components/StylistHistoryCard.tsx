import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/theme';
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
    <Card variant="outlined" className="mx-lg overflow-hidden !rounded-2xl !border-catalog-line !p-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở kết quả tư vấn ${result.occasion || ''}`.trim()}
        className="min-h-32 flex-row active:opacity-70"
        onPress={() => onOpen(result.id)}
      >
        <View className="h-32 w-24 overflow-hidden rounded-xl bg-catalog-muted">
        {!imageFailed ? (
          // expo-image does not consume NativeWind classes; fill the token-sized thumbnail.
          <Image
            source={{ uri: result.humanImageUrl }}
            contentFit="cover"
            transition={150}
            style={StyleSheet.absoluteFill}
            onError={() => setFailedImageUrl(result.humanImageUrl)}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Sparkles size={24} color={COLORS.catalogMutedText} />
          </View>
        )}
        </View>

        <View className="flex-1 justify-between p-md">
          <View>
            <Text className="font-sans text-body-sm text-catalog-muted-text">{formatDate(result.createdAt)}</Text>
            <Text className="mt-sm font-sans text-body-md font-semibold text-primary-container" numberOfLines={2}>
              {result.occasion || result.garmentDescription || 'Tư vấn phong cách cá nhân'}
            </Text>
            <Text className="mt-sm font-sans text-body-sm leading-relaxed text-on-surface-variant" numberOfLines={2}>
              {result.analysis.verdict}
            </Text>
          </View>
          <Text className="mt-md font-sans text-body-sm font-semibold text-primary-container">Xem kết quả →</Text>
        </View>
      </Pressable>

      <View className="items-end border-t border-catalog-line px-md py-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa kết quả tư vấn"
          disabled={deleting}
          className="min-h-11 min-w-11 items-center justify-center rounded-xl px-md active:bg-catalog-muted disabled:opacity-50"
          onPress={() => onDelete(result)}
        >
          <Text className="font-sans text-body-sm font-semibold text-danger">{deleting ? '…' : 'Xóa'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}
