export type TryOnCategory = 'UPPER' | 'LOWER' | 'FULL_BODY';

export interface TryOnGarmentInput {
  category: TryOnCategory;
  productId?: string;
  garmentImage?: { uri: string; name: string; type: string };
}

export interface TryOnGenerateRequest {
  humanImage: { uri: string; name: string; type: string };
  garments?: TryOnGarmentInput[];
  // Legacy single-garment fields, kept for parity with the BE's backward-compat path.
  productId?: string;
  garmentCategory?: TryOnCategory;
  garmentImage?: { uri: string; name: string; type: string };
}

export interface TryOnResultGarment {
  productId?: string;
  category: TryOnCategory;
  imageUrl?: string;
}

export interface TryOnResult {
  id: string;
  resultUrl: string;
  humanImageUrl?: string;
  category: TryOnCategory;
  garments: TryOnResultGarment[];
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  isCacheHit?: boolean;
  createdAt: string;
}
