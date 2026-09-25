export enum ETryOnStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ITryOnGenerateDto {
  modelImageUrl: string;
  garmentImageUrl: string;
  category?: 'UPPER_BODY' | 'LOWER_BODY' | 'DRESSES';
  prompt?: string;
}

export interface ITryOnResult {
  id: string | number;
  status: ETryOnStatus;
  resultImageUrl?: string;
  modelImageUrl: string;
  garmentImageUrl: string;
  garmentName?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ILiveTryOnSession {
  id: string | number;
  productId: string | number;
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
}
