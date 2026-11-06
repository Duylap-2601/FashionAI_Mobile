import type { IOrderRefund } from '../types/order';
import {
  ISSUE_WINDOW_MS,
  canReportOrderIssue,
  canReportRefundNotReceived,
  formatRefundEvidence,
  getBlockedReportItemIds,
  getOrderCompletedAt,
  getRefundEvidenceImages,
  hasOpenRefundNotReceivedIssue,
  isReturnHistoryEvent,
  toVnd,
  validateIssueForm,
} from './order-returns';

const NOW = new Date('2026-11-04T10:00:00.000Z').getTime();
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

describe('getOrderCompletedAt', () => {
  it('takes the latest COMPLETED event', () => {
    expect(
      getOrderCompletedAt({
        updatedAt: daysAgo(0),
        history: [
          { toStatus: 'COMPLETED', occurredAt: daysAgo(10) },
          { toStatus: 'SHIPPING', occurredAt: daysAgo(1) },
          { toStatus: 'COMPLETED', occurredAt: daysAgo(2) },
        ],
      }),
    ).toBe(daysAgo(2));
  });

  it('falls back to updatedAt like the backend', () => {
    expect(getOrderCompletedAt({ updatedAt: daysAgo(3), history: [] })).toBe(daysAgo(3));
  });
});

describe('canReportOrderIssue', () => {
  it('allows a completed order inside the 7-day window', () => {
    expect(
      canReportOrderIssue({ status: 'COMPLETED', history: [{ toStatus: 'COMPLETED', occurredAt: daysAgo(6) }] }, NOW),
    ).toBe(true);
  });

  it('blocks a completed order after 7 days', () => {
    expect(
      canReportOrderIssue({ status: 'COMPLETED', history: [{ toStatus: 'COMPLETED', occurredAt: daysAgo(8) }] }, NOW),
    ).toBe(false);
  });

  it('allows the return flow so other items can still be reported', () => {
    expect(
      canReportOrderIssue(
        { status: 'RETURN_REQUESTED', history: [{ toStatus: 'COMPLETED', occurredAt: daysAgo(1) }] },
        NOW,
      ),
    ).toBe(true);
  });

  it.each(['CREATED', 'PAID', 'TAILORING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'])(
    'blocks status %s',
    (status) => {
      expect(canReportOrderIssue({ status, updatedAt: daysAgo(0) }, NOW)).toBe(false);
    },
  );

  it('treats exactly 7 days as still inside the window', () => {
    const completedAt = new Date(NOW - ISSUE_WINDOW_MS).toISOString();
    expect(canReportOrderIssue({ status: 'COMPLETED', updatedAt: completedAt }, NOW)).toBe(true);
  });
});

