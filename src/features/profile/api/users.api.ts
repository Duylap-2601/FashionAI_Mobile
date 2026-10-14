import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { IUser } from '../types/user';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UserQuotaResponse {
  action: string;
  tier: string;
  limit: number | null;
  unlimited: boolean;
  used: number;
  remaining: number | null;
  resetAt: string;
  tierExpiresAt: string | null;
  requiresSubscription: boolean;
  limits?: Record<string, { label: string; limit: number | null; unlimited: boolean }>;
}

export const usersApi = {
  /** Lấy thông tin người dùng hiện tại */
  getMe(opts?: HttpOptions): Promise<IUser> {
    return http.get<IUser>(ENDPOINTS.USERS.ME, opts);
  },

  /** Cập nhật hồ sơ cá nhân */
  updateMe(data: UpdateProfileDto, opts?: HttpOptions): Promise<IUser> {
    return http.put<IUser>(ENDPOINTS.USERS.ME, data, opts);
  },

  /** Lấy quota AI hôm nay */
  getQuota(action: string = 'TRY_ON', opts?: HttpOptions): Promise<UserQuotaResponse> {
    return http.get<UserQuotaResponse>(ENDPOINTS.USERS.QUOTA, {
      ...opts,
      params: { action, ...opts?.params },
    });
  },

  /** Lấy danh sách địa chỉ giao hàng của tôi */
  getAddresses(opts?: HttpOptions): Promise<any[]> {
    return http.get<any[]>(ENDPOINTS.USERS.ADDRESSES, opts);
  },

  /** Thêm địa chỉ giao hàng mới */
  createAddress(data: any, opts?: HttpOptions): Promise<any> {
    return http.post<any>(ENDPOINTS.USERS.ADDRESSES, data, opts);
  },

  /** Xóa địa chỉ giao hàng */
  deleteAddress(id: string, opts?: HttpOptions): Promise<any> {
    return http.delete<any>(`${ENDPOINTS.USERS.ADDRESSES}/${id}`, opts);
  },

  /** Đặt địa chỉ mặc định */
  setDefaultAddress(id: string, opts?: HttpOptions): Promise<any> {
    return http.patch<any>(`${ENDPOINTS.USERS.ADDRESSES}/${id}/default`, undefined, opts);
  },
};
