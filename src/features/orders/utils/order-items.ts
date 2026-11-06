export interface OrderItemLike {
  productNameSnapshot?: string | null;
  productName?: string | null;
  productImageSnapshot?: string | null;
  imageUrl?: string | null;
  product?: { name?: string | null; images?: unknown } | null;
}

const FALLBACK_ITEM_IMAGE =
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop&auto=format';

export function getOrderItemName(item: OrderItemLike | null | undefined): string {
  return item?.productNameSnapshot || item?.productName || item?.product?.name || 'Sản phẩm may đo';
}

export function getOrderItemImage(item: OrderItemLike | null | undefined): string {
  if (item?.productImageSnapshot) return item.productImageSnapshot;
  if (item?.imageUrl) return item.imageUrl;
  const images = item?.product?.images;
  if (!images) return FALLBACK_ITEM_IMAGE;
  try {
    const parsed: unknown = typeof images === 'string' ? JSON.parse(images) : images;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first: unknown = parsed[0];
      if (typeof first === 'string' && first) return first;
      if (first && typeof first === 'object') {
        const record = first as Record<string, unknown>;
        const url = record.url ?? record.uri ?? record.imageUrl;
        if (typeof url === 'string' && url) return url;
      }
    }
  } catch {
    return FALLBACK_ITEM_IMAGE;
  }
  return FALLBACK_ITEM_IMAGE;
}
