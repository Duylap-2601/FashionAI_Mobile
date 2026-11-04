import React, { useState } from 'react';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Shirt,
  Sparkles,
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { STYLIST_GENDERS } from '../constants/stylist-options';
import type { IStylistColorSuggestion, IStylistResult } from '../types/stylist';

interface StylistResultContentProps {
  result: IStylistResult;
  onProductPress?: (productId: string) => void;
  onTryOnPress?: (product?: { id: string; name: string; imageUrl?: string }) => void;
}

const sectionLabelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
// Chip tóm tắt yêu cầu, cùng kiểu StylistBriefSummary của web (chỉ hiển thị, không bấm được).
const briefChipClass =
  'rounded-subtle border border-landing-line bg-ivory px-2.5 py-1 font-sans text-[12px] text-landing-obsidian/80';

function toTips(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function scoreTone(score: number) {
  if (score >= 80) return { bar: 'bg-sage-ink', label: 'Rất hợp' };
  if (score >= 60) return { bar: 'bg-brass', label: 'Khá hợp' };
  return { bar: 'bg-danger', label: 'Ít hợp' };
}

function ColorChip({ color }: { color: IStylistColorSuggestion }) {
  const [copied, setCopied] = useState(false);

  if (!color.hex) {
    return (
      <Text className="rounded-subtle border border-landing-line bg-landing-paper px-2.5 py-1 font-sans text-[12px] text-landing-obsidian/80">
        {color.name}
      </Text>
    );
  }

  const copyHex = async () => {
    await Clipboard.setStringAsync(color.hex!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sao chép mã màu ${color.hex}`}
      onPress={() => void copyHex()}
      className="min-h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line bg-landing-paper py-1 pl-1 pr-2.5 active:border-oxblood"
    >
      {/* Màu do AI trả về nên không dùng được token. */}
      <View
        style={{ backgroundColor: color.hex }}
        className="h-8 w-8 rounded-subtle border border-landing-obsidian/10"
      />
      <Text className="font-sans text-[12px] font-medium text-landing-obsidian">
        {color.name}
      </Text>
      <Text className="font-mono text-[10.5px] uppercase text-landing-muted">
        {color.hex}
      </Text>
      {copied ? (
        <Check size={12} strokeWidth={2} color={COLORS.sageInk} />
      ) : (
        <Copy size={12} strokeWidth={1.75} color={COLORS.muted} />
      )}
    </Pressable>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 border-t border-landing-line pt-3">
      <Text className="font-sans text-[11px] uppercase tracking-[0.16em] text-landing-muted">
        {label}
      </Text>
      <Text selectable className="font-sans text-body-md font-medium text-landing-obsidian">
        {value}
      </Text>
    </View>
  );
}

export function StylistResultContent({
  result,
  onProductPress,
  onTryOnPress,
}: StylistResultContentProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed =
    !result.humanImageUrl || failedImageUrl === result.humanImageUrl;
  const { analysis } = result;

  const outfits = analysis.outfitCombinations ?? [];
  const colors = analysis.colorSuggestions ?? [];
  const tips = toTips(analysis.stylingTips);
  const score = analysis.productCompatibilityScore;
  const tone = score !== null ? scoreTone(score) : null;
  const genderLabel = STYLIST_GENDERS.find(
    (option) => option.value === result.genderPreference,
  )?.label;
  const briefChips = [result.stylePreference, result.budget, genderLabel].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return (
    <View className="gap-8">
      {/* Ảnh + dịp mặc */}
      <View className="flex-row gap-lg">
        <View className="h-28 w-20 shrink-0 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
          {!imageFailed ? (
            <Image
              source={{ uri: result.humanImageUrl }}
              contentFit="cover"
              transition={150}
              style={StyleSheet.absoluteFill}
              onError={() => setFailedImageUrl(result.humanImageUrl)}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-2">
              <Text className="text-center font-sans text-[10px] text-landing-muted">
                Chưa có ảnh
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 gap-1">
          <Text className={sectionLabelClass}>Yêu cầu của bạn</Text>
          <Text className="mt-1 font-display text-[22px] leading-tight text-landing-obsidian">
            {result.occasion || 'Tư vấn phong cách cá nhân'}
          </Text>
          {briefChips.length > 0 ? (
            <View className="mt-1 flex-row flex-wrap gap-1.5">
              {briefChips.map((chip) => (
                <Text key={chip} numberOfLines={1} className={briefChipClass}>
                  {chip}
                </Text>
              ))}
            </View>
          ) : null}
          {result.garmentDescription ? (
            <Text
              numberOfLines={2}
              className="font-sans text-body-sm leading-relaxed text-landing-muted"
            >
              {result.garmentDescription}
            </Text>
          ) : null}
          {result.isCached ? (
            <Text className="mt-1 self-start rounded-subtle border border-landing-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
              Đã phân tích trước đó
            </Text>
          ) : null}
        </View>
      </View>

      {result.product ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem sản phẩm ${result.product.name}`}
          onPress={() => onProductPress?.(result.product!.id)}
          className="min-h-11 flex-row items-center gap-3 rounded-subtle border border-landing-line bg-ivory p-3 active:opacity-80"
        >
          <Shirt size={16} strokeWidth={1.75} color={COLORS.oxblood} />
          <Text className="flex-1 font-display text-[15px] text-landing-obsidian" numberOfLines={1}>
            {result.product.name}
          </Text>
          <ArrowRight size={14} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      ) : null}

      {/* Bộ phối */}
      <View className="gap-5">
        {outfits.length > 0 ? (
          <View className="flex-row items-end justify-between gap-3 border-b border-landing-line pb-4">
            <View>
              <Text className={sectionLabelClass}>Kết quả</Text>
              <Text
                accessibilityRole="header"
                className="mt-2 font-display text-headline-sm text-landing-obsidian"
              >
                Bộ phối dành cho bạn
              </Text>
            </View>
            <Text className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted">
              {String(outfits.length).padStart(2, '0')} bộ
            </Text>
          </View>
        ) : null}

        {outfits.length > 0 ? (
          <View className="gap-3">
            {outfits.map((outfit, index) => (
              <View
                key={`${outfit}-${index}`}
                className="gap-2 rounded-subtle border border-landing-line bg-ivory p-4"
              >
                <View className="flex-row items-baseline gap-2.5">
                  <Text className="font-mono text-[11px] text-brass-ink">
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text className="font-display text-[18px] leading-snug text-landing-obsidian">
                    Bộ phối {index + 1}
                  </Text>
                </View>
                <Text
                  selectable
                  className="font-sans text-body-md leading-relaxed text-landing-obsidian/85"
                >
                  {outfit}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 rounded-subtle border border-landing-line bg-ivory px-6 py-10">
            <Text className="text-center font-display text-[20px] text-landing-obsidian">
              Chưa có bộ phối phù hợp trong cửa hàng
            </Text>
            <Text className="text-center font-sans text-body-sm text-landing-muted">
              Thử đổi dịp mặc, phong cách hoặc ngân sách.
            </Text>
          </View>
        )}
      </View>

      {/* Hồ sơ phong cách + Lời khuyên */}
      <View className="gap-4">
        <View className="gap-4 rounded-subtle border border-landing-line bg-ivory p-5">
          <Text className={sectionLabelClass}>Hồ sơ phong cách</Text>

          <View className="gap-3">
            {analysis.bodyType ? (
              <ProfileRow label="Dáng người" value={analysis.bodyType} />
            ) : null}
            {analysis.skinTone ? (
              <ProfileRow label="Tông da" value={analysis.skinTone} />
            ) : null}
            {analysis.personalColor ? (
              <ProfileRow label="Màu cá nhân" value={analysis.personalColor} />
            ) : null}
          </View>

          {colors.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans text-[11px] uppercase tracking-[0.16em] text-landing-muted">
                Màu nên mặc
                {colors.some((color) => color.hex) ? ' · bấm để sao chép mã' : ''}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {colors.map((color, index) => (
                  <ColorChip key={`${color.name}-${index}`} color={color} />
                ))}
              </View>
            </View>
          ) : null}

          {score !== null && tone ? (
            <View className="gap-2">
              <View className="flex-row items-baseline justify-between">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-sans text-[11px] uppercase tracking-[0.16em] text-landing-muted"
                >
                  Độ hợp
                  {result.product ? ` với ${result.product.name}` : ''}
                </Text>
                <Text className="font-mono text-[12px] text-landing-obsidian">
                  {score}% · {tone.label}
                </Text>
              </View>
              <View className="h-0.5 overflow-hidden bg-landing-line">
                <View style={{ width: `${score}%` }} className={`h-full ${tone.bar}`} />
              </View>
            </View>
          ) : null}
        </View>

        <View className="gap-4 rounded-subtle border border-landing-line bg-ivory p-5">
          <Text className={sectionLabelClass}>Lời khuyên</Text>
          {analysis.verdict ? (
            <Text
              selectable
              className="font-display text-[17px] leading-relaxed text-landing-obsidian"
            >
              {analysis.verdict}
            </Text>
          ) : null}

          {tips.length > 0 ? (
            <View className="gap-2">
              {tips.map((tip, index) => (
                <View key={`${tip}-${index}`} className="flex-row gap-3">
                  <Text className="pt-0.5 font-mono text-[11px] text-brass-ink">
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text
                    selectable
                    className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian/80"
                  >
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {analysis.fitAdvice ? (
            <Text
              selectable
              className="border-t border-landing-line pt-3 font-sans text-body-sm leading-relaxed text-landing-obsidian/80"
            >
              <Text className="font-semibold text-landing-obsidian">Phom dáng: </Text>
              {analysis.fitAdvice}
            </Text>
          ) : analysis.fitRecommendation ? (
            <Text
              selectable
              className="border-t border-landing-line pt-3 font-sans text-body-sm leading-relaxed text-landing-obsidian/80"
            >
              <Text className="font-semibold text-landing-obsidian">Phom dáng: </Text>
              {analysis.fitRecommendation}
            </Text>
          ) : null}
        </View>
      </View>

      {/* CTA thử đồ */}
      <View className="gap-3 rounded-subtle border border-landing-line bg-ivory p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-subtle border border-landing-line">
            <Shirt size={18} strokeWidth={1.5} color={COLORS.oxblood} />
          </View>
          <View className="flex-1">
            <Text className="font-display text-[17px] text-landing-obsidian">
              Trải nghiệm phòng thử đồ ảo AI
            </Text>
            <Text className="font-sans text-body-sm text-landing-muted">
              Ứng dụng gợi ý phối đồ này lên ảnh toàn thân của bạn
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onTryOnPress?.(
              result.product
                ? { id: result.product.id, name: result.product.name }
                : undefined,
            )
          }
          className="h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90"
        >
          <Sparkles size={16} strokeWidth={1.75} color={COLORS.paper} />
          <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            Chuyển sang Thử đồ AI
          </Text>
          <ArrowRight size={15} strokeWidth={1.75} color={COLORS.paper} />
        </Pressable>
      </View>

      {analysis.fitRecommendation && analysis.fitAdvice ? (
        <View className="flex-row items-start gap-2 border-l-2 border-brass bg-ivory px-4 py-3">
          <AlertCircle size={14} strokeWidth={1.75} color={COLORS.brassInk} />
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
            {analysis.fitRecommendation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default StylistResultContent;
