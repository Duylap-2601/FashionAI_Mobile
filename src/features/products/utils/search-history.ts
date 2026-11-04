// Search history rules mirror FE `useSearchHistory`
// (FashionAI_FE/src/features/products/hooks/useSearchHistory.ts).

// Mobile keeps its existing storage key so history saved by earlier app
// versions is still shown after the update.
export const SEARCH_HISTORY_KEY = '@fashionai_search_history';

// Same cap as FE `MAX_HISTORY_ITEMS`.
export const MAX_SEARCH_HISTORY_ITEMS = 12;

/** Reads stored history, dropping anything that is not a non-empty string. */
export function parseSearchHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

/**
 * Puts the trimmed term first, removes earlier entries that differ only by
 * letter case, and keeps the newest `MAX_SEARCH_HISTORY_ITEMS`. Blank terms
 * leave the history unchanged (same array).
 */
export function addSearchHistoryTerm(history: string[], term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return history;
  const lowered = trimmed.toLowerCase();
  const rest = history.filter((item) => item.toLowerCase() !== lowered);
  return [trimmed, ...rest].slice(0, MAX_SEARCH_HISTORY_ITEMS);
}

/** Removes the exact entry the user dismissed. */
export function removeSearchHistoryTerm(history: string[], term: string): string[] {
  return history.filter((item) => item !== term);
}
