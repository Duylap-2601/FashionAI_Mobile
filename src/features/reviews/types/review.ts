export interface IReview {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  images?: string[] | null;
  user?: IReviewUser;
  replies?: IReviewReply[];
  createdAt: string;
  updatedAt: string;
}

export interface IReviewUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role?: 'USER' | 'ADMIN';
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

export interface IReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}
