import type { ApiPaginationMeta } from '@/types/api';

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface IReviewUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role?: 'USER' | 'ADMIN';
}

export interface IReviewProduct {
  id: string;
  name: string;
  garmentUrl: string | null;
}

export interface IReviewReply {
  id: string;
  reviewId: string;
  userId: string;
  content: string;
  user?: IReviewUser;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: ReviewRating;
  comment?: string | null;
  images?: string[] | null;
  user?: IReviewUser;
  product?: IReviewProduct;
  replies?: IReviewReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface IReviewStats {
  avgRating: number;
  reviewCount: number;
  distribution: ReviewDistribution;
}

export interface ProductReviewsMeta extends ApiPaginationMeta, IReviewStats {}

export interface ReviewPage<TMeta extends ApiPaginationMeta = ApiPaginationMeta> {
  data: IReview[];
  meta: TMeta;
}

export interface ReviewListFilters {
  limit?: number;
  rating?: ReviewRating;
}

export interface ReviewPageParams extends ReviewListFilters {
  page?: number;
}

export interface CreateReviewInput {
  rating: ReviewRating;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewInput {
  comment?: string;
  images?: string[];
}
