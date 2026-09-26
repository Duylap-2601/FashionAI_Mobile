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
