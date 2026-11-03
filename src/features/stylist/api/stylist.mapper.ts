import { z } from 'zod';
import { ApiError } from '@/types/api';
import type { IStylistResult } from '../types/stylist';

const colorSuggestionSchema = z.union([
  z.string(),
  z.object({
    name: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    hex: z.string().nullable().optional(),
  }),
]);

const outfitItemSchema = z.object({
  type: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

const outfitCombinationSchema = z.union([
  z.string(),
  z.object({
    name: z.string().nullable().optional(),
    items: z.array(outfitItemSchema).optional(),
  }),
]);

const analysisSchema = z
  .object({
    bodyType: z.string().nullable().optional(),
    skinTone: z.string().nullable().optional(),
    personalColor: z.string().nullable().optional(),
    fitRecommendation: z.string().nullable().optional(),
    fitAdvice: z.string().nullable().optional(),
    recommendedSize: z.string().nullable().optional(),
    productCompatibilityScore: z.number().min(0).max(100).nullable().optional(),
    colorSuggestions: z.array(colorSuggestionSchema).optional(),
    outfitCombinations: z.array(outfitCombinationSchema).optional(),
    stylingTips: z.string().nullable().optional(),
    verdict: z.string().nullable().optional(),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough();

const resultSchema = z
  .object({
    id: z.string().min(1),
    humanImageUrl: z.string().nullable().optional(),
    hasImage: z.boolean().optional(),
    product: z
      .object({ id: z.string().min(1), name: z.string().min(1) })
      .nullable()
      .optional(),
    garmentDescription: z.string().nullable().optional(),
    occasion: z.string().nullable().optional(),
    stylePreference: z.string().nullable().optional(),
    budget: z.string().nullable().optional(),
    genderPreference: z.enum(['male', 'female', 'other']).nullable().optional(),
    analysisResult: analysisSchema.optional(),
    // BE mới trả các trường phân tích ở cấp cao nhất (không còn bọc analysisResult).
    bodyType: z.string().nullable().optional(),
    skinTone: z.string().nullable().optional(),
    personalColor: z.string().nullable().optional(),
    fitRecommendation: z.string().nullable().optional(),
    fitAdvice: z.string().nullable().optional(),
    recommendedSize: z.string().nullable().optional(),
    productCompatibilityScore: z.number().min(0).max(100).nullable().optional(),
    colorSuggestions: z.array(colorSuggestionSchema).optional(),
    outfitCombinations: z.array(outfitCombinationSchema).optional(),
    stylingTips: z.string().nullable().optional(),
    verdict: z.string().nullable().optional(),
    warnings: z.array(z.string()).optional(),
    model: z.string().nullable().optional(),
    createdAt: z.string().min(1),
    isCached: z.boolean().optional(),
  })
  .passthrough();

function normalizeHex(value: string | null | undefined): string | null {
  const hex = (value ?? '').trim();
  if (!hex) return null;
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function toColorSuggestion(value: z.infer<typeof colorSuggestionSchema>): {
  name: string;
  hex: string | null;
} {
  if (typeof value === 'string') return { name: value.trim(), hex: null };
  return {
    name: (value.name ?? value.color ?? value.hex ?? '').trim(),
    hex: normalizeHex(value.hex),
  };
}

function toOutfitText(value: z.infer<typeof outfitCombinationSchema>): string {
  if (typeof value === 'string') return value.trim();
  const items = (value.items ?? [])
    .map((item) => (item.name ?? '').trim())
    .filter(Boolean);
  const name = (value.name ?? '').trim();
  if (name && items.length > 0) return `${name}: ${items.join(' · ')}`;
  return name || items.join(' · ');
}

export function mapBackendStylistResult(value: unknown): IStylistResult {
  const parsed = resultSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(
      'Dữ liệu tư vấn từ máy chủ không hợp lệ.',
      500,
      'INVALID_STYLIST_DATA',
    );
  }

  const result = parsed.data;
  const analysis = result.analysisResult ?? {
    bodyType: result.bodyType,
    skinTone: result.skinTone,
    personalColor: result.personalColor,
    fitRecommendation: result.fitRecommendation,
    fitAdvice: result.fitAdvice,
    recommendedSize: result.recommendedSize,
    productCompatibilityScore: result.productCompatibilityScore,
    colorSuggestions: result.colorSuggestions,
    outfitCombinations: result.outfitCombinations,
    stylingTips: result.stylingTips,
    verdict: result.verdict,
    warnings: result.warnings,
  };

  return {
    id: result.id,
    humanImageUrl: result.humanImageUrl ?? '',
    product: result.product ?? null,
    garmentDescription: result.garmentDescription ?? null,
    occasion: result.occasion ?? null,
    stylePreference: result.stylePreference ?? null,
    budget: result.budget ?? null,
    genderPreference: result.genderPreference ?? null,
    analysis: {
      bodyType: analysis.bodyType ?? '',
      skinTone: analysis.skinTone ?? '',
      personalColor: analysis.personalColor ?? '',
      fitRecommendation: analysis.fitRecommendation ?? '',
      fitAdvice: analysis.fitAdvice ?? null,
      productCompatibilityScore: analysis.productCompatibilityScore ?? null,
      colorSuggestions: (analysis.colorSuggestions ?? [])
        .map(toColorSuggestion)
        .filter((color) => color.name || color.hex),
      outfitCombinations: (analysis.outfitCombinations ?? [])
        .map(toOutfitText)
        .filter(Boolean),
      stylingTips: analysis.stylingTips ?? '',
      verdict: analysis.verdict ?? '',
    },
    model: result.model ?? null,
    createdAt: result.createdAt,
    ...(result.isCached === undefined ? {} : { isCached: result.isCached }),
  };
}
