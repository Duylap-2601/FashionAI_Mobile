import type { StylistGenderPreference } from '../types/stylist';

export const STYLIST_OCCASIONS = [
  'Đi làm',
  'Phỏng vấn',
  'Họp quan trọng',
  'Sự kiện',
  'Dạ tiệc',
];

export const STYLIST_STYLES = [
  'Lịch lãm',
  'Tối giản',
  'Năng động',
  'Thanh lịch',
  'Smart casual',
];

export const STYLIST_BUDGETS = [
  'Dưới 500k',
  '500k - 1 triệu',
  '1 - 2 triệu',
  'Trên 2 triệu',
];

export const STYLIST_GENDERS: {
  label: string;
  value: StylistGenderPreference;
}[] = [
  { label: 'Nữ', value: 'female' },
  { label: 'Nam', value: 'male' },
  { label: 'Khác', value: 'other' },
];

export const STYLIST_IMAGE_CONSENT_TEXT =
  'Đây là ảnh của tôi (hoặc tôi có quyền dùng ảnh) và tôi đồng ý cho FashionAI dùng ảnh chỉ để phân tích. Ảnh không được lưu lại.';
