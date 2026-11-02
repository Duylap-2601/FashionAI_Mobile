import type { GarmentType, ProductSort } from '../types/product';

export interface GarmentTypeTab {
  key: string;
  label: string;
  garmentType?: GarmentType;
}

export const GARMENT_TYPE_TABS: readonly GarmentTypeTab[] = [
  { key: 'ALL', label: 'Tất cả', garmentType: undefined },
  { key: 'SHIRT', label: 'Áo sơ mi', garmentType: 'SHIRT' },
  { key: 'VEST', label: 'Áo vest', garmentType: 'VEST' },
  { key: 'JACKET', label: 'Áo khoác / Blazer', garmentType: 'JACKET' },
  { key: 'PANTS', label: 'Quần tây', garmentType: 'PANTS' },
  { key: 'SKIRT', label: 'Chân váy', garmentType: 'SKIRT' },
  { key: 'DRESS', label: 'Đầm', garmentType: 'DRESS' },
  { key: 'JUMPSUIT', label: 'Jumpsuit', garmentType: 'JUMPSUIT' },
] as const;

export const SUB_CATEGORIES: readonly string[] = [
  'Áo sơ mi',
  'Blazer',
  'Quần tây',
  'Váy công sở',
  'Suit 2 mảnh',
  'Suit 3 mảnh',
] as const;

export interface ProductColorSwatch {
  name: string;
  color: string;
  light?: boolean;
}

export const AVAILABLE_COLORS: readonly ProductColorSwatch[] = [
  { name: 'Đen', color: '#111111' },
  { name: 'Trắng', color: '#FFFFFF', light: true },
  { name: 'Xám', color: '#888888' },
  { name: 'Navy', color: '#2B3450' },
  { name: 'Kem', color: '#F9F7F5', light: true },
  { name: 'Be', color: '#E8E2D2', light: true },
] as const;

export const PRICE_FILTER = {
  min: 200000,
  max: 10000000,
  step: 100000,
} as const;

export interface ProductSortOption {
  label: string;
  value: ProductSort;
}

export const PRODUCT_SORT_OPTIONS: readonly ProductSortOption[] = [
  { label: 'Mới nhất', value: 'latest' },
  { label: 'Giá thấp đến cao', value: 'price_asc' },
  { label: 'Giá cao đến thấp', value: 'price_desc' },
] as const;
