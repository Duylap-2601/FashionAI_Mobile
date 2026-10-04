import { z } from 'zod';
import { ApiError } from '@/types/api';
import type { IStylistResult } from '../types/stylist';

const analysisSchema = z.object({
  bodyType: z.string().min(1),
  skinTone: z.string().min(1),
  personalColor: z.string().min(1),
  fitRecommendation: z.string().min(1),
  fitAdvice: z.string().nullable().optional(),
  productCompatibilityScore: z.number().min(0).max(100).nullable().optional(),
  colorSuggestions: z.array(z.string()),
  outfitCombinations: z.array(z.string()),
  stylingTips: z.string().min(1),
  verdict: z.string().min(1),
});

const resultSchema = z.object({
  id: z.string().min(1),
  humanImageUrl: z.string().min(1),
  product: z
    .object({ id: z.string().min(1), name: z.string().min(1) })
    .nullable()
    .optional(),
  garmentDescription: z.string().nullable().optional(),
  occasion: z.string().nullable().optional(),
  stylePreference: z.string().nullable().optional(),
  budget: z.string().nullable().optional(),
  genderPreference: z.enum(['male', 'female', 'other']).nullable().optional(),
  analysisResult: analysisSchema,
  model: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  isCached: z.boolean().optional(),
});

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
  return {
    id: result.id,
    humanImageUrl: result.humanImageUrl,
    product: result.product ?? null,
    garmentDescription: result.garmentDescription ?? null,
    occasion: result.occasion ?? null,
    stylePreference: result.stylePreference ?? null,
    budget: result.budget ?? null,
    genderPreference: result.genderPreference ?? null,
    analysis: {
      ...result.analysisResult,
      fitAdvice: result.analysisResult.fitAdvice ?? null,
      productCompatibilityScore:
        result.analysisResult.productCompatibilityScore ?? null,
    },
    model: result.model ?? null,
    createdAt: result.createdAt,
    ...(result.isCached === undefined ? {} : { isCached: result.isCached }),
  };
}
