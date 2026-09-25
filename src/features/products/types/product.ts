export interface IProductVariant {
  id: string | number;
  productId: string | number;
  sku?: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  imageUrl?: string;
}

export interface IProduct {
  id: string | number;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  inStock?: boolean;
  variants?: IProductVariant[];
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export interface ICollection {
  id: string | number;
  title: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  productCount?: number;
  isPublished?: boolean;
  products?: IProduct[];
}

export interface IReview {
  id: string | number;
  productId: string | number;
  userId: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  content: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface IReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}
