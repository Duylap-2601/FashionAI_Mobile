import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { subscriptionsApi } from './subscriptions.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T, meta?: any) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  meta,
});

describe('subscriptionsApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('getPlans fetches plans list and unwraps data', async () => {
    const plansData = [
      { tier: 'FREE', label: 'Miễn phí', price: 0, durationDays: 0, quotas: [] },
      { tier: 'MEMBER', label: 'Hội viên', price: 34000, durationDays: 30, quotas: [] },
      { tier: 'VIP', label: 'VIP', price: 99000, durationDays: 30, quotas: [] },
    ];

    mock.onGet(ENDPOINTS.PAYMENTS.PLANS).reply(200, envelope(plansData));

    const result = await subscriptionsApi.getPlans();
    expect(result).toEqual(plansData);
  });

  it('getMySubscription fetches user subscription detail', async () => {
    const subData = {
      tier: 'MEMBER',
      tierExpiresAt: '2026-11-15T00:00:00.000Z',
      isFree: false,
      current: {
        id: 'sub-1',
        tier: 'MEMBER',
        status: 'ACTIVE',
        autoRenew: true,
        startsAt: '2026-10-15T00:00:00.000Z',
        expiresAt: '2026-11-15T00:00:00.000Z',
        daysRemaining: 30,
        price: 34000,
      },
      scheduled: null,
    };

    mock.onGet(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_ME).reply(200, envelope(subData));

    const result = await subscriptionsApi.getMySubscription();
    expect(result.tier).toBe('MEMBER');
    expect(result.current?.daysRemaining).toBe(30);
  });

  it('getSubscriptionHistory fetches paged history', async () => {
    const items = [
      {
        id: 'sub-hist-1',
        tier: 'MEMBER',
        status: 'ACTIVE',
        autoRenew: true,
        startsAt: '2026-10-15T00:00:00.000Z',
        expiresAt: '2026-11-15T00:00:00.000Z',
        createdAt: '2026-10-15T00:00:00.000Z',
      },
    ];
    const meta = { total: 1, page: 1, limit: 20, totalPages: 1 };

    mock.onGet(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_HISTORY).reply(200, envelope(items, meta));

    const result = await subscriptionsApi.getSubscriptionHistory(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('cancelAutoRenew posts to cancel endpoint', async () => {
    const updated = {
      id: 'sub-1',
      tier: 'MEMBER',
      status: 'ACTIVE',
      autoRenew: false,
      startsAt: '2026-10-15T00:00:00.000Z',
      expiresAt: '2026-11-15T00:00:00.000Z',
      daysRemaining: 30,
    };

    mock.onPost(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_CANCEL).reply(200, envelope(updated));

    const result = await subscriptionsApi.cancelAutoRenew();
    expect(result.autoRenew).toBe(false);
  });

  it('resumeAutoRenew posts to resume endpoint', async () => {
    const updated = {
      id: 'sub-1',
      tier: 'MEMBER',
      status: 'ACTIVE',
      autoRenew: true,
      startsAt: '2026-10-15T00:00:00.000Z',
      expiresAt: '2026-11-15T00:00:00.000Z',
      daysRemaining: 30,
    };

    mock.onPost(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS_RESUME).reply(200, envelope(updated));

    const result = await subscriptionsApi.resumeAutoRenew();
    expect(result.autoRenew).toBe(true);
  });

  it('checkout creates payment link for targetTier', async () => {
    const checkoutRes = {
      orderId: 'ord-sub-1',
      orderCode: 1001,
      amount: 99000,
      targetTier: 'VIP',
      kind: 'SUBSCRIPTION',
      provider: 'SEPAY',
      checkoutUrl: 'https://checkout.sepay.vn/pay/1001',
    };

    mock.onPost(ENDPOINTS.PAYMENTS.CHECKOUT).reply(200, envelope(checkoutRes));

    const result = await subscriptionsApi.checkout({ targetTier: 'VIP', provider: 'SEPAY' });
    expect(result.orderId).toBe('ord-sub-1');
    expect(result.targetTier).toBe('VIP');
    expect(result.checkoutUrl).toBe('https://checkout.sepay.vn/pay/1001');
  });
});
