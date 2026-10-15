export type SubscriptionTier = 'FREE' | 'MEMBER' | 'VIP';

export type TargetTier = 'MEMBER' | 'VIP';

export type SubscriptionStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'CANCELLED';

export interface PlanQuota {
  action: 'TRY_ON' | 'STYLIST' | 'CHATBOT' | string;
  label: string;
  limit: number | null;
  unlimited: boolean;
}

export interface PlanItem {
  tier: SubscriptionTier;
  label: string;
  price: number;
  durationDays: number;
  quotas: PlanQuota[];
}

export interface SubscriptionDetail {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  autoRenew: boolean;
  startsAt: string;
  expiresAt: string;
  daysRemaining: number;
  price?: number;
  order?: {
    orderCode: number;
    amount: number;
    createdAt?: string;
  };
}

export interface MySubscriptionResponse {
  tier: SubscriptionTier;
  tierExpiresAt: string | null;
  isFree: boolean;
  current: SubscriptionDetail | null;
  scheduled: SubscriptionDetail | null;
}

export interface SubscriptionHistoryItem {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  autoRenew: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  order?: {
    orderCode: number;
    amount: number;
    createdAt?: string;
  };
}

export interface SubscriptionHistoryResponse {
  items: SubscriptionHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CheckoutResponse {
  orderId: string;
  orderCode?: number;
  amount?: number;
  targetTier?: string;
  kind?: string;
  provider?: string;
  checkoutUrl?: string;
  payUrl?: string;
  qrCode?: string;
  paymentId?: string;
  proration?: any;
}

export interface PlanFeature {
  text: string;
  highlight?: boolean;
}

export interface PlanCardData {
  id: SubscriptionTier;
  name: string;
  priceText: string;
  numericPrice: number;
  periodText: string;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features: PlanFeature[];
  ctaText: string;
}

export interface QuotaComparisonRow {
  featureName: string;
  free: string;
  member: string;
  vip: string;
}

export interface SubscriptionFaqItem {
  question: string;
  answer: string;
}
