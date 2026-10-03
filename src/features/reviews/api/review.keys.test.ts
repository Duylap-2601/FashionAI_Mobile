import { normalizeReviewFilters, reviewKeys } from './review.keys';

describe('review query keys', () => {
  it('normalizes unsupported filter values out of stable keys', () => {
    expect(normalizeReviewFilters({ limit: 10, rating: 7 as 5 })).toEqual({ limit: 10 });
    expect(normalizeReviewFilters({ limit: 10, rating: 5 })).toEqual({
      limit: 10,
      rating: 5,
    });
  });

  it('keeps product, stats, and current-user caches independently targetable', () => {
    expect(reviewKeys.productList('p1', { limit: 10, rating: 4 })).toEqual([
      'reviews',
      'product',
      'p1',
      { limit: 10, rating: 4 },
    ]);
    expect(reviewKeys.stats('p1')).toEqual(['reviews', 'stats', 'p1']);
    expect(reviewKeys.myList({ limit: 10 })).toEqual([
      'reviews',
      'mine',
      { limit: 10 },
    ]);
  });
});
