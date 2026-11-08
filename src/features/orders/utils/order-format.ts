import { formatCurrency } from '@/utils/format';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  ZALOPAY: 'ZaloPay',
  BANK_TRANSFER: 'Chuyển khoản',
  BANK: 'Chuyển khoản',
  SEPAY: 'Chuyển khoản',
  MANUAL_ADMIN: 'Chuyển khoản (shop xác nhận)',
  MOMO: 'MoMo',
  WALLET: 'Ví FashionAI',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  EXPIRED: 'Hết hạn thanh toán',
  REFUND_REQUIRED: 'Cần hoàn tiền',
  REFUND_PENDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn một phần',
  COD_COLLECTED: 'Đã thu khi giao',
};

interface OrderCodeSource {
  orderCode?: unknown;
  orderNumber?: unknown;
  id?: unknown;
}

export function getOrderCode(order?: OrderCodeSource | null): string {
  const code = order?.orderCode ?? order?.orderNumber ?? order?.id;
  return `ORD-${code ?? ''}`;
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface PaymentLike {
  status?: string | null;
  provider?: string | null;
}

interface PaymentOrderLike {
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  payments?: PaymentLike[] | null;
}

export function getPaymentMethodLabel(order?: PaymentOrderLike | null): string {
  const paidPayment = Array.isArray(order?.payments)
    ? order?.payments.find((payment) => payment?.status === 'PAID' || payment?.status === 'COMPLETED')
    : undefined;

  const raw = paidPayment?.provider ?? order?.paymentProvider ?? order?.paymentMethod;
  if (!raw) return 'Chưa xác định';

  return PAYMENT_METHOD_LABELS[String(raw).toUpperCase()] ?? String(raw);
}

interface OrderTotalLike {
  totalVnd?: unknown;
  totalAmount?: unknown;
  amount?: unknown;
  total?: unknown;
}

export function getOrderTotal(order?: OrderTotalLike | null): number {
  return toNumber(order?.totalVnd ?? order?.totalAmount ?? order?.amount ?? order?.total);
}

export function formatOrderCurrency(value: unknown): string {
  return formatCurrency(value as number | string | null | undefined);
}
