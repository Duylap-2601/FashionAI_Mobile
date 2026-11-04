import React, { act } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSearchHistory, type SearchHistory } from './use-search-history';
import { SEARCH_HISTORY_KEY } from '../utils/search-history';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
afterAll(() => Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));

interface TestNode {
  props: { value?: SearchHistory };
}
interface TestTree {
  root: { findByType(type: string): TestNode };
  unmount(): void;
}
const { create } = jest.requireActual('react-test-renderer') as {
  create(element: React.ReactElement): TestTree;
};

const storage = jest.mocked(AsyncStorage);
let tree: TestTree | null = null;

// Exposes the hook result as a prop so tests can read the latest value.
function Harness() {
  return React.createElement('probe', { value: useSearchHistory() });
}

const result = {
  get current(): SearchHistory {
    const value = tree?.root.findByType('probe').props.value;
    if (!value) throw new Error('Harness is not rendered');
    return value;
  },
};

async function renderHook() {
  await act(async () => {
    tree = create(<Harness />);
  });
}

async function stored(): Promise<unknown> {
  const raw = await storage.getItem(SEARCH_HISTORY_KEY);
  return raw === null ? null : JSON.parse(raw);
}

beforeEach(async () => {
  await storage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => tree?.unmount());
  tree = null;
});

it('loads the history saved on the device', async () => {
  await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Blazer', '', 'Đầm lụa']));
  await renderHook();
  expect(result.current.history).toEqual(['Blazer', 'Đầm lụa']);
});

it('saves a submitted term first, without case duplicates', async () => {
  await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['áo sơ mi', 'Blazer']));
  await renderHook();

  await act(() => result.current.addHistory('  Áo Sơ Mi '));

  expect(result.current.history).toEqual(['Áo Sơ Mi', 'Blazer']);
  expect(await stored()).toEqual(['Áo Sơ Mi', 'Blazer']);
});

it('ignores blank terms without writing to storage', async () => {
  await renderHook();
  await act(() => result.current.addHistory('   '));
  expect(result.current.history).toEqual([]);
  expect(storage.setItem).not.toHaveBeenCalled();
});

it('removes one term and clears everything', async () => {
  await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Blazer', 'Đầm lụa', 'Vest']));
  await renderHook();

  await act(() => result.current.removeHistory('Đầm lụa'));
  expect(result.current.history).toEqual(['Blazer', 'Vest']);
  expect(await stored()).toEqual(['Blazer', 'Vest']);

  await act(() => result.current.clearHistory());
  expect(result.current.history).toEqual([]);
  expect(storage.removeItem).toHaveBeenCalledWith(SEARCH_HISTORY_KEY);
  expect(await stored()).toBeNull();
});

it('keeps terms added before the stored history finished loading', async () => {
  await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Blazer']));
  let finishLoading: () => void = () => {};
  storage.getItem.mockImplementationOnce(
    () =>
      new Promise<string | null>((resolve) => {
        finishLoading = () => resolve(JSON.stringify(['Blazer']));
      }),
  );

  await renderHook();
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = result.current.addHistory('Vest');
  });
  await act(async () => {
    finishLoading();
    await pending;
  });

  expect(result.current.history).toEqual(['Vest', 'Blazer']);
  expect(await stored()).toEqual(['Vest', 'Blazer']);
});

it('still works for the session when storage fails', async () => {
  storage.getItem.mockRejectedValueOnce(new Error('read failed'));
  storage.setItem.mockRejectedValueOnce(new Error('write failed'));
  await renderHook();
  expect(result.current.history).toEqual([]);

  await act(() => result.current.addHistory('Blazer'));
  expect(result.current.history).toEqual(['Blazer']);

  storage.removeItem.mockRejectedValueOnce(new Error('remove failed'));
  await act(() => result.current.clearHistory());
  expect(result.current.history).toEqual([]);
});
