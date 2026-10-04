import { useInfiniteQuery } from '@tanstack/react-query';
import { getPublishedCollections } from '../api/collections.api';
import { collectionKeys } from '../api/collection.keys';

const PUBLISHED_COLLECTION_LIMIT = 20;

export function usePublishedCollections() {
  return useInfiniteQuery({
    queryKey: collectionKeys.publishedList(PUBLISHED_COLLECTION_LIMIT),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getPublishedCollections(
        pageParam,
        PUBLISHED_COLLECTION_LIMIT,
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });
}

