import { mapBackendProduct } from '@/features/products/mappers/product.mapper';
import type { BackendRackItem, IRackItem } from '../types/rack';

export function mapBackendRackItem(item: BackendRackItem): IRackItem {
  return {
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    createdAt: item.createdAt,
    product: mapBackendProduct(item.product),
  };
}
