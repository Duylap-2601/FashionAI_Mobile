import { create } from 'zustand';
import {
  GarmentCategory,
  GarmentType,
  ProductSort,
  ProductStatus,
} from '../types/product';

interface FilterValues {
  search: string;
  category: GarmentCategory | null;
  garmentType: GarmentType | null;
  color: string | null;
  subCategory: string | null;
  material: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  status: ProductStatus | null;
  sort: ProductSort;
}

interface FilterState extends FilterValues {
  setFilters: (filters: Partial<FilterValues>) => void;
  resetFilters: () => void;
}

const initialState = {
  search: '',
  category: null,
  garmentType: null,
  color: null,
  subCategory: null,
  material: null,
  minPrice: null,
  maxPrice: null,
  status: 'ACTIVE' as ProductStatus | null,
  sort: 'latest' as ProductSort,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setFilters: (filters) => set(filters),
  resetFilters: () => set(initialState),
}));

export default useFilterStore;
