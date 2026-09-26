import { create } from 'zustand';
import {
  GarmentCategory,
  GarmentType,
  IProductFilter,
  ProductSort,
  ProductStatus,
} from '../types/product';

interface FilterState {
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
  page: number;
  limit: number;
  setFilters: (filters: Partial<IProductFilter>) => void;
  setPagination: (page: number, limit?: number) => void;
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
  page: 1,
  limit: 20,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setFilters: (filters) => set({ ...filters, page: 1 }),
  setPagination: (page, limit) => set({ page, ...(limit === undefined ? {} : { limit }) }),
  resetFilters: () => set(initialState),
}));

export default useFilterStore;
