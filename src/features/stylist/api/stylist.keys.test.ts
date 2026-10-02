import { stylistKeys } from './stylist.keys';

describe('stylist query keys', () => {
  it('keeps history pages and details under stable feature roots', () => {
    expect(stylistKeys.all).toEqual(['stylist']);
    expect(stylistKeys.histories()).toEqual(['stylist', 'history']);
    expect(stylistKeys.history({ limit: 20 })).toEqual([
      'stylist',
      'history',
      { limit: 20 },
    ]);
    expect(stylistKeys.detail('result-1')).toEqual([
      'stylist',
      'detail',
      'result-1',
    ]);
  });
});
