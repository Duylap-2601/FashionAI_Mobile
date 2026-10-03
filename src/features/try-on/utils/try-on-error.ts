import { ApiError } from '@/types/api';

export type TryOnErrorAction =
  | { kind: 'subscription-required'; reason?: string }
  | { kind: 'quota-exceeded'; resetAt?: string; requested?: number; remaining?: number }
  | { kind: 'duplicate-request' }
  | { kind: 'image-quality-rejected'; message: string }
  | { kind: 'measurements-incomplete'; missing: string[] }
  | { kind: 'generic'; message: string };

function detailField<T>(details: ApiError['details'], field: string): T | undefined {
  if (!details || Array.isArray(details)) return undefined;
  const value = (details as Record<string, unknown>)[field];
  return value as T | undefined;
}

export function readTryOnError(error: ApiError): TryOnErrorAction {
  const { statusCode, code, details, message } = error;

  if (statusCode === 402 || code === 'SUBSCRIPTION_REQUIRED') {
    return { kind: 'subscription-required', reason: detailField(details, 'reason') };
  }

  if (code === 'DUPLICATE_REQUEST') {
    return { kind: 'duplicate-request' };
  }

  if (statusCode === 429 || code === 'QUOTA_EXCEEDED') {
    return {
      kind: 'quota-exceeded',
      resetAt: detailField(details, 'resetAt'),
      requested: detailField(details, 'requested'),
      remaining: detailField(details, 'remaining') ?? 0,
    };
  }

  if (statusCode === 422 || code === 'IMAGE_QUALITY_REJECTED') {
    return {
      kind: 'image-quality-rejected',
      message:
        message || 'Ảnh chụp không đạt tiêu chuẩn (mờ, tối hoặc không thấy toàn thân).',
    };
  }

  if (code === 'MEASUREMENTS_INCOMPLETE') {
    const missing = detailField<{ label: string }[]>(details, 'missing') ?? [];
    return { kind: 'measurements-incomplete', missing: missing.map((m) => m.label) };
  }

  return { kind: 'generic', message: message || 'Đã xảy ra lỗi, vui lòng thử lại.' };
}
