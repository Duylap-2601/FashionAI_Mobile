import type { OrderIssueStatus } from '../types/order';

/** BE chỉ nhận báo lỗi trong 7 ngày kể từ khi đơn hoàn tất (order-issues.service.ts). */
export const ISSUE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const RETURN_FLOW_STATUSES: readonly string[] = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNING'];
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
