export interface ApiSuccessResponse<T> {
  success: true;
  code: string;
  message: string;
  data: T;
  meta?: unknown;
}

export interface ApiPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiPaginatedSuccessResponse<T> extends Omit<ApiSuccessResponse<T>, 'meta'> {
  meta: ApiPaginationMeta;
}

export interface ApiPaginatedResponse<T> {
  data: T;
  meta: ApiPaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  details?: string[] | Record<string, unknown>;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: string[] | Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: string[] | Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Unwrap backend response envelope:
 * If success is true, returns response.data.
 * Otherwise throws ApiError.
 */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    if ('success' in payload && payload.success === true && 'data' in payload) {
      return payload.data as T;
    }
    if ('success' in payload && payload.success === false) {
      const errorPayload = payload as ApiErrorResponse;
      throw new ApiError(
        errorPayload.message || 'Unknown server error',
        errorPayload.statusCode || 500,
        errorPayload.code || 'UNKNOWN_ERROR',
        errorPayload.details,
      );
    }
  }
  return payload as T;
}

/**
 * Unwrap a paginated backend envelope while retaining its data and metadata.
 */
export function unwrapPaginated<T>(payload: unknown): ApiPaginatedResponse<T> {
  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === true && 'data' in payload) {
    if ('meta' in payload && isPaginationMeta(payload.meta)) {
      return { data: payload.data as T, meta: payload.meta };
    }

    throw new ApiError('Invalid pagination metadata', 500, 'INVALID_PAGINATION_METADATA');
  }

  unwrap<unknown>(payload);
  throw new ApiError('Invalid paginated response', 500, 'INVALID_PAGINATED_RESPONSE');
}

function isPaginationMeta(value: unknown): value is ApiPaginationMeta {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const meta = value as Record<string, unknown>;
  return (
    typeof meta.total === 'number' &&
    typeof meta.page === 'number' &&
    typeof meta.limit === 'number' &&
    typeof meta.totalPages === 'number'
  );
}
