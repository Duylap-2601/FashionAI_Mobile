import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getProducts,
  normalizeProductFilters,
  productKeys,
} from '../api/products.api';
import { IProductListFilters } from '../types/product';

export function useProducts(filters: IProductListFilters = {}) {
  const normalizedFilters = normalizeProductFilters(filters);

  return useInfiniteQuery({
    queryKey: productKeys.list(normalizedFilters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getProducts({ ...normalizedFilters, page: pageParam }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });
}
