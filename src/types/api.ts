export interface ApiSuccessResponse<T> {
  success: true;
  code: string;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  details?: string[] | Record<string, any>;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: string[] | Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: string[] | Record<string, any>,
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
 * If success is true, returns response.data
 * Otherwise throws ApiError.
 */
export function unwrap<T>(payload: any): T {
  if (payload && typeof payload === 'object') {
    if (payload.success === true && 'data' in payload) {
      return payload.data as T;
    }
    if (payload.success === false) {
      throw new ApiError(
        payload.message || 'Unknown server error',
        payload.statusCode || 500,
        payload.code || 'UNKNOWN_ERROR',
        payload.details,
      );
    }
  }
  return payload as T;
}
