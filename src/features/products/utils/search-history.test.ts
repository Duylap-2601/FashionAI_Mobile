import {
  addSearchHistoryTerm,
  MAX_SEARCH_HISTORY_ITEMS,
  parseSearchHistory,
  removeSearchHistoryTerm,
} from './search-history';

describe('parseSearchHistory', () => {
  it('returns an empty list for missing or broken data', () => {
    expect(parseSearchHistory(null)).toEqual([]);
    expect(parseSearchHistory('')).toEqual([]);
    expect(parseSearchHistory('{not json')).toEqual([]);
    expect(parseSearchHistory('{"term":"blazer"}')).toEqual([]);
  });

  it('keeps only non-empty strings', () => {
    expect(
      parseSearchHistory(JSON.stringify(['Blazer', '', '   ', 42, null, 'Đầm lụa'])),
    ).toEqual(['Blazer', 'Đầm lụa']);
  });
});

describe('addSearchHistoryTerm', () => {
  it('adds the trimmed term to the front', () => {
    expect(addSearchHistoryTerm(['Đầm lụa'], '  Blazer công sở  ')).toEqual([
      'Blazer công sở',
      'Đầm lụa',
    ]);
  });

  it('replaces an earlier entry that differs only by letter case', () => {
    expect(
      addSearchHistoryTerm(['Đầm lụa', 'áo sơ mi', 'Blazer'], 'Áo Sơ Mi'),
    ).toEqual(['Áo Sơ Mi', 'Đầm lụa', 'Blazer']);
  });

  it(`keeps at most ${MAX_SEARCH_HISTORY_ITEMS} entries`, () => {
    const full = Array.from({ length: MAX_SEARCH_HISTORY_ITEMS }, (_, i) => `term ${i}`);
    const next = addSearchHistoryTerm(full, 'mới nhất');
    expect(next).toHaveLength(MAX_SEARCH_HISTORY_ITEMS);
    expect(next[0]).toBe('mới nhất');
    expect(next).not.toContain(`term ${MAX_SEARCH_HISTORY_ITEMS - 1}`);
  });

  it('ignores blank terms and returns the same list', () => {
    const history = ['Blazer'];
    expect(addSearchHistoryTerm(history, '   ')).toBe(history);
  });
});

describe('removeSearchHistoryTerm', () => {
  it('removes only the exact entry', () => {
    expect(removeSearchHistoryTerm(['Blazer', 'blazer x', 'Đầm'], 'Blazer')).toEqual([
      'blazer x',
      'Đầm',
    ]);
  });
});
