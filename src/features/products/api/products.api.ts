import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  ApiError,
  ApiPaginatedResponse,
  ApiPaginationMeta,
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

function parsePaginationMeta(value: unknown): ApiPaginationMeta {
  if (!value || typeof value !== 'object') {
    throw new ApiError(
      'Dữ liệu phân trang sản phẩm không hợp lệ.',
      500,
      'INVALID_PRODUCT_META',
    );
  }

  const meta = value as Record<string, unknown>;
  if (
    typeof meta.total !== 'number' ||
    typeof meta.page !== 'number' ||
    typeof meta.limit !== 'number' ||
    typeof meta.totalPages !== 'number'
  ) {
    throw new ApiError(
      'Dữ liệu phân trang sản phẩm không hợp lệ.',
      500,
      'INVALID_PRODUCT_META',
    );
  }

  return {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  };
}

export async function getProducts(
  filters: IProductFilter = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<IProduct[]>> {
  const { page, ...listFilters } = filters;
  const params = {
    ...normalizeProductFilters(listFilters),
    ...(page !== undefined ? { page } : {}),
  };
  const result = await http.getPaged<BackendProduct[]>(
    ENDPOINTS.PRODUCTS.LIST,
    { params, signal },
  );

  return {
    data: result.data.map(mapBackendProduct),
    meta: parsePaginationMeta(result.meta),
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

  const product = await http.get<BackendProduct>(
    ENDPOINTS.PRODUCTS.DETAIL(normalizedProductId),
    { signal },
  );

  return mapBackendProduct(product);
}
