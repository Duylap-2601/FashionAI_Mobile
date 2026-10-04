import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import type { IStylistResult } from '../types/stylist';

interface StylistResultContentProps {
  result: IStylistResult;
  onProductPress?: (productId: string) => void;
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-xl border border-surface-line bg-surface-lowest p-lg">
      <Text className="mb-md text-headline-sm text-on-surface">{title}</Text>
      {children}
    </View>
  );
}

export function StylistResultContent({
  result,
  onProductPress,
}: StylistResultContentProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = failedImageUrl === result.humanImageUrl;
  const { analysis } = result;

  return (
    <View className="gap-md">
      <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest">
        {!imageFailed ? (
          <Image
            source={{ uri: result.humanImageUrl }}
            contentFit="cover"
            transition={150}
            className="aspect-[3/4] w-full bg-surface-low"
            onError={() => setFailedImageUrl(result.humanImageUrl)}
          />
        ) : (
          <View className="aspect-[3/4] w-full items-center justify-center bg-surface-low">
            <Text className="text-body-sm text-on-surface-variant">Không thể hiển thị ảnh phân tích</Text>
          </View>
        )}
        <View className="gap-xs p-lg">
          <View className="flex-row items-center justify-between gap-sm">
            <Text className="flex-1 text-headline-sm text-on-surface">
              {result.occasion || 'Tư vấn phong cách cá nhân'}
            </Text>
            {result.isCached ? (
              <Text className="rounded-full bg-primary-soft px-sm py-xs text-label-md text-primary-strong">
                Đã phân tích trước đó
              </Text>
            ) : null}
          </View>
          {result.garmentDescription ? (
            <Text className="text-body-sm text-on-surface-variant">
              {result.garmentDescription}
            </Text>
          ) : null}
          {result.product ? (
            <Pressable
              accessibilityRole="button"
              className="min-h-11 justify-center self-start"
              onPress={() => onProductPress?.(result.product!.id)}
            >
              <Text className="text-label-lg text-primary-container">
                Sản phẩm: {result.product.name}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {analysis.productCompatibilityScore !== null ? (
        <ResultSection title="Độ tương thích sản phẩm">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-body-sm text-on-surface-variant">Đánh giá từ AI</Text>
            <Text className="text-headline-lg text-primary-container">
              {analysis.productCompatibilityScore}%
            </Text>
          </View>
          <View className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container">
            <View style={{ width: `${analysis.productCompatibilityScore}%` }}>
              <View className="h-2 rounded-full bg-primary-container" />
            </View>
          </View>
        </ResultSection>
      ) : null}

      <ResultSection title="Phân tích cá nhân">
        <View className="gap-md">
          <View>
            <Text className="text-label-md uppercase text-on-surface-variant">Vóc dáng</Text>
            <Text selectable className="mt-xs text-body-md text-on-surface">{analysis.bodyType}</Text>
          </View>
          <View>
            <Text className="text-label-md uppercase text-on-surface-variant">Sắc độ da</Text>
            <Text selectable className="mt-xs text-body-md text-on-surface">{analysis.skinTone}</Text>
          </View>
          <View>
            <Text className="text-label-md uppercase text-on-surface-variant">Màu cá nhân</Text>
            <Text selectable className="mt-xs text-body-md text-on-surface">{analysis.personalColor}</Text>
          </View>
        </View>
      </ResultSection>

      <ResultSection title="Phom dáng và may đo">
        <Text selectable className="text-body-md text-on-surface">
          {analysis.fitRecommendation}
        </Text>
        {analysis.fitAdvice ? (
          <Text selectable className="mt-sm text-body-md text-on-surface-variant">
            {analysis.fitAdvice}
          </Text>
        ) : null}
      </ResultSection>

      <ResultSection title="Bảng màu gợi ý">
        <View className="flex-row flex-wrap gap-sm">
          {analysis.colorSuggestions.map((color, index) => (
            <View key={`${color}-${index}`} className="rounded-full bg-primary-soft px-md py-sm">
              <Text className="text-label-lg text-primary-strong">{color}</Text>
            </View>
          ))}
        </View>
      </ResultSection>

      <ResultSection title="Cách phối trang phục">
        <View className="gap-sm">
          {analysis.outfitCombinations.map((outfit, index) => (
            <View key={`${outfit}-${index}`} className="flex-row gap-sm rounded-lg bg-surface-low p-md">
              <Text className="text-label-lg text-primary-container">{index + 1}.</Text>
              <Text selectable className="flex-1 text-body-md text-on-surface">{outfit}</Text>
            </View>
          ))}
        </View>
      </ResultSection>

      <ResultSection title="Lời khuyên của AI Stylist">
        <Text selectable className="text-body-md text-on-surface">{analysis.verdict}</Text>
        <View className="my-md h-px bg-surface-line" />
        <Text selectable className="text-body-md text-on-surface-variant">{analysis.stylingTips}</Text>
      </ResultSection>
    </View>
  );
}
