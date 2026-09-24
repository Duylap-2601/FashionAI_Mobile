import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { getTokens, setTokens, clearTokens } from '../auth/secureStorage';
import { ApiError, ApiSuccessResponse, unwrap } from '../types/api';
import { AuthTokens } from '../types/auth';

type UnauthorizedCallback = () => void;
const unauthorizedListeners: Set<UnauthorizedCallback> = new Set();

export function onUnauthorized(callback: UnauthorizedCallback): () => void {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in unauthorized listener:', e);
    }
  });
}

export const api = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'X-Platform': 'mobile',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getTokens();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // Ensure X-Platform is always mobile
    if (config.headers) {
      config.headers['X-Platform'] = 'mobile';
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = await getTokens();
  if (!refreshToken) return null;

  try {
    // Direct axios call without interceptor cycle to avoid deadlocks
    const response = await axios.post<ApiSuccessResponse<AuthTokens>>(
      `${ENV.API_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'X-Platform': 'mobile',
          'Content-Type': 'application/json',
        },
      },
    );

    const data = unwrap<AuthTokens>(response.data);
    await setTokens(data);
    return data.accessToken;
  } catch (error) {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const errorData = error.response?.data;
    const status = error.response?.status;
    const errorCode = errorData?.code;

    // Handle token expiration
    if (status === 401 && errorCode === 'ACCESS_TOKEN_EXPIRED' && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      refreshingPromise ??= refreshAccessToken();
      const newAccessToken = await refreshingPromise;
      refreshingPromise = null;

      if (newAccessToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      }

      // Refresh failed: session completely expired
      await clearTokens();
      notifyUnauthorized();
    }

    // Convert to unified ApiError if response envelope matches
    if (errorData && typeof errorData === 'object' && errorData.success === false) {
      return Promise.reject(
        new ApiError(
          errorData.message || error.message,
          errorData.statusCode || status || 500,
          errorData.code || 'UNKNOWN_ERROR',
          errorData.details,
        ),
      );
    }

    return Promise.reject(error);
  },
);
