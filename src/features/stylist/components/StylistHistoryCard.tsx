import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
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
  const imageFailed =
    !result.humanImageUrl || failedImageUrl === result.humanImageUrl;

  return (
    <View className="mx-lg overflow-hidden rounded-subtle border border-landing-line bg-ivory">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở kết quả tư vấn ${result.occasion || ''}`.trim()}
        className="flex-row active:opacity-80"
        onPress={() => onOpen(result.id)}
      >
        <View className="h-32 w-24 overflow-hidden border-r border-landing-line bg-landing-paper">
          {!imageFailed ? (
            <Image
              source={{ uri: result.humanImageUrl }}
              contentFit="cover"
              transition={150}
              style={StyleSheet.absoluteFill}
              onError={() => setFailedImageUrl(result.humanImageUrl)}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Sparkles size={22} strokeWidth={1.5} color={COLORS.muted} />
            </View>
          )}
        </View>

        <View className="flex-1 justify-between gap-2 p-md">
          <View className="gap-1">
            <Text className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
              {formatDate(result.createdAt)}
            </Text>
            <Text
              numberOfLines={2}
              className="font-display text-[17px] leading-snug text-landing-obsidian"
            >
              {result.occasion || result.garmentDescription || 'Tư vấn phong cách cá nhân'}
            </Text>
            <Text
              numberOfLines={2}
              className="font-sans text-body-sm leading-relaxed text-landing-muted"
            >
              {result.analysis.verdict}
            </Text>
          </View>
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
            Xem kết quả →
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center justify-end border-t border-landing-line px-md">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa kết quả tư vấn"
          disabled={deleting}
          className="min-h-11 min-w-11 items-center justify-center px-md active:opacity-60 disabled:opacity-50"
          onPress={() => onDelete(result)}
        >
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
            {deleting ? '…' : 'Xóa'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default StylistHistoryCard;
