export interface BackendCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImages: string[];
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImages: string[];
  isPublished: boolean;
  displayOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}
