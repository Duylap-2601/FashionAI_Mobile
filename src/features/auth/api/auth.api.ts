import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ENV } from '@/config/env';
import { AuthResponseData, LoginDto, RegisterDto, User } from '@/features/auth/types/auth';

type MessageResponse = { message?: string };

export const authApi = {
  googleAuthUrl(): string {
    const redirectUri = encodeURIComponent(ENV.OAUTH_REDIRECT_SCHEME);
    return `${ENV.API_URL}${ENDPOINTS.AUTH.GOOGLE}?platform=mobile&redirect_uri=${redirectUri}`;
  },

  login(data: LoginDto, opts?: HttpOptions): Promise<AuthResponseData> {
    return http.post<AuthResponseData>(ENDPOINTS.AUTH.LOGIN, data, opts);
  },

  register(data: RegisterDto, opts?: HttpOptions): Promise<AuthResponseData> {
    return http.post<AuthResponseData>(ENDPOINTS.AUTH.REGISTER, data, opts);
  },

  exchangeOAuthCode(code: string, opts?: HttpOptions): Promise<AuthResponseData> {
    return http.post<AuthResponseData>(ENDPOINTS.AUTH.EXCHANGE, { code }, opts);
  },

  async logout(refreshToken?: string | null, opts?: HttpOptions): Promise<void> {
    try {
      await http.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken: refreshToken || undefined }, opts);
    } catch (err) {
      // Still allow client to proceed with local logout
      console.warn('Backend logout error:', err);
    }
  },

  async logoutAll(opts?: HttpOptions): Promise<void> {
    try {
      await http.post(ENDPOINTS.AUTH.LOGOUT_ALL, undefined, opts);
    } catch (err) {
      console.warn('Backend logoutAll error:', err);
    }
  },

  getCurrentUser(opts?: HttpOptions): Promise<User> {
    return http.get<User>(ENDPOINTS.USERS.ME, opts);
  },

  getUserQuota(action?: string, opts?: HttpOptions): Promise<any> {
    return http.get<any>(ENDPOINTS.USERS.QUOTA, {
      ...opts,
      params: action ? { action, ...opts?.params } : opts?.params,
    });
  },

  forgotPassword(email: string, opts?: HttpOptions): Promise<MessageResponse> {
    return http.post<MessageResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }, opts);
  },

  resetPassword(token: string, newPassword: string, opts?: HttpOptions): Promise<MessageResponse> {
    return http.post<MessageResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword }, opts);
  },

  verifyEmail(token: string, opts?: HttpOptions): Promise<MessageResponse> {
    return http.post<MessageResponse>(ENDPOINTS.AUTH.VERIFY_EMAIL, { token }, opts);
  },

  resendVerification(opts?: HttpOptions): Promise<MessageResponse> {
    return http.post<MessageResponse>(ENDPOINTS.AUTH.RESEND_VERIFICATION, undefined, opts);
  },

  changePassword(
    currentPassword: string,
    newPassword: string,
    opts?: HttpOptions,
  ): Promise<MessageResponse> {
    return http.post<MessageResponse>(
      ENDPOINTS.AUTH.CHANGE_PASSWORD,
      { currentPassword, newPassword },
      opts,
    );
  },
};
