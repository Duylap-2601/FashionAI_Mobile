import type { StatusTone } from '../components/ToneLabel';
import type {
  IOrderHistoryEvent,
  IOrderRefund,
  OrderIssueReason,
  OrderIssueStatus,
  OrderRefundKind,
  OrderRefundStatus,
  RefundEvidence,
} from '../types/order';

/** BE chỉ nhận báo lỗi trong 7 ngày kể từ khi đơn hoàn tất (order-issues.service.ts). */
export const ISSUE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Hàng đang trên đường về shop: khách còn được báo thêm lỗi cho món khác. */
export const RETURN_FLOW_STATUSES: readonly string[] = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNING'];
/** Mọi trạng thái của luồng đổi trả, kể cả đã hoàn trả xong. */
export const RETURN_HISTORY_STATUSES: readonly string[] = [...RETURN_FLOW_STATUSES, 'RETURNED'];

/** Nhãn trạng thái đơn trong luồng hoàn trả (cùng nhãn với chi tiết đơn). */
export const RETURN_STATUS_LABELS: Record<string, { label: string; tone: StatusTone }> = {
  RETURN_REQUESTED: { label: 'Yêu cầu hoàn trả', tone: 'attention' },
  RETURN_APPROVED: { label: 'Đã duyệt hoàn trả', tone: 'attention' },
  RETURNING: { label: 'Đang hoàn trả', tone: 'attention' },
  RETURNED: { label: 'Đã hoàn trả', tone: 'closed' },
};

export const RETURN_FLOW_TITLES: Record<string, string> = {
  RETURN_REQUESTED: 'Yêu cầu hoàn trả đã được ghi nhận',
  RETURN_APPROVED: 'Yêu cầu hoàn trả đã được duyệt',
  RETURNING: 'Hàng đang trên đường gửi về cửa hàng',
};

export const REFUND_STATUS: Record<OrderRefundStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Đang xử lý', tone: 'attention' },
  REQUIRED: { label: 'Chờ chuyển tiền', tone: 'attention' },
  PROCESSING: { label: 'Đang xử lý', tone: 'attention' },
  COMPLETED: { label: 'Đã hoàn', tone: 'done' },
  FAILED: { label: 'Chưa thành công', tone: 'error' },
  CANCELLED: { label: 'Đã hủy', tone: 'closed' },
};

export const REFUND_KIND_LABELS: Record<OrderRefundKind, string> = {
  GOODS: 'Tiền hàng',
  SHIPPING: 'Phí ship ban đầu',
};

