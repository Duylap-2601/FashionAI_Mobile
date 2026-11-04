import type { StatusTone } from '@/features/orders/components/ToneLabel';
import { PlanCardData, PlanQuota, SubscriptionFaqItem } from '../types/subscription';

/**
 * Dự phòng khi GET /payments/plans lỗi. Khi có dữ liệu API, tên gói, giá, thời hạn và
 * lượt dùng lấy từ API (xem useSubscriptionPlans). Cùng nội dung DEFAULT_PLANS của web.
 */
export const DEFAULT_PLANS: PlanCardData[] = [
  {
    id: 'FREE',
    name: 'Miễn phí',
    priceText: '0đ',
    numericPrice: 0,
    periodText: 'không thời hạn',
    description: 'Dùng AI Stylist và chat AI mỗi ngày, lưu số đo và đặt may.',
    features: [
      { text: 'Chưa có lượt Thử đồ AI bằng ảnh' },
      { text: '3 lượt AI Stylist mỗi ngày' },
      { text: '50 tin nhắn chat AI mỗi ngày' },
      { text: 'Lưu trữ số đo cơ thể cá nhân' },
      { text: 'Đặt may theo số đo' },
    ],
    ctaText: 'Gói hiện tại',
  },
  {
    id: 'MEMBER',
    name: 'Member',
    priceText: '34.000đ',
    numericPrice: 34000,
    periodText: '/ 30 ngày',
    description: 'Dành cho khách hàng muốn trải nghiệm thử đồ AI và tư vấn phối đồ mỗi ngày',
    features: [
      { text: '5 lượt Thử đồ AI mỗi ngày', highlight: true },
      { text: '20 lượt AI Stylist mỗi ngày', highlight: true },
      { text: '200 tin nhắn chat AI mỗi ngày', highlight: true },
      { text: 'Phối bộ khi thử đồ, mỗi món 1 lượt' },
    ],
    ctaText: 'Chọn Member',
  },
  {
    id: 'VIP',
    name: 'VIP',
    priceText: '99.000đ',
    numericPrice: 99000,
    periodText: '/ 30 ngày',
    description: 'Dành cho tín đồ thời trang cao cấp cần thử đồ nhiều lần và hỗ trợ stylist không giới hạn',
    features: [
      { text: '10 lượt Thử đồ AI mỗi ngày', highlight: true },
      { text: 'AI Stylist không giới hạn', highlight: true },
      { text: 'Chat AI không giới hạn', highlight: true },
      { text: 'Phối bộ khi thử đồ, mỗi món 1 lượt' },
    ],
    ctaText: 'Chọn VIP',
  },
];

/** Hàng so sánh lượt dùng, đọc từ `quotas` của GET /payments/plans. */
export const QUOTA_ROWS: { action: string; label: string; unit: string }[] = [
  { action: 'TRY_ON', label: 'Thử đồ AI bằng ảnh', unit: 'lượt' },
  { action: 'STYLIST', label: 'AI Stylist', unit: 'lượt' },
  { action: 'CHATBOT', label: 'Chat AI', unit: 'tin nhắn' },
];

export const QUOTA_NOT_INCLUDED = 'Không có';

export function formatQuota(quota: PlanQuota | undefined, unit: string): string {
  if (!quota) return QUOTA_NOT_INCLUDED;
  if (quota.unlimited || quota.limit === null) return 'Không giới hạn';
  if (quota.limit === 0) return QUOTA_NOT_INCLUDED;
  return `${quota.limit} ${unit} / ngày`;
}

// Trả lời theo hành vi backend: trừ lượt theo số món, gia hạn nối tiếp, nhắc trước 3 ngày.
export const SUBSCRIPTION_FAQS: SubscriptionFaqItem[] = [
  {
    question: 'Lượt thử đồ được tính thế nào?',
    answer:
      'Mỗi món trong một lần thử bằng ảnh tính 1 lượt, nên phối 3 món tính 3 lượt. Lượt làm mới mỗi ngày. Thử trực tiếp qua camera tính theo thời gian, không trừ lượt thử bằng ảnh.',
  },
  {
    question: 'Gia hạn khi gói còn hạn thì sao?',
    answer:
      'Mua thêm cùng gói khi còn hạn thì 30 ngày mới nối tiếp sau ngày hết hạn hiện tại, không mất ngày nào.',
  },
  {
    question: 'Có tự động trừ tiền không?',
    answer:
      'Không. Mỗi lần mua hoặc gia hạn là một lần thanh toán riêng. Nếu bật nhắc gia hạn, bạn nhận email nhắc trước 3 ngày khi gói sắp hết hạn.',
  },
];

/** Nhãn trạng thái gói (chấm màu + chữ in hoa), cùng bảng nhãn của web. */
export const SUBSCRIPTION_STATUS_LABELS: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'done' },
  SCHEDULED: { label: 'Chờ kích hoạt', tone: 'attention' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'closed' },
  CANCELLED: { label: 'Đã hủy', tone: 'closed' },
};

export function getSubscriptionStatusLabel(status: string): { label: string; tone: StatusTone } {
  return SUBSCRIPTION_STATUS_LABELS[status] ?? { label: status, tone: 'closed' };
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  FREE: 'Miễn phí',
  MEMBER: 'Member',
  VIP: 'VIP',
};