describe('getBlockedReportItemIds', () => {
  it('blocks items with a pending, approved or resolved issue', () => {
    const blocked = getBlockedReportItemIds([
      { orderItemId: 'a', status: 'PENDING' },
      { orderItemId: 'b', status: 'APPROVED' },
      { orderItemId: 'c', status: 'RESOLVED' },
      { orderItemId: 'd', status: 'REJECTED' },
    ]);
    expect([...blocked].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('validateIssueForm', () => {
  const valid = {
    description: 'Áo lệch vai trái khoảng 4cm',
    imageCount: 1,
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountHolder: 'NGUYEN VAN A',
    isRefundMode: false,
  };

  it('accepts a complete form', () => {
    expect(validateIssueForm(valid)).toBeNull();
  });

  it('requires at least 10 characters of description', () => {
    expect(validateIssueForm({ ...valid, description: '  ngắn  ' })).toMatch(/ít nhất 10 ký tự/);
  });

  it('rejects descriptions over 2000 characters', () => {
    expect(validateIssueForm({ ...valid, description: 'a'.repeat(2001) })).toMatch(/2000/);
  });

  it('requires an evidence image, worded per mode', () => {
    expect(validateIssueForm({ ...valid, imageCount: 0 })).toMatch(/ảnh minh chứng/);
    expect(validateIssueForm({ ...valid, imageCount: 0, isRefundMode: true })).toMatch(/sao kê/);
  });

  it('requires the bank account like the backend DTO', () => {
    expect(validateIssueForm({ ...valid, bankName: ' ' })).toMatch(/ngân hàng/);
    expect(validateIssueForm({ ...valid, accountNumber: '12345' })).toMatch(/6-20 chữ số/);
    expect(validateIssueForm({ ...valid, accountNumber: '01234abc89' })).toMatch(/6-20 chữ số/);
    expect(validateIssueForm({ ...valid, accountHolder: '' })).toMatch(/chủ tài khoản/);
  });
});

describe('canReportRefundNotReceived', () => {
  const refund = (overrides: Partial<IOrderRefund>): IOrderRefund => ({
    id: 'r1',
    amountVnd: 100000,
    status: 'COMPLETED',
    requestedAt: daysAgo(3),
    processedAt: daysAgo(2),
    ...overrides,
  });

  it('allows it within 7 days of the latest completed refund', () => {
    expect(
      canReportRefundNotReceived(
        { refundStatus: 'COMPLETED', refunds: [refund({ processedAt: daysAgo(10) }), refund({ id: 'r2', processedAt: daysAgo(6) })] },
        NOW,
      ),
    ).toBe(true);
  });

  it('uses requestedAt when processedAt is missing', () => {
    expect(
      canReportRefundNotReceived({ refundStatus: 'COMPLETED', refunds: [refund({ processedAt: null, requestedAt: daysAgo(1) })] }, NOW),
    ).toBe(true);
  });

  it('blocks it after 7 days, before the refund is completed, or without completed refunds', () => {
    expect(canReportRefundNotReceived({ refundStatus: 'COMPLETED', refunds: [refund({ processedAt: daysAgo(8) })] }, NOW)).toBe(false);
    expect(canReportRefundNotReceived({ refundStatus: 'PROCESSING', refunds: [refund({})] }, NOW)).toBe(false);
    expect(canReportRefundNotReceived({ refundStatus: 'COMPLETED', refunds: [refund({ status: 'REQUIRED' })] }, NOW)).toBe(false);
  });
});

describe('hasOpenRefundNotReceivedIssue', () => {
  it('only counts open refund-not-received issues', () => {
    expect(hasOpenRefundNotReceivedIssue([{ reason: 'REFUND_NOT_RECEIVED', status: 'PENDING' }])).toBe(true);
    expect(hasOpenRefundNotReceivedIssue([{ reason: 'REFUND_NOT_RECEIVED', status: 'RESOLVED' }])).toBe(false);
    expect(hasOpenRefundNotReceivedIssue([{ reason: 'WRONG_SIZE', status: 'PENDING' }])).toBe(false);
  });
});

describe('refund evidence', () => {
  it('reads the transaction reference and receipt images', () => {
    const evidence = { reference: 'FT2611040001', receiptImages: ['https://cdn/a.jpg', '', 3] };
    expect(formatRefundEvidence(evidence)).toBe('FT2611040001');
    expect(getRefundEvidenceImages(evidence)).toEqual(['https://cdn/a.jpg']);
  });

  it('never prints raw objects', () => {
    expect(formatRefundEvidence({ receiptImages: ['https://cdn/a.jpg'] })).toBeNull();
    expect(formatRefundEvidence('  ')).toBeNull();
    expect(getRefundEvidenceImages('FT2611040001')).toEqual([]);
  });
});

describe('isReturnHistoryEvent', () => {
  it('keeps return statuses and issue/refund events only', () => {
    expect(isReturnHistoryEvent({ toStatus: 'RETURNED' })).toBe(true);
    expect(isReturnHistoryEvent({ type: 'ORDER_ISSUE_CREATED' })).toBe(true);
    expect(isReturnHistoryEvent({ type: 'REFUND_COMPLETED' })).toBe(true);
    expect(isReturnHistoryEvent({ type: 'STATUS_CHANGED', toStatus: 'SHIPPING' })).toBe(false);
  });
});

describe('toVnd', () => {
  it('reads numbers and decimal strings', () => {
    expect(toVnd(769700)).toBe(769700);
    expect(toVnd('769700.00')).toBe(769700);
    expect(toVnd(null)).toBe(0);
    expect(toVnd('abc')).toBe(0);
  });
});
