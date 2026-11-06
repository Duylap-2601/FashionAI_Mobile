import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addSearchHistoryTerm,
  parseSearchHistory,
  removeSearchHistoryTerm,
  SEARCH_HISTORY_KEY,
} from '../utils/search-history';

async function readStoredHistory(): Promise<string[]> {
  try {
    return parseSearchHistory(await AsyncStorage.getItem(SEARCH_HISTORY_KEY));
  } catch {
    return [];
  }
}

async function writeStoredHistory(history: string[]): Promise<void> {
  try {
    if (history.length === 0) {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } else {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    }
  } catch {
    // Storage is a convenience: the in-memory history keeps working.
  }
}

export interface SearchHistory {
  history: string[];
  addHistory: (term: string) => Promise<void>;
  removeHistory: (term: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * Recent search terms saved on this device. Changes made before the stored
 * history finishes loading are applied on top of it, never overwritten by it.
 * If storage fails the history still works for the current session.
 */
export function useSearchHistory(): SearchHistory {
  const [history, setHistory] = useState<string[]>([]);
  const historyRef = useRef<string[]>([]);
  const loadingRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (!loadingRef.current) {
      loadingRef.current = readStoredHistory().then((stored) => {
        historyRef.current = stored;
        if (mountedRef.current) setHistory(stored);
      });
    }
    return loadingRef.current;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void ensureLoaded();
    return () => {
      mountedRef.current = false;
    };
  }, [ensureLoaded]);

  const update = useCallback(
    async (change: (current: string[]) => string[]) => {
      await ensureLoaded();
      const current = historyRef.current;
      const next = change(current);
      if (next === current) return;

      historyRef.current = next;
      if (mountedRef.current) setHistory(next);
      await writeStoredHistory(next);
    },
    [ensureLoaded],
  );

  const addHistory = useCallback(
    (term: string) => update((current) => addSearchHistoryTerm(current, term)),
    [update],
  );

  const removeHistory = useCallback(
    (term: string) =>
      update((current) => removeSearchHistoryTerm(current, term)),
    [update],
  );

  const clearHistory = useCallback(
    () => update((current) => (current.length === 0 ? current : [])),
    [update],
  );

  return { history, addHistory, removeHistory, clearHistory };
}
