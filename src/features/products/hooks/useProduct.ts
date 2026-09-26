import { useQuery } from '@tanstack/react-query';
import { getProduct, productKeys } from '../api/products.api';

export function useProduct(productId?: string) {
  const normalizedProductId = productId?.trim() ?? '';

  return useQuery({
    queryKey: productKeys.detail(normalizedProductId),
    queryFn: ({ signal }) => getProduct(normalizedProductId, signal),
    enabled: normalizedProductId.length > 0,
  });
}
