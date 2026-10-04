import type { BackendProduct, IProduct } from '@/features/products/types/product';

export interface BackendRackItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: BackendProduct;
}

export interface IRackItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: IProduct;
}

export interface IRemoveRackItemResult {
  id: string;
}

export interface IClearRackResult {
  deleted: number;
}
