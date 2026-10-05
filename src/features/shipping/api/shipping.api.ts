import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export interface Location {
  id: number;
  name: string;
}

export interface WardLocation {
  code: string;
  name: string;
}

export const shippingApi = {
  getProvinces: (opts?: HttpOptions) => {
    return http.get<Location[]>(ENDPOINTS.SHIPPING.PROVINCES, opts);
  },
  getDistricts: (provinceId: number, opts?: HttpOptions) => {
    return http.get<Location[]>(ENDPOINTS.SHIPPING.DISTRICTS, { ...opts, params: { provinceId: provinceId } });
  },
  getWards: (districtId: number, opts?: HttpOptions) => {
    return http.get<WardLocation[]>(ENDPOINTS.SHIPPING.WARDS, { ...opts, params: { districtId: districtId } });
  },
  calculateFee: (payload: any, opts?: HttpOptions) => {
    return http.post<{ fee: number }>(ENDPOINTS.SHIPPING.CALCULATE_FEE, payload, opts);
  },
};
