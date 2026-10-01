import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import type {
  ApiPaginatedResponse,
  ApiPaginatedSuccessResponse,
  ApiSuccessResponse,
} from '@/types/api';
import { unwrap, unwrapPaginated } from '@/types/api';
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

export async function getPublishedCollections(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<Collection[]>> {
  const response = await api.get<
    ApiPaginatedSuccessResponse<BackendCollection[]>
  >(ENDPOINTS.COLLECTIONS.PUBLISHED, {
    params: { page, limit },
    signal,
  });
  const result = unwrapPaginated<BackendCollection[]>(response.data);

  return {
    data: result.data.map(mapBackendCollection),
    meta: result.meta,
  };
}

export async function getCollection(
  slug: string,
  signal?: AbortSignal,
): Promise<Collection> {
  const normalizedSlug = requireIdentifier(slug, 'Collection slug');
  const response = await api.get<ApiSuccessResponse<BackendCollection>>(
    ENDPOINTS.COLLECTIONS.DETAIL(encodeURIComponent(normalizedSlug)),
    { signal },
  );

  return mapBackendCollection(unwrap<BackendCollection>(response.data));
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
  const response = await api.get<
    ApiPaginatedSuccessResponse<BackendProduct[]>
  >(ENDPOINTS.COLLECTIONS.PRODUCTS(normalizedCollectionId), {
    params: { page, limit },
    signal,
  });
  const result = unwrapPaginated<BackendProduct[]>(response.data);

  return {
    data: result.data.map(mapBackendProduct),
    meta: result.meta,
  };
}

