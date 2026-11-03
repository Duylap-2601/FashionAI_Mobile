import React, { useId, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/theme';
import { LandingSectionHeading } from './LandingSectionHeading';
import {
  formatProductPrice,
  getProductMainImage,
  normalizeColorName,
  resolveProductImageForColor,
} from '@/features/products/utils/product-display';
import type { IProduct } from '@/features/products/types/product';

interface AiTryOnFeatureBannerProps {
  products?: IProduct[];
  onPressTryOn: (productId?: string) => void;
}

const STEPS = [
  {
    num: '1.',
    title: 'Chọn món đồ',
    body: 'Mở catalog và chọn thiết kế bạn muốn xem trên phom dáng của mình.',
  },
  {
    num: '2.',
    title: 'Tải ảnh hoặc mở camera',
    body: 'Đứng thẳng, ánh sáng đủ và giữ toàn thân trong khung hình.',
  },
  {
    num: '3.',
    title: 'Xem kết quả',
    body: 'Đối chiếu phom dáng, màu sắc và chi tiết trước khi thêm vào giỏ.',
  },
];

const MAX_CHOICES = 4;
const MAX_SWATCHES = 5;

export function AiTryOnFeatureBanner({
  products = [],
  onPressTryOn,
}: AiTryOnFeatureBannerProps) {
  const choices = products
    .filter((product) => Boolean(getProductMainImage(product)))
    .slice(0, MAX_CHOICES);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const scrimGradientId = useId().replace(/:/g, '');

  const activeProduct =
    choices.find((p) => p.id === selectedProductId) || choices[0] || null;

  const activeColors = (activeProduct?.colors ?? []).slice(0, MAX_SWATCHES);
  const currentColor = selectedColorName
    ? activeColors.find(
        (color) => normalizeColorName(color.name) === normalizeColorName(selectedColorName),
      )
    : undefined;

  const mainImage = activeProduct ? getProductMainImage(activeProduct) : null;
  const colorImage =
    activeProduct && currentColor
      ? resolveProductImageForColor(activeProduct, currentColor.name).url
      : null;
  const currentImage =
    [colorImage, mainImage].find((url): url is string => !!url && !failedImages[url]) ?? null;

  const markImageFailed = (url: string) =>
    setFailedImages((prev) => ({ ...prev, [url]: true }));

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="bg-landing-paper py-16">
      <View className="px-lg">
        {/* Chapter 05 Section Heading */}
        <LandingSectionHeading
          chapter="05"
          eyebrow="AI TRY-ON"
          title="THỬ PHOM DÁNG TRƯỚC KHI QUYẾT ĐỊNH."
          description="Chọn một thiết kế, tải ảnh của bạn hoặc mở camera. Phòng thử sẽ ghép món đồ lên dáng người thật để bạn xem chi tiết."
        />

        {/* 3 Step Bars */}
        <View className="mt-8 gap-3">
          {STEPS.map((step) => (
            <View
              key={step.num}
              className="flex-row items-center gap-4 rounded-subtle bg-landing-sage-ink p-4"
            >
              <Text
                style={{
                  fontFamily: fontFamilyDisplay,
                  fontSize: 34,
                  lineHeight: 38,
                  color: '#EFE9E1',
                  fontWeight: '700',
                  width: 36,
                }}
              >
                {step.num}
              </Text>
              <View className="flex-1">
                <Text className="font-sans text-[13px] font-bold text-landing-paper">
                  {step.title}
                </Text>
                <Text className="mt-0.5 font-sans text-[11.5px] leading-relaxed text-landing-paper/90">
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <View className="mt-6">
          <Pressable
            accessibilityRole="button"
            onPress={() => onPressTryOn()}
            className="min-h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-landing-oxblood px-6 active:opacity-90"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
              Mở phòng thử AI
            </Text>
            <ArrowUpRight size={14} color="#EFE9E1" />
          </Pressable>
        </View>
      </View>

      {/* Interactive Try-On Studio Stage — full-bleed to screen edges, square corners,
          no drop shadow: matches FE's stage card instead of a rounded/shadowed box
          floating inside the paper background. */}
      <View className="mt-10 bg-landing-sage-ink p-5 sm:p-6">
        {/* Studio Inner Card */}
        <View className="relative aspect-[4/5] w-full overflow-hidden bg-landing-ivory">
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              contentFit="cover"
              contentPosition="top"
              transition={200}
              onError={() => markImageFailed(currentImage)}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center gap-2 bg-landing-ivory">
              <Sparkles size={22} color="#7C5722" />
              <Text className="font-sans text-[11px] uppercase tracking-[0.16em] text-landing-muted">
                Chọn thiết kế để xem trước
              </Text>
            </View>
          )}

          <View pointerEvents="none" className="absolute inset-0">
            <Svg width="100%" height="100%" accessibilityElementsHidden>
              <Defs>
                <LinearGradient id={scrimGradientId} x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={COLORS.obsidian} stopOpacity={0.55} />
                  <Stop offset="0.35" stopColor={COLORS.obsidian} stopOpacity={0} />
                  <Stop offset="1" stopColor={COLORS.obsidian} stopOpacity={0.35} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${scrimGradientId})`} />
            </Svg>
          </View>

          {/* Corner brackets */}
          <View
            pointerEvents="none"
            className="absolute inset-4 border border-landing-paper/20"
          />
          <View
            pointerEvents="none"
            className="absolute left-4 top-4 h-6 w-6 border-l border-t border-landing-paper/70"
          />
          <View
            pointerEvents="none"
            className="absolute right-4 top-4 h-6 w-6 border-r border-t border-landing-paper/70"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-4 left-4 h-6 w-6 border-b border-l border-landing-paper/70"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-landing-paper/70"
          />

          {/* Studio header line */}
          <View className="absolute left-6 top-6 flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-landing-brass" />
            <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-landing-paper/80">
              Try-On Studio
            </Text>
          </View>
          <Text className="absolute right-6 top-6 font-mono text-[9px] uppercase tracking-[0.2em] text-landing-paper/60">
            Frame 01
          </Text>

          {/* Studio footer line */}
          <View className="absolute inset-x-6 bottom-6 flex-row items-center justify-between">
            <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-landing-paper/75">
              {activeProduct ? 'Ảnh sản phẩm' : 'Ảnh minh hoạ'}
            </Text>
            <Sparkles size={20} color="#A67D44" />
          </View>
        </View>

        {/* Selected Product Metadata */}
        <View className="mt-5">
          <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-landing-paper/75">
            {activeProduct ? 'Đang chọn' : 'Phòng thử AI'}
          </Text>

          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 20,
              lineHeight: 26,
              color: '#EFE9E1',
              fontWeight: '700',
              marginTop: 6,
            }}
          >
            {activeProduct?.name ?? 'Chọn một thiết kế để bắt đầu'}
          </Text>

          {activeProduct ? (
            <>
              <Text className="mt-2 font-mono text-sm font-bold text-landing-paper/90">
                {formatProductPrice(activeProduct.price)}
              </Text>

              {/* Color Swatches */}
              {activeColors.length > 0 && (
                <View className="mt-3">
                  <View className="flex-row flex-wrap items-center gap-2">
                    {activeColors.map((color) => {
                      const isActive = currentColor
                        ? normalizeColorName(currentColor.name) === normalizeColorName(color.name)
                        : false;
                      return (
                        <Pressable
                          key={`${color.name}-${color.hex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Màu ${color.name}`}
                          accessibilityState={{ selected: isActive }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => setSelectedColorName(color.name)}
                          className={`h-7 w-7 items-center justify-center border ${
                            isActive ? 'border-landing-paper' : 'border-transparent'
                          }`}
                        >
                          <View
                            className="h-4 w-4 border border-landing-paper/30"
                            style={{ backgroundColor: color.hex }}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  {currentColor ? (
                    <Text className="mt-1.5 font-sans text-[10px] uppercase tracking-[0.16em] text-landing-paper/70">
                      Màu: {currentColor.name.replace(/^màu\s+/i, '')}
                    </Text>
                  ) : null}
                </View>
              )}
            </>
          ) : null}

          {/* Switch Items (Đổi món) */}
          {choices.length > 1 && (
            <View className="mt-6 border-t border-landing-paper/15 pt-4">
              <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-landing-paper/75">
                Đổi món
              </Text>

              <View className="mt-2.5 flex-row gap-2.5">
                {choices.map((item) => {
                  const isSelected = item.id === activeProduct?.id;
                  const thumbImage = getProductMainImage(item);
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Xem trước ${item.name}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        setSelectedProductId(item.id);
                        setSelectedColorName(null);
                      }}
                      className={`relative aspect-[3/4] flex-1 overflow-hidden border bg-landing-ivory ${
                        isSelected ? 'border-landing-paper' : 'border-landing-paper/15'
                      }`}
                    >
                      {thumbImage && !failedImages[thumbImage] ? (
                        <Image
                          source={{ uri: thumbImage }}
                          contentFit="cover"
                          contentPosition="top"
                          onError={() => markImageFailed(thumbImage)}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : null}
                      <View
                        pointerEvents="none"
                        className={`absolute inset-0 bg-landing-obsidian/45 ${
                          isSelected ? 'opacity-0' : 'opacity-100'
                        }`}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Try the selected product */}
          <Pressable
            accessibilityRole="button"
            onPress={() => onPressTryOn(activeProduct?.id)}
            className="mt-6 min-h-11 w-full flex-row items-center justify-center gap-2 border border-landing-paper/30 px-5 active:bg-landing-paper/10"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
              {activeProduct ? 'Thử món này' : 'Chọn trong catalog'}
            </Text>
            <ArrowUpRight size={14} color="#EFE9E1" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