/** BE có thể trả Decimal dạng chuỗi; trả 0 khi không đọc được. */
export function toVnd(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** Sự kiện thuộc luồng đổi trả & hoàn tiền: báo lỗi, duyệt, gửi hàng về, hoàn tiền. */
export function isReturnHistoryEvent(event: Pick<IOrderHistoryEvent, 'type' | 'toStatus'>): boolean {
  if (event.toStatus && RETURN_HISTORY_STATUSES.includes(event.toStatus)) return true;
  return /ISSUE|REFUND|RETURN/.test(event.type ?? '');
}

/**
 * "Chưa nhận được tiền hoàn" chỉ mở khi shop đã chốt hoàn tiền và còn trong 7 ngày
 * kể từ lần hoàn gần nhất (khớp assertRefundNotReceivedEligible của BE).
 */
export function canReportRefundNotReceived(
  order: { refundStatus?: string | null; refunds?: IOrderRefund[] | null },
  now: number = Date.now(),
): boolean {
  if (order.refundStatus !== 'COMPLETED') return false;
  const refundedAt = (order.refunds ?? [])
    .filter((refund) => refund.status === 'COMPLETED')
    .map((refund) => new Date(refund.processedAt ?? refund.requestedAt).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  if (refundedAt === undefined) return false;
  return now - refundedAt <= ISSUE_WINDOW_MS;
}

export function hasOpenRefundNotReceivedIssue(
  issues: { reason: OrderIssueReason; status: OrderIssueStatus }[],
): boolean {
  return issues.some(
    (issue) => issue.reason === 'REFUND_NOT_RECEIVED' && (issue.status === 'PENDING' || issue.status === 'APPROVED'),
  );
}

const REFUND_EVIDENCE_KEYS = ['reference', 'note', 'transactionId', 'message', 'receiptUrl', 'imageUrl'];

/** Mã giao dịch / ghi chú của chứng từ hoàn tiền; ảnh chứng từ hiện riêng. */
export function formatRefundEvidence(evidence: unknown): string | null {
  if (evidence === null || evidence === undefined) return null;
  if (typeof evidence === 'string') return evidence.trim() || null;
  if (typeof evidence !== 'object') return String(evidence);
  if (Array.isArray(evidence)) {
    const parts = evidence.map(formatRefundEvidence).filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  const record = evidence as Record<string, unknown>;
  for (const key of REFUND_EVIDENCE_KEYS) {
    const text = formatRefundEvidence(record[key]);
    if (text) return text;
  }
  return null;
}

export function getRefundEvidenceImages(evidence: RefundEvidence | undefined): string[] {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return [];
  const value = evidence.receiptImages;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
export const MAX_EVIDENCE_IMAGES = 10;
export const ISSUE_DESCRIPTION_MIN = 10;
export const ISSUE_DESCRIPTION_MAX = 2000;

// Yêu cầu ở các trạng thái này chặn báo lỗi lại cho cùng món (khớp BE).
const BLOCKING_ISSUE_STATUSES: readonly OrderIssueStatus[] = ['PENDING', 'APPROVED', 'RESOLVED'];

interface OrderHistoryLike {
  toStatus?: string | null;
  type?: string | null;
  occurredAt?: string | null;
}

export interface ReportableOrderLike {
  status?: string | null;
  history?: OrderHistoryLike[] | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export function isReturnFlowStatus(status?: string | null): boolean {
  return RETURN_FLOW_STATUSES.includes(String(status ?? '').toUpperCase());
}

/** Lần gần nhất đơn chuyển sang COMPLETED; không có thì lấy updatedAt như BE. */
export function getOrderCompletedAt(order: ReportableOrderLike): string | null {
  const completedEvents = (order.history ?? []).filter(
    (event) => event.toStatus === 'COMPLETED' || Boolean(event.type?.includes('COMPLETED')),
  );
  const latest = completedEvents
    .filter((event) => event.occurredAt)
    .sort((a, b) => new Date(b.occurredAt as string).getTime() - new Date(a.occurredAt as string).getTime())[0];
  return latest?.occurredAt ?? order.updatedAt ?? order.createdAt ?? null;
}

/** Đơn đã hoàn tất hoặc đang trong luồng trả hàng, và còn trong 7 ngày. */
export function canReportOrderIssue(order: ReportableOrderLike, now: number = Date.now()): boolean {
  const status = String(order.status ?? '').toUpperCase();
  if (status !== 'COMPLETED' && !isReturnFlowStatus(status)) return false;
  const completedAt = getOrderCompletedAt(order);
  if (!completedAt) return true;
  const completedTime = new Date(completedAt).getTime();
  if (Number.isNaN(completedTime)) return true;
  return now - completedTime <= ISSUE_WINDOW_MS;
}

export function getBlockedReportItemIds(
  issues: { status: OrderIssueStatus; orderItemId: string | number }[],
): Set<string> {
  return new Set(
    issues
      .filter((issue) => BLOCKING_ISSUE_STATUSES.includes(issue.status))
      .map((issue) => String(issue.orderItemId)),
  );
}

export interface IssueFormInput {
  description: string;
  imageCount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isRefundMode: boolean;
}

/** Kiểm form theo đúng luật của CreateOrderIssueDto; trả câu lỗi đầu tiên hoặc null. */
export function validateIssueForm(input: IssueFormInput): string | null {
  const description = input.description.trim();
  if (description.length < ISSUE_DESCRIPTION_MIN) {
    return `Vui lòng nhập mô tả chi tiết ít nhất ${ISSUE_DESCRIPTION_MIN} ký tự.`;
  }
  if (description.length > ISSUE_DESCRIPTION_MAX) {
    return `Mô tả không được vượt quá ${ISSUE_DESCRIPTION_MAX} ký tự.`;
  }
  if (input.imageCount === 0) {
    return input.isRefundMode
      ? 'Vui lòng tải lên ít nhất 1 ảnh sao kê / chứng từ.'
      : 'Vui lòng tải lên ít nhất 1 ảnh minh chứng lỗi.';
  }
  if (!input.bankName.trim()) {
    return 'Vui lòng nhập tên ngân hàng nhận hoàn tiền.';
  }
  if (!/^[0-9]{6,20}$/.test(input.accountNumber.trim())) {
    return 'Số tài khoản phải gồm 6-20 chữ số.';
  }
  if (!input.accountHolder.trim()) {
    return 'Vui lòng nhập tên chủ tài khoản.';
  }
  return null;
}
