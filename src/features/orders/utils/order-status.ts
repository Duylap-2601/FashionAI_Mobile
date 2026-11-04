import type { StatusTone } from '../components/ToneLabel';

/**
 * Nhãn ngắn và tông màu của trạng thái đơn, cùng STATUS_CONFIG của web. `step` là vị trí
 * trên thanh tiến trình của danh sách đơn, -1 khi đơn đã dừng.
 */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; tone: StatusTone; step: number }> = {
  CREATED: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PENDING: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'attention', step: 0 },
  PAID: { label: 'Đã thanh toán', tone: 'active', step: 0 },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'active', step: 0 },
  MEASUREMENT_REVIEW: { label: 'Đang duyệt số đo', tone: 'active', step: 1 },
  MEASUREMENT_CONFIRMED: { label: 'Đã chốt số đo', tone: 'active', step: 1 },
  PROCESSING: { label: 'Đang chuẩn bị', tone: 'active', step: 2 },
  TAILORING: { label: 'Đang may', tone: 'active', step: 2 },
  QUALITY_CHECK: { label: 'Kiểm tra chất lượng', tone: 'active', step: 2 },
  READY_TO_SHIP: { label: 'Chờ giao', tone: 'active', step: 3 },
  SHIPPING: { label: 'Đang giao', tone: 'active', step: 3 },
  DELIVERED: { label: 'Đã giao', tone: 'done', step: 3 },
  COMPLETED: { label: 'Hoàn tất', tone: 'done', step: 4 },
  CANCELLED: { label: 'Đã hủy', tone: 'closed', step: -1 },
  EXPIRED: { label: 'Hết hạn thanh toán', tone: 'closed', step: -1 },
  RETURNED: { label: 'Đã hoàn trả', tone: 'closed', step: -1 },
  RETURN_REQUESTED: { label: 'Yêu cầu hoàn trả', tone: 'attention', step: -1 },
  RETURN_APPROVED: { label: 'Đã duyệt hoàn trả', tone: 'attention', step: -1 },
  RETURNING: { label: 'Đang hoàn trả', tone: 'attention', step: -1 },
  FAILED: { label: 'Thanh toán thất bại', tone: 'error', step: -1 },
};
