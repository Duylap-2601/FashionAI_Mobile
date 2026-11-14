import type { QueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/features/chat/hooks/chat-keys';
import {
  QUOTA_QUERY_KEYS,
  SUBSCRIPTION_QUERY_KEYS,
  USER_PROFILE_QUERY_KEY,
} from '../hooks/use-subscription';

/**
 * Các cache quyết định quyền lợi của user sau khi mua/nâng cấp gói:
 * - `['my-subscription']` — gói hiện tại (hạng, hạn dùng, nhắc gia hạn)
 * - `['subscription-history']` — mọi trang lịch sử mua/gia hạn
 * - `['quota']` — prefix của quota theo từng action (`['quota', 'TRY_ON']`, `['quota', 'STYLIST']`, ...)
 * - `['live-try-on-quota']` — quota riêng của thử đồ trực tiếp
 * - `['chat', 'quota']` — quota chat AI của badge trong ChatScreen
 * - `['users', 'me']` — hồ sơ (tier, tierExpiresAt) dùng ở Profile và màn Gói thành viên
 *
 * `invalidateQueries` khớp theo prefix nên `['quota']` làm mới mọi action.
 */
export const SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS = [
  SUBSCRIPTION_QUERY_KEYS.mySubscription,
  SUBSCRIPTION_QUERY_KEYS.historyAll,
  QUOTA_QUERY_KEYS.all,
  QUOTA_QUERY_KEYS.liveTryOn,
  chatKeys.quota(),
  USER_PROFILE_QUERY_KEY,
] as const;

/**
 * Làm mới quyền lợi sau khi thanh toán gói thành công (không gọi HTTP trực tiếp,
 * chỉ đánh dấu stale và refetch những query đang được màn hình khác theo dõi).
 */
export function invalidateSubscriptionEntitlement(queryClient: QueryClient): Promise<unknown> {
  return Promise.all(
    SUBSCRIPTION_ENTITLEMENT_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
