import type { IProduct } from '@/features/products/types/product';
import type { ApiPaginationMeta } from '@/types/api';

export type StylistGenderPreference = 'male' | 'female' | 'other';
export type StylistImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface IStylistImageFile {
  uri: string;
  name: string;
  type: StylistImageMimeType;
}

export interface IStylistAnalyzeInput {
  humanImage: IStylistImageFile;
  productId?: string;
  garmentDescription?: string;
  occasion?: string;
  stylePreference?: string;
  budget?: string;
  genderPreference?: StylistGenderPreference;
}

export interface IStylistAnalysis {
  bodyType: string;
  skinTone: string;
  personalColor: string;
  fitRecommendation: string;
  fitAdvice: string | null;
  productCompatibilityScore: number | null;
  colorSuggestions: string[];
  outfitCombinations: string[];
  stylingTips: string;
  verdict: string;
}

export interface IStylistResult {
  id: string;
  humanImageUrl: string;
  product: Pick<IProduct, 'id' | 'name'> | null;
  garmentDescription: string | null;
  occasion: string | null;
  stylePreference: string | null;
  budget: string | null;
  genderPreference: StylistGenderPreference | null;
  analysis: IStylistAnalysis;
  model: string | null;
  createdAt: string;
  isCached?: boolean;
}

export interface IStylistHistoryParams {
  page?: number;
  limit?: number;
}

export interface IStylistHistoryPage {
  data: IStylistResult[];
  meta: ApiPaginationMeta;
}

export interface IAnalyzeStylistOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}
