export type GarmentCategory = 'UPPER' | 'LOWER' | 'FULL_BODY';
export type GarmentType = 'SHIRT' | 'VEST' | 'JACKET' | 'PANTS' | 'SKIRT' | 'DRESS' | 'JUMPSUIT';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ProductSort = 'latest' | 'price_asc' | 'price_desc';

export interface IProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isMain: boolean;
  createdAt: string;
}

export interface IProductColor {
  name: string;
  hex: string;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string | null;
  category: GarmentCategory;
  garmentType?: GarmentType | null;
  color?: string | null;
  colors?: IProductColor[] | null;
  material?: string | null;
  price: number;
  originalPrice?: number | null;
  stock: number;
  brand: string | null;
  garmentUrl: string;
  status: ProductStatus;
  avgRating: number;
  reviewCount: number;
  images: IProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface IProductFilter {
  search?: string;
  category?: GarmentCategory;
  garmentType?: GarmentType;
  color?: string;
  subCategory?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface ICollection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImages: string[];
  isPublished: boolean;
  displayOrder: number;
  _count?: {
    products: number;
  };
  createdAt: string;
  updatedAt: string;
}

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
