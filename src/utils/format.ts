/**
 * Formatting helpers for Vietnamese locale (kg, cm, VND)
 */

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return `${amount.toLocaleString('vi-VN')} ₫`;
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
