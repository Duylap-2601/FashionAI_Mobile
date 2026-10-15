import { PlanCardData, QuotaComparisonRow, SubscriptionFaqItem } from '../types/subscription';

export const DEFAULT_PLANS: PlanCardData[] = [
  {
    id: 'FREE',
    name: 'Miễn Phí',
    priceText: '0đ',
    numericPrice: 0,
    periodText: 'mãi mãi',
    description: 'Trải nghiệm cơ bản tư vấn phong cách cùng FashionAI',
    features: [
      { text: '0 lượt Thử đồ AI (Try-on cơ bản)' },
      { text: '3 lượt AI Stylist / ngày' },
      { text: '50 tin nhắn Chatbot AI / ngày' },
      { text: 'Lưu trữ số đo cơ thể cá nhân' },
      { text: 'Đặt may đo Made-to-measure' },
    ],
    ctaText: 'Gói hiện tại',
  },
  {
    id: 'MEMBER',
    name: 'Hội Viên (Member)',
    priceText: '34.000đ',
    numericPrice: 34000,
    periodText: '/ 30 ngày',
    badge: 'Phổ biến nhất',
    isPopular: true,
    description: 'Dành cho khách hàng muốn trải nghiệm thử đồ AI và tư vấn phối đồ mỗi ngày',
    features: [
      { text: '5 lượt Thử đồ AI (Try-on) / ngày', highlight: true },
      { text: '20 lượt AI Stylist / ngày', highlight: true },
      { text: '200 tin nhắn Chatbot AI / ngày', highlight: true },
      { text: 'Hỗ trợ thử combo 2 món (Áo + Quần)' },
    ],
    ctaText: 'Nâng cấp Member',
  },
  {
    id: 'VIP',
    name: 'Khách Hàng VIP',
    priceText: '99.000đ',
    numericPrice: 99000,
    periodText: '/ 30 ngày',
    badge: 'Cao cấp nhất',
    description: 'Dành cho tín đồ thời trang cao cấp cần thử đồ nhiều lần và hỗ trợ stylist không giới hạn',
    features: [
      { text: '10 lượt Thử đồ AI (Try-on) / ngày', highlight: true },
      { text: 'Không giới hạn AI Stylist (Unlimited)', highlight: true },
      { text: 'Không giới hạn Chatbot AI (Unlimited)', highlight: true },
      { text: 'Hỗ trợ thử combo 2 món (Áo + Quần)' }
    ],
    ctaText: 'Nâng cấp VIP',
  },
];

export const QUOTA_COMPARISON: QuotaComparisonRow[] = [
  {
    featureName: 'Thử đồ AI (Try-on)',
    free: '0 (Không hỗ trợ)',
    member: '5 lượt / ngày',
    vip: '10 lượt / ngày',
  },
  {
    featureName: 'Thử combo 2 món (Áo + Quần)',
    free: '✕',
    member: '✓ (Trừ 2 lượt)',
    vip: '✓ (Trừ 2 lượt)',
  },
  {
    featureName: 'AI Stylist tư vấn may đo',
    free: '3 lượt / ngày',
    member: '20 lượt / ngày',
    vip: 'Không giới hạn (∞)',
  },
  {
    featureName: 'Chatbot tư vấn phối đồ',
    free: '50 tin / ngày',
    member: '200 tin / ngày',
    vip: 'Không giới hạn (∞)',
  },
  {
    featureName: 'Tốc độ render Try-on',
    free: '—',
    member: 'Tiêu chuẩn',
    vip: 'Ưu tiên cao (High Priority)',
  },
];

export const SUBSCRIPTION_FAQS: SubscriptionFaqItem[] = [
  {
    question: 'Lượt Thử đồ AI (Try-on) được tính như thế nào?',
    answer:
      'Mỗi lần bạn gửi yêu cầu thử 1 món đơn sẽ trừ 1 lượt. Khi thử combo 2 món (Áo + Quần), hệ thống xử lý 2 giai đoạn và trừ 2 lượt quota. Hạn mức được tự động làm mới vào 00:00 (nửa đêm) mỗi ngày theo giờ Việt Nam.',
  },
  {
    question: 'Chính sách gia hạn cộng dồn thời gian ra sao?',
    answer:
      'Nếu gói Member của bạn còn 10 ngày và bạn mua gia hạn cùng gói Member, 30 ngày mới sẽ được nối tiếp vào sau ngày hết hạn cũ (tổng cộng 40 ngày).',
  },
  {
    question: 'Thanh toán qua SePay VietQR hoạt động thế nào?',
    answer:
      'Bạn quét mã VietQR tự động qua ứng dụng ngân hàng hoặc ví điện tử bất kỳ. Sau khi chuyển khoản đúng nội dung, gói cước sẽ được kích hoạt tức thì trong vòng 5 giây.',
  },
];
