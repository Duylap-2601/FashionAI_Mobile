import React, { useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Trash2, User } from 'lucide-react-native';
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
        hour: '2-digit',
        minute: '2-digit',
      });
}

// Cùng thang màu "Độ hợp" của trang lịch sử AI Stylist trên web; luôn đi kèm chữ và số.
function scoreTone(score: number) {
  if (score >= 80) return { text: 'text-sage-ink', dot: 'bg-sage' };
  if (score >= 60) return { text: 'text-brass-ink', dot: 'bg-brass' };
  return { text: 'text-danger', dot: 'bg-danger' };
}

/** Thẻ một lần tư vấn, theo StylistCard của web: ảnh 3:4 nhỏ, dịp mặc serif, ngày mono, độ hợp. */
export function StylistHistoryCard({
  result,
  deleting,
  onOpen,
  onDelete,
}: StylistHistoryCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed =
    !result.humanImageUrl || failedImageUrl === result.humanImageUrl;
  const title = result.occasion || result.garmentDescription || 'Tư vấn phong cách cá nhân';
  const score = result.analysis.productCompatibilityScore;
  const tone = score !== null ? scoreTone(score) : null;

  return (
    <View className="mx-lg flex-row items-start rounded-subtle border border-landing-line bg-ivory">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở kết quả tư vấn ${result.occasion || ''}`.trim()}
        className="flex-1 flex-row gap-lg p-lg active:opacity-80"
        onPress={() => onOpen(result.id)}
      >
        <View className="h-[72px] w-14 items-center justify-center overflow-hidden rounded-subtle bg-landing-paper">
          {!imageFailed ? (
            <Image
              source={{ uri: result.humanImageUrl }}
              contentFit="cover"
              transition={150}
              style={StyleSheet.absoluteFill}
              onError={() => setFailedImageUrl(result.humanImageUrl)}
            />
          ) : (
            <User size={20} strokeWidth={1.5} color={COLORS.muted} />
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text
            numberOfLines={2}
            className="font-display text-[19px] leading-tight text-landing-obsidian"
          >
            {title}
          </Text>
          <Text className="font-mono text-[11px] text-landing-muted">
            {formatDate(result.createdAt)}
          </Text>
          {score !== null && tone ? (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <Text className={`font-sans text-[12px] ${tone.text}`}>
                Độ hợp <Text className="font-mono">{score}/100</Text>
              </Text>
            </View>
          ) : null}
          {result.analysis.verdict ? (
            <Text
              numberOfLines={2}
              className="mt-sm border-l-2 border-oxblood pl-3 font-display text-[15px] italic leading-snug text-landing-obsidian"
            >
              {result.analysis.verdict}
            </Text>
          ) : null}
          <View className="mt-sm flex-row items-center gap-1">
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-oxblood">
              Xem kết quả
            </Text>
            <ArrowRight size={12} strokeWidth={1.75} color={COLORS.oxblood} />
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Xóa kết quả tư vấn này"
        accessibilityState={{ disabled: deleting, busy: deleting }}
        disabled={deleting}
        className={`mr-xs mt-xs h-11 w-11 items-center justify-center active:opacity-60 ${
          deleting ? 'opacity-50' : ''
        }`}
        onPress={() => onDelete(result)}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={COLORS.muted} />
        ) : (
          <Trash2 size={16} strokeWidth={1.75} color={COLORS.muted} />
        )}
      </Pressable>
    </View>
  );
}

export default StylistHistoryCard;
