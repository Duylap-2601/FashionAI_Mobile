import type { GarmentCategory } from '@/features/products/types/product';

export interface ITryOnGarmentSelection {
  productId: string;
  garmentCategory: GarmentCategory;
}

export type TryOnGarmentSelectionList =
  | readonly [ITryOnGarmentSelection]
  | readonly [ITryOnGarmentSelection, ITryOnGarmentSelection];

/**
 * Rack/composer handoff only. Dev 1 Try-On remains responsible for uploads,
 * quota handling, submission, results, and history.
 */
export interface ITryOnRouteParams {
  garments: TryOnGarmentSelectionList;
}
