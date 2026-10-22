import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export interface IAddressCatalogLocation {
  id: string;
  name: string;
  aliases: string[];
  catalogRevision: string;
}

export interface IShippingCapabilities {
  capabilityVersion: string;
  policyVersion: string;
  serverTime: string;
  catalogRevision: string | null;
  catalogEnabled: boolean;
  newAddressWriteEnabled: boolean;
  newAddressCheckoutEnabled: boolean;
  upgradeRequired: boolean;
}

export const shippingApi = {
  getCapabilities(opts?: HttpOptions): Promise<IShippingCapabilities> {
    return http.get<IShippingCapabilities>(ENDPOINTS.SHIPPING.CAPABILITIES, opts);
  },

  getAddressCatalogProvinces(
    revision: string,
    opts?: HttpOptions,
  ): Promise<IAddressCatalogLocation[]> {
    return http.get<IAddressCatalogLocation[]>(
      ENDPOINTS.SHIPPING.ADDRESS_CATALOG_PROVINCES,
      { ...opts, params: { revision } },
    );
  },

  getAddressCatalogWards(
    provinceId: string,
    revision: string,
    opts?: HttpOptions,
  ): Promise<IAddressCatalogLocation[]> {
    return http.get<IAddressCatalogLocation[]>(
      ENDPOINTS.SHIPPING.ADDRESS_CATALOG_WARDS,
      { ...opts, params: { provinceId, revision } },
    );
  },
};
