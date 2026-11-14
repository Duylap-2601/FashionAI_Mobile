import {
  SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS,
  invalidateSubscriptionEntitlement,
} from './refresh-entitlement';
import { SUBSCRIPTION_QUERY_KEYS, QUOTA_QUERY_KEYS, USER_PROFILE_QUERY_KEY } from '../hooks/use-subscription';

describe('subscription entitlement refresh', () => {
  it('covers subscription, history, quota, live try-on quota and profile keys', () => {
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toEqual([
      ['my-subscription'],
      ['subscription-history'],
      ['quota'],
      ['live-try-on-quota'],
      ['chat', 'quota'],
      ['users', 'me'],
    ]);
  });

  it('reuses the shared constants instead of re-typed literals', () => {
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toContain(SUBSCRIPTION_QUERY_KEYS.mySubscription);
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toContain(SUBSCRIPTION_QUERY_KEYS.historyAll);
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toContain(QUOTA_QUERY_KEYS.all);
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toContain(QUOTA_QUERY_KEYS.liveTryOn);
    expect(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS).toContain(USER_PROFILE_QUERY_KEY);
  });

  it('keeps every history page under the invalidated prefix', () => {
    expect(SUBSCRIPTION_QUERY_KEYS.history(1, 20).slice(0, 1)).toEqual([
      ...SUBSCRIPTION_QUERY_KEYS.historyAll,
    ]);
  });

  it('invalidates each key once through the query client', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as any;

    await invalidateSubscriptionEntitlement(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS.length);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-subscription'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['quota'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['live-try-on-quota'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
  });
});
