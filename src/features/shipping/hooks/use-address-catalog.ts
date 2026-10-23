import { useQuery } from '@tanstack/react-query';
import {
  IAddressCatalogLocation,
  IShippingCapabilities,
  shippingApi,
} from '../api/shipping.api';

const CATALOG_STALE_TIME = 5 * 60 * 1000;

export const addressCatalogKeys = {
  capabilities: ['shipping', 'capabilities'] as const,
  provinces: (revision: string) =>
    ['shipping', 'address-catalog', 'provinces', revision] as const,
  wards: (provinceId: string, revision: string) =>
    ['shipping', 'address-catalog', 'wards', provinceId, revision] as const,
};

export function useShippingCapabilities() {
  return useQuery<IShippingCapabilities>({
    queryKey: addressCatalogKeys.capabilities,
    queryFn: ({ signal }) => shippingApi.getCapabilities({ signal }),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useAddressCatalogProvinces(revision?: string | null) {
  return useQuery<IAddressCatalogLocation[]>({
    queryKey: revision
      ? addressCatalogKeys.provinces(revision)
      : (['shipping', 'address-catalog', 'provinces', 'disabled'] as const),
    queryFn: ({ signal }) =>
      shippingApi.getAddressCatalogProvinces(revision as string, { signal }),
    enabled: !!revision,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useAddressCatalogWards(
  provinceId?: string | null,
  revision?: string | null,
) {
  return useQuery<IAddressCatalogLocation[]>({
    queryKey:
      provinceId && revision
        ? addressCatalogKeys.wards(provinceId, revision)
        : (['shipping', 'address-catalog', 'wards', 'disabled'] as const),
    queryFn: ({ signal }) =>
      shippingApi.getAddressCatalogWards(provinceId as string, revision as string, {
        signal,
      }),
    enabled: !!provinceId && !!revision,
    staleTime: CATALOG_STALE_TIME,
  });
}
