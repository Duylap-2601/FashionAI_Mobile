import type { InfiniteData } from '@tanstack/react-query';
import type { IChatSessionPage } from '@/features/chat/types/chat';

export type SessionPages = InfiniteData<IChatSessionPage>;

/** Bỏ 1 phiên khỏi mọi trang cache (optimistic delete) và giảm meta.total tương ứng. */
export function removeSessionFromPages(
  data: SessionPages | undefined,
  sessionId: string,
): SessionPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((item) => item.id !== sessionId),
      meta: {
        ...page.meta,
        total: Math.max(0, page.meta.total - 1),
      },
    })),
  };
}
