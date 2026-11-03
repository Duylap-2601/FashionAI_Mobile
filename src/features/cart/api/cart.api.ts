import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';

export type CartProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type CartComboType = 'combo' | 'blazer' | 'retail';

export interface ServerCartProduct {
  id: string;
  name: string;
  price: number;
  sale: { percent: number; salePrice: number } | null;
  status: CartProductStatus;
  category: string;
  garmentType: string | null;
  colors: unknown;
  imageUrl: string;
}

export interface ServerCartItem {
  id: string;
  productId: string;
  color: string | null;
  comboType: CartComboType | null;
  quantity: number;
  available: boolean;
  product: ServerCartProduct;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCart {
  items: ServerCartItem[];
  totalItems: number;
}

export type CartMergeSkipReason = 'PRODUCT_UNAVAILABLE' | 'INVALID_COLOR' | 'CART_LINE_LIMIT';

export interface CartMergeSkippedLine {
  productId: string;
  color: string | null;
  comboType: CartComboType | null;
  reason: CartMergeSkipReason;
}

export interface MergeCartResponse extends ServerCart {
  skipped: CartMergeSkippedLine[];
}

export interface CartLineInput {
  productId: string;
  quantity: number;
  color?: string;
  comboType?: CartComboType;
}

export interface MergeCartBody {
  items: CartLineInput[];
}

export interface UpdateCartItemBody {
  quantity: number;
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

export const cartApi = {
  getCart: (opts?: HttpOptions): Promise<ServerCart> => {
    return http.get<ServerCart>(ENDPOINTS.CART.BASE, opts);
  },

  addItem: (body: CartLineInput, opts?: HttpOptions): Promise<ServerCart> => {
    return http.post<ServerCart>(ENDPOINTS.CART.ITEMS, body, opts);
  },

  updateItem: (id: string, quantity: number, opts?: HttpOptions): Promise<ServerCart> => {
    const body: UpdateCartItemBody = { quantity };
    return http.patch<ServerCart>(ENDPOINTS.CART.ITEM(id), body, opts);
  },

  removeItem: (id: string, opts?: HttpOptions): Promise<ServerCart> => {
    return http.delete<ServerCart>(ENDPOINTS.CART.ITEM(id), undefined, opts);
  },

  clearCart: (opts?: HttpOptions): Promise<ServerCart> => {
    return http.delete<ServerCart>(ENDPOINTS.CART.BASE, undefined, opts);
  },

  mergeCart: (lines: CartLineInput[], opts?: HttpOptions): Promise<MergeCartResponse> => {
    const body: MergeCartBody = { items: lines };
    return http.post<MergeCartResponse>(ENDPOINTS.CART.MERGE, body, opts);
  },
};
