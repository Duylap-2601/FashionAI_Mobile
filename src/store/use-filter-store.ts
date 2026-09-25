import { create } from 'zustand';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

interface FilterState {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: SortOption;
  searchQuery: string;
  setCategory: (category: string | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const initialState = {
  category: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest' as SortOption,
  searchQuery: '',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setCategory: (category) => set({ category }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () => set(initialState),
}));

export default useFilterStore;
