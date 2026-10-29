export type GarmentCategory = 'UPPER' | 'LOWER' | 'FULL_BODY';
export type GarmentType = 'SHIRT' | 'VEST' | 'JACKET' | 'PANTS' | 'SKIRT' | 'DRESS' | 'JUMPSUIT';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ProductSort = 'latest' | 'price_asc' | 'price_desc';

export interface IProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  colorName: string | null;
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
  originalPrice: number | null;
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

export type IProductListFilters = Omit<IProductFilter, 'page'>;

export interface BackendProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  colorName: string | null;
  isMain: boolean;
  createdAt: string;
}

export interface BackendProduct {
  id: string;
  name: string;
  description: string | null;
  category: GarmentCategory;
  garmentType: GarmentType | null;
  color: string | null;
  colors: unknown;
  material: string | null;
  price: string | number;
  originalPrice: string | number | null;
  stock: number;
  brand: string | null;
  garmentUrl: string;
  status: ProductStatus;
  avgRating: string | number | null;
  reviewCount: number;
  images: BackendProductImage[];
  createdAt: string;
  updatedAt: string;
}
