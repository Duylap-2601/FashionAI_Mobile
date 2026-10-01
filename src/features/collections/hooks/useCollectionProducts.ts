import { useInfiniteQuery } from '@tanstack/react-query';
import { getCollectionProducts } from '../api/collections.api';
import { collectionKeys } from '../api/collection.keys';

const COLLECTION_PRODUCTS_LIMIT = 20;

export function useCollectionProducts(collectionId?: string) {
  const normalizedCollectionId = collectionId?.trim() ?? '';

  return useInfiniteQuery({
    queryKey: collectionKeys.productList(
      normalizedCollectionId,
      COLLECTION_PRODUCTS_LIMIT,
    ),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getCollectionProducts(
        normalizedCollectionId,
        pageParam,
        COLLECTION_PRODUCTS_LIMIT,
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: normalizedCollectionId.length > 0,
  });
}

