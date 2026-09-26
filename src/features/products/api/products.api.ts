import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  ApiPaginatedResponse,
  ApiPaginatedSuccessResponse,
  ApiSuccessResponse,
  unwrap,
  unwrapPaginated,
} from '@/types/api';
import { mapBackendProduct } from '../mappers/product.mapper';
import {
  BackendProduct,
  IProduct,
  IProductFilter,
  IProductListFilters,
} from '../types/product';

export function normalizeProductFilters(
  filters: IProductListFilters = {},
): IProductListFilters {
  const search = filters.search?.trim();
  const color = filters.color?.trim();
  const subCategory = filters.subCategory?.trim();
  const material = filters.material?.trim();

  return {
    ...(search ? { search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.garmentType ? { garmentType: filters.garmentType } : {}),
    ...(color ? { color } : {}),
    ...(subCategory ? { subCategory } : {}),
    ...(material ? { material } : {}),
    ...(filters.minPrice !== undefined ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice !== undefined ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
  };
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: IProductListFilters = {}) =>
    [...productKeys.lists(), normalizeProductFilters(filters)] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (productId: string) => [...productKeys.details(), productId] as const,
};

export async function getProducts(
  filters: IProductFilter = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<IProduct[]>> {
  const { page, ...listFilters } = filters;
  const params = {
    ...normalizeProductFilters(listFilters),
    ...(page !== undefined ? { page } : {}),
  };
  const response = await api.get<ApiPaginatedSuccessResponse<BackendProduct[]>>(
    ENDPOINTS.PRODUCTS.LIST,
    { params, signal },
  );
  const result = unwrapPaginated<BackendProduct[]>(response.data);

  return {
    data: result.data.map(mapBackendProduct),
    meta: result.meta,
  };
}

export async function getProduct(
  productId: string,
  signal?: AbortSignal,
): Promise<IProduct> {
  const normalizedProductId = productId.trim();
  if (!normalizedProductId) {
    throw new TypeError('Product ID is required');
  }

  const response = await api.get<ApiSuccessResponse<BackendProduct>>(
    ENDPOINTS.PRODUCTS.DETAIL(normalizedProductId),
    { signal },
  );

  return mapBackendProduct(unwrap<BackendProduct>(response.data));
}
