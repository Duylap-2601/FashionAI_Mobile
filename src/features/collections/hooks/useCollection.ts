import { useQuery } from '@tanstack/react-query';
import { getCollection } from '../api/collections.api';
import { collectionKeys } from '../api/collection.keys';

export function useCollection(slug?: string) {
  const normalizedSlug = slug?.trim() ?? '';

  return useQuery({
    queryKey: collectionKeys.detail(normalizedSlug),
    queryFn: ({ signal }) => getCollection(normalizedSlug, signal),
    enabled: normalizedSlug.length > 0,
  });
}

