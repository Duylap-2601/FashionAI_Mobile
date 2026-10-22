import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles, ArrowRight, Shirt } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import type { IStylistResult } from '../types/stylist';

interface StylistResultContentProps {
  result: IStylistResult;
  onProductPress?: (productId: string) => void;
  onTryOnPress?: (product?: { id: string; name: string; imageUrl?: string }) => void;
}

function ResultSection({
  title,
  children,
  warm = false,
}: {
  title: string;
  children: React.ReactNode;
  warm?: boolean;
}) {
  return (
    <Card variant="outlined" className={warm ? 'gap-sm !rounded-2xl !border-catalog-line !bg-catalog-tailoring !p-xxl' : 'gap-sm !rounded-2xl !border-catalog-line !p-xxl'}>
      <Text accessibilityRole="header" className="mb-md font-sans text-headline-sm font-bold text-primary-container">{title}</Text>
      {children}
    </Card>
  );
}

export function StylistResultContent({
  result,
  onProductPress,
  onTryOnPress,
}: StylistResultContentProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = failedImageUrl === result.humanImageUrl;
  const { analysis } = result;

  return (
    <View className="gap-xxl">
      <Card variant="outlined" className="overflow-hidden !rounded-2xl !border-catalog-line !p-0">
        <View className="aspect-[3/4] w-full bg-catalog-muted">
        {!imageFailed ? (
          // expo-image needs explicit layout; fill the responsive portrait wrapper.
          <Image
            source={{ uri: result.humanImageUrl }}
            contentFit="cover"
            transition={150}
            style={StyleSheet.absoluteFill}
            onError={() => setFailedImageUrl(result.humanImageUrl)}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-lg">
            <Text className="text-center font-sans text-body-sm text-catalog-muted-text">Không thể hiển thị ảnh phân tích</Text>
          </View>
        )}
        </View>
        <View className="gap-sm p-xxl">
          <View className="flex-row flex-wrap items-center justify-between gap-sm">
            <Text className="font-sans text-headline-sm font-semibold text-primary-container">
              {result.occasion || 'Tư vấn phong cách cá nhân'}
            </Text>
            {result.isCached ? (
              <Text className="rounded-full border border-catalog-line bg-catalog-muted px-sm py-xs font-sans text-body-sm text-primary-container">
                Đã phân tích trước đó
              </Text>
            ) : null}
          </View>
          {result.garmentDescription ? (
            <Text className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
              {result.garmentDescription}
            </Text>
          ) : null}
          {result.product ? (
            <View className="mt-2 pt-2 border-t border-catalog-line/60 gap-2">
              <Pressable
                accessibilityRole="button"
                className="min-h-11 justify-center self-start"
                onPress={() => onProductPress?.(result.product!.id)}
              >
                <Text className="font-sans text-body-sm font-semibold text-primary-container">
                  Sản phẩm: {result.product.name}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="min-h-11 flex-row items-center justify-center gap-2 bg-primary px-4 py-3 rounded-xl active:opacity-90"
                onPress={() =>
                  onTryOnPress?.({
                    id: result.product!.id,
                    name: result.product!.name,
                    imageUrl: (result.product as any).imageUrl || (result.product as any).image,
                  })
                }
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text className="text-white font-bold text-label-md">Thử đồ AI với sản phẩm này</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Card>

      {analysis.productCompatibilityScore !== null ? (
        <ResultSection title="Độ tương thích sản phẩm">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-sans text-body-sm text-catalog-muted-text">Đánh giá từ AI</Text>
            <Text className="font-sans text-headline-lg font-bold text-primary-container">
              {analysis.productCompatibilityScore}%
            </Text>
          </View>
          <View className="mt-sm h-2.5 overflow-hidden rounded-full bg-surface-high">
            <View style={{ width: `${analysis.productCompatibilityScore}%` }}>
              <View className="h-2.5 rounded-full bg-primary-container" />
            </View>
          </View>
        </ResultSection>
      ) : null}

      <ResultSection title="Phân tích cá nhân">
        <View className="gap-md">
          <View className="rounded-xl border border-catalog-line bg-catalog-muted p-lg">
            <Text className="font-sans text-body-sm uppercase tracking-wide text-catalog-muted-text">Vóc dáng</Text>
            <Text selectable className="mt-sm font-sans text-body-md font-semibold text-on-surface">{analysis.bodyType}</Text>
          </View>
          <View className="rounded-xl border border-catalog-line bg-catalog-muted p-lg">
            <Text className="font-sans text-body-sm uppercase tracking-wide text-catalog-muted-text">Sắc độ da</Text>
            <Text selectable className="mt-sm font-sans text-body-md font-semibold text-on-surface">{analysis.skinTone}</Text>
          </View>
          <View className="rounded-xl border border-catalog-line bg-catalog-tailoring p-lg">
            <Text className="font-sans text-body-sm uppercase tracking-wide text-catalog-muted-text">Màu cá nhân</Text>
            <Text selectable className="mt-sm font-sans text-body-md font-semibold text-primary-container">{analysis.personalColor}</Text>
          </View>
        </View>
      </ResultSection>

      <ResultSection title="Phom dáng và may đo">
        <Text selectable className="font-sans text-body-md leading-relaxed text-on-surface">
          {analysis.fitRecommendation}
        </Text>
        {analysis.fitAdvice ? (
          <Text selectable className="mt-sm font-sans text-body-sm leading-relaxed text-on-surface-variant">
            {analysis.fitAdvice}
          </Text>
        ) : null}
      </ResultSection>

      <ResultSection title="Bảng màu gợi ý">
        <View className="flex-row flex-wrap gap-sm">
          {analysis.colorSuggestions.map((color, index) => (
            <View key={`${color}-${index}`} className="rounded-full border border-catalog-line bg-catalog-muted px-md py-sm">
              <Text className="font-sans text-body-sm font-semibold text-primary-container">{color}</Text>
            </View>
          ))}
        </View>
      </ResultSection>

      <ResultSection title="Cách phối trang phục">
        <View className="gap-sm">
          {analysis.outfitCombinations.map((outfit, index) => (
            <View key={`${outfit}-${index}`} className="flex-row gap-md rounded-xl border border-catalog-line bg-catalog-muted p-lg">
              <Text className="font-sans text-body-md font-bold text-primary-container">{index + 1}.</Text>
              <Text selectable className="flex-1 font-sans text-body-md leading-relaxed text-on-surface-variant">{outfit}</Text>
            </View>
          ))}
        </View>
      </ResultSection>

      <ResultSection title="Lời khuyên của AI Stylist" warm>
        <Text selectable className="font-sans text-body-md leading-relaxed text-on-surface">{analysis.verdict}</Text>
        <View className="my-md h-px bg-catalog-line" />
        <Text selectable className="font-sans text-body-sm leading-relaxed text-on-surface-variant">{analysis.stylingTips}</Text>
      </ResultSection>

      <Card variant="outlined" className="gap-md !rounded-2xl !border-primary/30 !bg-primary/5 !p-xxl">
        <View className="flex-row items-center gap-2.5">
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
            <Shirt size={20} color="#5D1C34" />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-body-md font-bold text-primary">
              Trải nghiệm phòng thử đồ ảo AI
            </Text>
            <Text className="font-sans text-[12px] text-on-surface-variant">
              Ứng dụng gợi ý phối đồ này lên ảnh toàn thân của bạn
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => onTryOnPress?.(result.product ? { id: result.product.id, name: result.product.name } : undefined)}
          className="mt-2 min-h-11 flex-row items-center justify-center gap-2 bg-primary px-4 py-3 rounded-xl active:opacity-90 shadow-sm"
        >
          <Sparkles size={16} color="#FFFFFF" />
          <Text className="text-white font-bold text-label-md">Chuyển sang Thử đồ AI</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </Card>
    </View>
  );
}
