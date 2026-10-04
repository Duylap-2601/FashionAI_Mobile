import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import type {
  ApiPaginationMeta,
  ApiPaginatedResponse,
} from '@/types/api';
import { ApiError } from '@/types/api';
import { mapBackendProduct } from '@/features/products/mappers/product.mapper';
import type {
  BackendProduct,
  IProduct,
} from '@/features/products/types/product';
import { mapBackendCollection } from '../mappers/collection.mapper';
import type { BackendCollection, Collection } from '../types/collection';

function requireIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new TypeError(`${label} is required`);
  }

  return normalizedValue;
}

function parsePaginationMeta(value: unknown): ApiPaginationMeta {
  if (!value || typeof value !== 'object') {
    throw new ApiError(
      'Dữ liệu phân trang bộ sưu tập không hợp lệ.',
      500,
      'INVALID_COLLECTION_META',
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
      'Dữ liệu phân trang bộ sưu tập không hợp lệ.',
      500,
      'INVALID_COLLECTION_META',
    );
  }

  return {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  };
}

export async function getPublishedCollections(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<Collection[]>> {
  const result = await http.getPaged<BackendCollection[]>(
    ENDPOINTS.COLLECTIONS.PUBLISHED,
    {
      params: { page, limit },
      signal,
    },
  );

  return {
    data: result.data.map(mapBackendCollection),
    meta: parsePaginationMeta(result.meta),
  };
}

export async function getCollection(
  slug: string,
  signal?: AbortSignal,
): Promise<Collection> {
  const normalizedSlug = requireIdentifier(slug, 'Collection slug');
  const collection = await http.get<BackendCollection>(
    ENDPOINTS.COLLECTIONS.DETAIL(encodeURIComponent(normalizedSlug)),
    { signal },
  );

  return mapBackendCollection(collection);
}

export async function getCollectionProducts(
  collectionId: string,
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<IProduct[]>> {
  const normalizedCollectionId = requireIdentifier(
    collectionId,
    'Collection ID',
  );
  const result = await http.getPaged<BackendProduct[]>(
    ENDPOINTS.COLLECTIONS.PRODUCTS(normalizedCollectionId),
    {
      params: { page, limit },
      signal,
    },
  );

  return {
    data: result.data.map(mapBackendProduct),
    meta: parsePaginationMeta(result.meta),
  };
}
