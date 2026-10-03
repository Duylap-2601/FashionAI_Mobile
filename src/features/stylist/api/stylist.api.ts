import { z } from 'zod';
import type { HttpOptions } from '@/api/http';
import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';
import { mapBackendStylistResult } from './stylist.mapper';
import type {
  IAnalyzeStylistOptions,
  IStylistAnalyzeInput,
  IStylistHistoryPage,
  IStylistHistoryParams,
  IStylistResult,
} from '../types/stylist';

export const STYLIST_ANALYZE_TIMEOUT_MS = 90_000;

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

function requireId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}

function appendOptional(form: FormData, key: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) {
    form.append(key, normalized);
  }
}

export function buildStylistFormData(input: IStylistAnalyzeInput): FormData {
  if (!input.productId?.trim() && !input.garmentDescription?.trim()) {
    throw new TypeError('Product ID or garment description is required');
  }

  const form = new FormData();
  form.append('humanImage', input.humanImage as unknown as Blob);
  appendOptional(form, 'productId', input.productId);
  appendOptional(form, 'garmentDescription', input.garmentDescription);
  appendOptional(form, 'occasion', input.occasion);
  appendOptional(form, 'stylePreference', input.stylePreference);
  appendOptional(form, 'budget', input.budget);
  appendOptional(form, 'genderPreference', input.genderPreference);
  return form;
}

export async function analyzeStylist(
  input: IStylistAnalyzeInput,
  options: IAnalyzeStylistOptions = {},
): Promise<IStylistResult> {
  const value = await http.upload<unknown>(
    ENDPOINTS.STYLIST.ANALYZE,
    buildStylistFormData(input),
    {
      signal: options.signal,
      timeout: STYLIST_ANALYZE_TIMEOUT_MS,
      onProgress: options.onProgress,
    },
  );
  return mapBackendStylistResult(value);
}

export async function getStylistHistory(
  params: IStylistHistoryParams = {},
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IStylistHistoryPage> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(Math.floor(params.limit), 100) : 20;
  const result = await http.getPaged<unknown[]>(ENDPOINTS.STYLIST.HISTORY, {
    params: { page, limit },
    signal: options?.signal,
  });
  const meta = paginationSchema.safeParse(result.meta);
  if (!meta.success) {
    throw new ApiError(
      'Dữ liệu phân trang lịch sử tư vấn không hợp lệ.',
      500,
      'INVALID_STYLIST_META',
    );
  }

  return {
    data: result.data.map(mapBackendStylistResult),
    meta: meta.data,
  };
}

export async function getStylistHistoryItem(
  resultId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IStylistResult> {
  const id = requireId(resultId, 'Stylist result ID');
  const value = await http.get<unknown>(ENDPOINTS.STYLIST.DETAIL(id), options);
  return mapBackendStylistResult(value);
}

export function deleteStylistHistoryItem(
  resultId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<null> {
  const id = requireId(resultId, 'Stylist result ID');
  return http.delete<null>(ENDPOINTS.STYLIST.DELETE(id), options);
}
