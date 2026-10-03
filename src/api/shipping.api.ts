import { api } from './client';
import { ENDPOINTS } from '@/constants/endpoints';

export interface Location {
  id: number;
  name: string;
}

export interface WardLocation {
  code: string;
  name: string;
}

export interface CalculateFeePayload {
  provinceId: number;
  districtId: number;
  wardCode: string;
  weight: number;
}

export interface CalculateFeeResponse {
  fee: number;
}

export const shippingApi = {
  getProvinces: async () => {
    const response = await api.get<{ data: Location[] }>(ENDPOINTS.SHIPPING.PROVINCES);
    return response.data.data;
  },
  getDistricts: async (provinceId: number) => {
    const response = await api.get<{ data: Location[] }>(ENDPOINTS.SHIPPING.DISTRICTS, {
      params: { provinceId }
    });
    return response.data.data;
  },
  getWards: async (districtId: number) => {
    const response = await api.get<{ data: WardLocation[] }>(ENDPOINTS.SHIPPING.WARDS, {
      params: { districtId }
    });
    return response.data.data;
  },
  calculateFee: async (payload: CalculateFeePayload) => {
    const response = await api.post<{ data: CalculateFeeResponse }>(ENDPOINTS.SHIPPING.CALCULATE_FEE, payload);
    return response.data.data;
  }
};
