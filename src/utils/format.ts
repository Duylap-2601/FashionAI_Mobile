/**
 * Formatting helpers for Vietnamese locale (kg, cm, VND)
 */

/** Giá VND dạng `1.290.000đ`, cùng cách viết với web (formatVnd). */
export function formatCurrency(amount?: number | string | null): string {
  const value = typeof amount === 'number' ? amount : Number(amount ?? NaN);
  if (!Number.isFinite(value)) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
}

export function formatWeight(kg?: number | null): string {
  if (kg === undefined || kg === null) return '—';
  return `${kg} kg`;
}

export function formatHeight(cm?: number | null): string {
  if (cm === undefined || cm === null) return '—';
  return `${cm} cm`;
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
