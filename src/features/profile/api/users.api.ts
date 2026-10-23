import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { IUser } from '../types/user';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  city?: string;
  job?: string;
  company?: string;
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

export interface IUserAddress {
  id: string;
  userId?: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  label?: string | null;
  ghnAddressModel?: string | null;
  ghnProvinceV3Id?: string | null;
  ghnWardV3Id?: string | null;
  provinceName: string;
  wardName: string;
  isDefault: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpsertUserAddressDto {
  recipientName: string;
  phone: string;
  addressLine: string;
  label?: string;
  ghnProvinceV3Id: string;
  ghnWardV3Id: string;
  isDefault?: boolean;
  expectedVersion?: number;
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
  getAddresses(opts?: HttpOptions): Promise<IUserAddress[]> {
    return http.get<IUserAddress[]>(ENDPOINTS.USERS.ADDRESSES, opts);
  },

  /** Thêm địa chỉ giao hàng mới */
  createAddress(data: IUpsertUserAddressDto, opts?: HttpOptions): Promise<IUserAddress> {
    return http.post<IUserAddress>(ENDPOINTS.USERS.ADDRESSES, data, opts);
  },

  /** Cập nhật địa chỉ giao hàng */
  updateAddress(
    id: string,
    data: IUpsertUserAddressDto,
    opts?: HttpOptions,
  ): Promise<IUserAddress> {
    return http.patch<IUserAddress>(`${ENDPOINTS.USERS.ADDRESSES}/${id}`, data, opts);
  },

  /** Xóa địa chỉ giao hàng */
  deleteAddress(id: string, opts?: HttpOptions): Promise<{ deleted: boolean }> {
    return http.delete<{ deleted: boolean }>(
      `${ENDPOINTS.USERS.ADDRESSES}/${id}`,
      opts,
    );
  },

  /** Đặt địa chỉ mặc định */
  setDefaultAddress(id: string, opts?: HttpOptions): Promise<IUserAddress> {
    return http.patch<IUserAddress>(
      `${ENDPOINTS.USERS.ADDRESSES}/${id}/default`,
      undefined,
      opts,
    );
  },
};
