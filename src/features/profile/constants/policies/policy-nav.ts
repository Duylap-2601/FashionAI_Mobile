import type { PolicyNavItem, PolicyType } from '../../types/policy';

// Order and labels follow FE `POLICY_NAV_ITEMS`.
export const POLICY_NAV_ITEMS: readonly PolicyNavItem[] = [
  { type: 'return', label: 'Chính sách đổi trả', description: 'Hoàn tiền trong 7 ngày kể từ khi đơn hoàn tất' },
  { type: 'warranty', label: 'Chính sách bảo hành', description: 'Bảo hành trọn đời, miễn phí đường may và phụ kiện' },
  { type: 'size-guide', label: 'Hướng dẫn chọn size', description: 'Cách tự đo và bảng size tham khảo' },
  { type: 'privacy', label: 'Chính sách bảo mật', description: 'Dữ liệu thu thập, quyền thiết bị và quyền của bạn' },
  { type: 'terms', label: 'Điều khoản dịch vụ', description: 'Tài khoản, đặt hàng, tính năng AI và gói hội viên' },
];

/** Shown when the `Policy` route is opened without a type. */
export const DEFAULT_POLICY_TYPE: PolicyType = 'privacy';

// Copied from FE `POLICY_CONTACT` (policy-nav.ts); the policy texts quote it.
export const POLICY_CONTACT = {
  hotline: '1900 6868',
  hotlineHours: '8:30 - 22:00, tất cả các ngày trong tuần',
  email: 'contact@fashionai.vn',
  address: 'Số 126 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
} as const;

export function isPolicyType(value: unknown): value is PolicyType {
  return POLICY_NAV_ITEMS.some((item) => item.type === value);
}
