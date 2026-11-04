// Measurement fields shown on the measurement form. The size guide policy page
// reads the same list so the guide never contradicts what the form accepts.

export interface MeasurementFieldDef {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  desc: string;
  requiredFor?: string;
}

export const OVERVIEW_FIELD_DEFS: MeasurementFieldDef[] = [
  { id: 'height', label: 'Chiều cao', unit: 'cm', min: 100, max: 250, desc: 'Từ gót chân đến đỉnh đầu', requiredFor: 'Bắt buộc tất cả' },
  { id: 'weight', label: 'Cân nặng', unit: 'kg', min: 30, max: 250, desc: 'Cân nặng cơ thể' },
];

export const UPPER_FIELD_DEFS: MeasurementFieldDef[] = [
  { id: 'shoulder', label: 'Rộng vai', unit: 'cm', min: 30, max: 80, desc: 'Từ đầu vai trái đến vai phải', requiredFor: 'Áo & Đồ liền' },
  { id: 'chest', label: 'Vòng ngực', unit: 'cm', min: 50, max: 200, desc: 'Vòng lớn nhất của ngực', requiredFor: 'Áo & Đồ liền' },
  { id: 'shirtLength', label: 'Dài thân áo', unit: 'cm', min: 50, max: 85, desc: 'Từ điểm vai đến lai áo', requiredFor: 'Áo & Đồ liền' },
  { id: 'sleeveLength', label: 'Dài tay áo', unit: 'cm', min: 45, max: 80, desc: 'Từ vai đến cổ tay', requiredFor: 'Áo' },
  { id: 'neck', label: 'Vòng cổ', unit: 'cm', min: 28, max: 55, desc: 'Vòng quanh cổ, cách cổ áo 2cm' },
  { id: 'underbust', label: 'Vòng ngực dưới', unit: 'cm', min: 55, max: 130, desc: 'Ngay dưới ngực (dành cho nữ)' },
  { id: 'wrist', label: 'Vòng cổ tay', unit: 'cm', min: 12, max: 25, desc: 'Vòng quanh cổ tay' },
];

export const LOWER_FIELD_DEFS: MeasurementFieldDef[] = [
  { id: 'waist', label: 'Vòng eo', unit: 'cm', min: 50, max: 200, desc: 'Phần thắt nhỏ nhất của eo', requiredFor: 'Quần & Váy' },
  { id: 'hip', label: 'Vòng hông', unit: 'cm', min: 50, max: 200, desc: 'Vòng lớn nhất của mông', requiredFor: 'Quần & Váy' },
  { id: 'trouserLength', label: 'Dài quần', unit: 'cm', min: 80, max: 120, desc: 'Từ cạp xuống gấu quần', requiredFor: 'Quần & Váy' },
  { id: 'thigh', label: 'Vòng đùi', unit: 'cm', min: 35, max: 90, desc: 'Vòng lớn nhất của đùi', requiredFor: 'Quần & Váy' },
  { id: 'inseam', label: 'Dài đũng quần', unit: 'cm', min: 55, max: 95, desc: 'Từ đũng quần đến mắt cá chân' },
  { id: 'knee', label: 'Vòng đầu gối', unit: 'cm', min: 25, max: 55, desc: 'Vòng quanh đầu gối' },
  { id: 'calf', label: 'Vòng bắp chân', unit: 'cm', min: 25, max: 55, desc: 'Vòng lớn nhất của bắp chân' },
];

export const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

/** Body measurement ranges (cm) behind each reference shirt size. */
export const SHIRT_SIZE_GUIDE: Record<string, { chest: string; waist: string; hip: string }> = {
  XS: { chest: '80–84', waist: '63–67', hip: '86–90' },
  S: { chest: '84–88', waist: '67–71', hip: '90–94' },
  M: { chest: '88–92', waist: '71–75', hip: '94–98' },
  L: { chest: '92–96', waist: '75–79', hip: '98–102' },
  XL: { chest: '96–100', waist: '79–83', hip: '102–106' },
  XXL: { chest: '100–106', waist: '83–89', hip: '106–112' },
  '3XL': { chest: '106–112', waist: '89–95', hip: '112–118' },
};
