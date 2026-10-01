import { AxiosRequestConfig, AxiosProgressEvent, CanceledError, isAxiosError } from 'axios';
import { api } from '@/api/client';
import { ApiError, ApiSuccessResponse, unwrap } from '@/types/api';

/**
 * Tuỳ chọn cho mọi lời gọi của http wrapper.
 * Kế thừa AxiosRequestConfig nhưng loại bỏ `url`/`method`/`data`
 * vì wrapper đã quản lý các giá trị này.
 */
export type HttpOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'> & {
  /** AbortSignal để huỷ request (React Query v5 truyền sẵn trong queryFn). */
  signal?: AbortSignal;
};

/** Kết quả kèm `meta` dùng cho các danh sách phân trang. */
export interface PagedResult<T> {
  data: T;
  meta: ApiSuccessResponse<T>['meta'];
}

/** `true` nếu lỗi phát sinh do request bị huỷ (unmount, đổi filter, ...). */
export function isCanceledError(error: unknown): boolean {
  if (error instanceof CanceledError) return true;
  if (isAxiosError(error)) return error.code === 'ERR_CANCELED';
  return (error as { name?: string })?.name === 'AbortError';
}

/**
 * Chuẩn hoá mọi lỗi thành `ApiError` để UI chỉ cần xử lý một kiểu.
 * Ngoại lệ: lỗi do huỷ request được throw lại nguyên trạng để
 * `isCanceledError()` và React Query nhận diện đúng.
 */
function toApiError(error: unknown): ApiError {
  if (isCanceledError(error)) throw error;
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const payload = error.response?.data as Record<string, any> | undefined;

    if (payload && typeof payload === 'object' && payload.success === false) {
      return new ApiError(
        payload.message || error.message,
        payload.statusCode || error.response?.status || 500,
        payload.code || 'UNKNOWN_ERROR',
        payload.details,
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('Kết nối quá lâu, vui lòng thử lại.', 408, 'REQUEST_TIMEOUT');
    }

    if (!error.response) {
      return new ApiError(
        'Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng.',
        0,
        'NETWORK_ERROR',
      );
    }

    return new ApiError(
      error.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
      error.response.status,
      'UNKNOWN_ERROR',
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500, 'UNKNOWN_ERROR');
  }

  return new ApiError('Đã xảy ra lỗi, vui lòng thử lại.', 500, 'UNKNOWN_ERROR');
}

/** Gọi axios và trả về envelope gốc (giữ cả `meta`). */
async function requestEnvelope<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  options?: HttpOptions,
): Promise<ApiSuccessResponse<T>> {
  try {
    const res = await api.request<ApiSuccessResponse<T>>({
      ...options,
      url,
      method,
      data,
    });
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Gọi axios, trả về `data` đã bóc khỏi envelope. */
async function request<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  options?: HttpOptions,
): Promise<T> {
  const envelope = await requestEnvelope<T>(method, url, data, options);
  try {
    return unwrap<T>(envelope);
  } catch (error) {
    throw toApiError(error);
  }
}

export const http = {
  get<T>(url: string, options?: HttpOptions): Promise<T> {
    return request<T>('get', url, undefined, options);
  },

  post<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return request<T>('post', url, data, options);
  },

  put<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return request<T>('put', url, data, options);
  },

  patch<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return request<T>('patch', url, data, options);
  },

  delete<T = void>(url: string, options?: HttpOptions): Promise<T> {
    return request<T>('delete', url, undefined, options);
  },

  /** Giữ lại `meta` (page, limit, total, totalPages) cho danh sách phân trang. */
  async getPaged<T>(url: string, options?: HttpOptions): Promise<PagedResult<T>> {
    const envelope = await requestEnvelope<T>('get', url, undefined, options);
    return { data: unwrap<T>(envelope), meta: envelope.meta };
  },

  /** Upload multipart/form-data (ảnh try-on, stylist, đánh giá). */
  upload<T>(
    url: string,
    formData: FormData,
    options?: HttpOptions & {
      onProgress?: (percent: number) => void;
      method?: 'post' | 'put' | 'patch';
    },
  ): Promise<T> {
    const { onProgress, method = 'post', headers, ...rest } = options ?? {};

    return request<T>(method, url, formData, {
      ...rest,
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event: AxiosProgressEvent) => {
            if (!event.total) return;
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        : rest.onUploadProgress,
    });
  },

  /** Trả về envelope gốc khi cần đọc `code`/`message` của backend. */
  raw: requestEnvelope,
};

export { ApiError } from '@/types/api';
