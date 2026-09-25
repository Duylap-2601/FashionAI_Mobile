import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import { unwrap } from '@/types/api';
import { AuthResponseData, LoginDto, RegisterDto, User } from '@/features/auth/types/auth';

export const authApi = {
  async login(data: LoginDto): Promise<AuthResponseData> {
    const res = await api.post(ENDPOINTS.AUTH.LOGIN, data);
    return unwrap<AuthResponseData>(res.data);
  },

  async register(data: RegisterDto): Promise<AuthResponseData> {
    const res = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    return unwrap<AuthResponseData>(res.data);
  },

  async exchangeOAuthCode(code: string): Promise<AuthResponseData> {
    const res = await api.post(ENDPOINTS.AUTH.EXCHANGE, { code });
    return unwrap<AuthResponseData>(res.data);
  },

  async logout(refreshToken?: string | null): Promise<void> {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken: refreshToken || undefined });
    } catch (err) {
      // Still allow client to proceed with local logout
      console.warn('Backend logout error:', err);
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT_ALL);
    } catch (err) {
      console.warn('Backend logoutAll error:', err);
    }
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get(ENDPOINTS.USERS.ME);
    return unwrap<User>(res.data);
  },

  async getUserQuota(action?: string): Promise<any> {
    const res = await api.get(ENDPOINTS.USERS.QUOTA, {
      params: action ? { action } : undefined,
    });
    return unwrap<any>(res.data);
  },

  async forgotPassword(email: string): Promise<{ message?: string }> {
    const res = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return unwrap<{ message?: string }>(res.data);
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message?: string }> {
    const res = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
    return unwrap<{ message?: string }>(res.data);
  },

  async verifyEmail(token: string): Promise<{ message?: string }> {
    const res = await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    return unwrap<{ message?: string }>(res.data);
  },
};
