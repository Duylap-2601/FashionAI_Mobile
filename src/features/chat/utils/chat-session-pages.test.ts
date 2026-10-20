import { removeSessionFromPages } from '@/features/chat/utils/chat-session-pages';

const makePages = () => ({
  pageParams: [1, 2],
  pages: [
    {
      data: [
        { id: 's1', title: 'Phiên 1', updatedAt: '2026-10-10T00:00:00.000Z' },
        { id: 's2', title: 'Phiên 2', updatedAt: '2026-10-09T00:00:00.000Z' },
      ],
      meta: { total: 3, page: 1, limit: 2, totalPages: 2 },
    },
    {
      data: [{ id: 's3', title: 'Phiên 3', updatedAt: '2026-10-08T00:00:00.000Z' }],
      meta: { total: 3, page: 2, limit: 2, totalPages: 2 },
    },
  ],
});

describe('removeSessionFromPages', () => {
  it('removes the session from every page and decrements meta.total', () => {
    const result = removeSessionFromPages(makePages(), 's1');

    expect(result?.pages[0].data.map((item) => item.id)).toEqual(['s2']);
    expect(result?.pages[1].data.map((item) => item.id)).toEqual(['s3']);
    expect(result?.pages.every((page) => page.meta.total === 2)).toBe(true);
  });

  it('removes a session that sits on a later page', () => {
    const result = removeSessionFromPages(makePages(), 's3');

    expect(result?.pages[0].data.map((item) => item.id)).toEqual(['s1', 's2']);
    expect(result?.pages[1].data).toEqual([]);
  });

  it('never lets meta.total go below zero', () => {
    const data = makePages();
    data.pages[0].meta.total = 0;
    data.pages[1].meta.total = 0;

    const result = removeSessionFromPages(data, 's2');

    expect(result?.pages.every((page) => page.meta.total === 0)).toBe(true);
  });

  it('returns undefined for undefined input', () => {
    expect(removeSessionFromPages(undefined, 's1')).toBeUndefined();
  });
});
