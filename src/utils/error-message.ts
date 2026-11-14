import { ApiError } from '@/types/api';

function detailsToMessage(details: ApiError['details']): string | null {
  if (!details) return null;

  if (typeof details === 'string') return details;

  if (Array.isArray(details)) {
    const parts = details
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'message' in item) {
          const message = (item as { message?: unknown }).message;
          return typeof message === 'string' ? message : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join(' ') : null;
  }

  return null;
}

const GENERIC_VALIDATION_MESSAGE = 'Dữ liệu đầu vào không hợp lệ';

export function getErrorMessage(
  error: unknown,
  fallback = 'Đã xảy ra lỗi, vui lòng thử lại.',
): string {
  if (error instanceof ApiError) {
    const detail = detailsToMessage(error.details);
    if (detail && (!error.message || error.message === GENERIC_VALIDATION_MESSAGE)) {
      return detail;
    }
    return error.message || detail || fallback;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
